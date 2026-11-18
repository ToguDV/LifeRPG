import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

export type FloatingSide = 'top' | 'bottom'
export type FloatingAlign = 'start' | 'center' | 'end'

interface UseFloatingOptions {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  floatingRef: RefObject<HTMLElement | null>
  side?: FloatingSide
  align?: FloatingAlign
  gap?: number
  matchWidth?: boolean
  minWidth?: number
  maxWidth?: number
  viewportPadding?: number
}

interface FloatingState {
  style: CSSProperties
  side: FloatingSide
}

const HIDDEN: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  visibility: 'hidden',
}

/**
 * Anchors a fixed-position surface to a trigger. Fixed positioning lets
 * menus escape paper cards with `overflow` and filter stacking contexts.
 * Repositions on scroll, resize and content size changes.
 */
export function useFloating({
  open,
  anchorRef,
  floatingRef,
  side: preferredSide = 'bottom',
  align = 'start',
  gap = 6,
  matchWidth = false,
  minWidth,
  maxWidth,
  viewportPadding = 8,
}: UseFloatingOptions): FloatingState {
  const [state, setState] = useState<FloatingState>({ style: HIDDEN, side: preferredSide })

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return

    const anchorRect = anchor.getBoundingClientRect()
    const floatingRect = floating.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const measuredWidth = floatingRect.width || anchorRect.width
    const desiredWidth = matchWidth
      ? anchorRect.width
      : Math.max(minWidth ?? 0, measuredWidth)
    const clampedWidth = Math.min(
      Math.max(desiredWidth, minWidth ?? 0),
      (maxWidth ?? viewportWidth) - viewportPadding * 2,
    )

    const measuredHeight = floatingRect.height || 280
    const availableBelow = viewportHeight - anchorRect.bottom - gap - viewportPadding
    const availableAbove = anchorRect.top - gap - viewportPadding
    const needed = Math.min(measuredHeight, 320)

    const canFitBelow = availableBelow >= needed
    const side: FloatingSide = canFitBelow
      ? 'bottom'
      : availableAbove > availableBelow
        ? 'top'
        : 'bottom'

    const available = side === 'bottom' ? availableBelow : availableAbove
    const maxHeight = Math.max(120, available)
    const renderedHeight = Math.min(measuredHeight, maxHeight)

    let left =
      align === 'end'
        ? anchorRect.right - clampedWidth
        : align === 'center'
          ? anchorRect.left + anchorRect.width / 2 - clampedWidth / 2
          : anchorRect.left
    left = Math.min(
      Math.max(viewportPadding, left),
      viewportWidth - clampedWidth - viewportPadding,
    )

    const top =
      side === 'bottom'
        ? anchorRect.bottom + gap
        : Math.max(viewportPadding, anchorRect.top - gap - renderedHeight)

    setState({
      side,
      style: {
        position: 'fixed',
        top,
        left,
        width: matchWidth ? clampedWidth : undefined,
        minWidth: matchWidth ? undefined : clampedWidth,
        maxWidth: viewportWidth - viewportPadding * 2,
        maxHeight,
        visibility: 'visible',
      },
    })
  }, [align, anchorRef, floatingRef, gap, matchWidth, maxWidth, minWidth, preferredSide, viewportPadding])

  useLayoutEffect(() => {
    if (!open) {
      setState({ style: HIDDEN, side: preferredSide })
      return
    }

    update()
    const frame = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frame)
  }, [open, preferredSide, update])

  useEffect(() => {
    if (!open) return

    const onScroll = () => update()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.visualViewport?.addEventListener('resize', onScroll)
    window.visualViewport?.addEventListener('scroll', onScroll)

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => update()) : null
    if (observer) {
      if (anchorRef.current) observer.observe(anchorRef.current)
      if (floatingRef.current) observer.observe(floatingRef.current)
    }

    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.visualViewport?.removeEventListener('resize', onScroll)
      window.visualViewport?.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [floatingRef, open, update])

  return state
}
