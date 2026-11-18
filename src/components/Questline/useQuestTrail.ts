import { useLayoutEffect, useState, type RefObject } from 'react'
import { isQuestNodeComplete, type QuestNode } from './questline-model'

export interface QuestTrailPath {
  d: string
  done: boolean
}

export interface QuestTrail {
  width: number
  height: number
  paths: QuestTrailPath[]
}

const EMPTY: QuestTrail = { width: 0, height: 0, paths: [] }

/* Geometry of the route bend: art detail, not a design-system measure. */
const BEND_GAP = 8
const BEND_RADIUS = 6

interface TrailPoint {
  cx: number
  cy: number
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * A wrapped rail has no CSS selector for «last in row», so the route is
 * measured and drawn in an SVG behind the stops. Wrapping keeps the line
 * connected: the trail leaves the row, drops into the gap between rows and
 * comes back to the first stop of the next one.
 */
function buildBend(
  a: TrailPoint,
  b: TrailPoint,
  xRight: number,
  xLeft: number,
  midY: number,
): string {
  const radius = Math.max(
    0,
    Math.min(
      BEND_RADIUS,
      (midY - a.cy) / 2,
      (b.cy - midY) / 2,
      (xRight - xLeft) / 2,
      xRight - a.cx,
      b.cx - xLeft,
    ),
  )

  if (radius < 1) {
    return `M ${a.cx} ${a.cy} H ${xRight} V ${midY} H ${xLeft} V ${b.cy} H ${b.cx}`
  }

  return [
    `M ${a.cx} ${a.cy}`,
    `H ${xRight - radius}`,
    `Q ${xRight} ${a.cy} ${xRight} ${a.cy + radius}`,
    `V ${midY - radius}`,
    `Q ${xRight} ${midY} ${xRight - radius} ${midY}`,
    `H ${xLeft + radius}`,
    `Q ${xLeft} ${midY} ${xLeft} ${midY + radius}`,
    `V ${b.cy - radius}`,
    `Q ${xLeft} ${b.cy} ${xLeft + radius} ${b.cy}`,
    `H ${b.cx}`,
  ].join(' ')
}

function sameTrail(previous: QuestTrail, next: QuestTrail): boolean {
  if (
    previous.width !== next.width ||
    previous.height !== next.height ||
    previous.paths.length !== next.paths.length
  ) {
    return false
  }
  return previous.paths.every(
    (path, index) =>
      path.d === next.paths[index].d && path.done === next.paths[index].done,
  )
}

export function useQuestTrail(
  railRef: RefObject<HTMLOListElement | null>,
  stopRefs: RefObject<Array<HTMLLIElement | null>>,
  markerRefs: RefObject<Array<HTMLSpanElement | null>>,
  nodes: QuestNode[],
): QuestTrail {
  const [trail, setTrail] = useState<QuestTrail>(EMPTY)

  useLayoutEffect(() => {
    const rail = railRef.current
    /*
      jsdom implements no layout and no ResizeObserver: the route simply stays
      empty there. Nothing in the component depends on its geometry.
    */
    if (!rail || typeof ResizeObserver === 'undefined') return

    let frame = 0

    const measure = () => {
      const railRect = rail.getBoundingClientRect()
      if (railRect.width <= 0 || railRect.height <= 0) return

      const stops = stopRefs.current.slice(0, nodes.length)
      const markers = markerRefs.current.slice(0, nodes.length)

      if (stops.length < 2 || markers.length < 2) {
        setTrail((previous) => (previous === EMPTY ? previous : EMPTY))
        return
      }

      const points: Array<TrailPoint | null> = markers.map((marker, index) => {
        const stop = stops[index]
        if (!marker || !stop) return null
        const markerRect = marker.getBoundingClientRect()
        const stopRect = stop.getBoundingClientRect()
        return {
          cx: markerRect.left - railRect.left + markerRect.width / 2,
          cy: markerRect.top - railRect.top + markerRect.height / 2,
          left: stopRect.left - railRect.left,
          right: stopRect.right - railRect.left,
          top: stopRect.top - railRect.top,
          bottom: stopRect.bottom - railRect.top,
        }
      })

      /* Rows are exactly the groups of stops that share a marker height. */
      const rows: number[][] = []
      points.forEach((point, index) => {
        if (!point) return
        const row = rows[rows.length - 1]
        const first = row ? points[row[0]] : null
        if (row && first && Math.abs(first.cy - point.cy) < 1) {
          row.push(index)
          return
        }
        rows.push([index])
      })

      const paths: QuestTrailPath[] = []
      for (let index = 0; index < points.length - 1; index += 1) {
        const a = points[index]
        const b = points[index + 1]
        if (!a || !b) continue

        const rowA = rows.find((row) => row.includes(index))
        const rowB = rows.find((row) => row.includes(index + 1))
        if (!rowA || !rowB) continue

        const done = isQuestNodeComplete(nodes[index])
        if (rowA === rowB) {
          paths.push({ d: `M ${a.cx} ${a.cy} H ${b.cx}`, done })
          continue
        }

        const xRight = Math.min(
          railRect.width - 1,
          Math.max(...rowA.map((position) => points[position]?.right ?? a.right)) + BEND_GAP,
        )
        const xLeft = Math.max(
          1,
          Math.min(...rowB.map((position) => points[position]?.left ?? b.left)) - BEND_GAP,
        )
        const rowBottom = Math.max(
          ...rowA.map((position) => points[position]?.bottom ?? a.bottom),
        )
        const rowTop = Math.min(...rowB.map((position) => points[position]?.top ?? b.top))
        const midY = (rowBottom + rowTop) / 2

        paths.push({ d: buildBend(a, b, xRight, xLeft, midY), done })
      }

      const next: QuestTrail = {
        width: Math.round(railRect.width),
        height: Math.round(railRect.height),
        paths,
      }
      setTrail((previous) => (sameTrail(previous, next) ? previous : next))
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(rail)
    stopRefs.current.forEach((stop) => stop && observer.observe(stop))
    markerRefs.current.forEach((marker) => marker && observer.observe(marker))
    measure()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [nodes, railRef, stopRefs, markerRefs])

  return trail
}
