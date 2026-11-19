import { useRef, type ReactNode, type RefObject } from 'react'
import { EmptyState } from '../EmptyState/EmptyState'
import { QuestStop } from './QuestStop'
import {
  getQuestDeadline,
  type QuestNode,
  type QuestNodeState,
} from './questline-model'
import { useQuestTrail } from './useQuestTrail'
import { domFragment } from './questline-dom'
import styles from './Questline.module.css'

export interface QuestRailProps {
  nodes: QuestNode[]
  states: QuestNodeState[]
  tallies: Array<{ done: number; total: number }>
  today: Date
  openId: string | null
  baseId: string
  routeLabel: string
  emptyState?: ReactNode
  /** Owned by the chain: the panel returns the focus to these triggers. */
  triggerRefs: RefObject<Array<HTMLButtonElement | null>>
  onToggleNode: (nodeId: string) => void
}

/**
 * The measured rail. It owns the stop and marker refs because only the trail
 * needs them; the chain still owns the trigger refs for returning focus.
 */
export function QuestRail({
  nodes,
  states,
  tallies,
  today,
  openId,
  baseId,
  routeLabel,
  emptyState,
  triggerRefs,
  onToggleNode,
}: QuestRailProps) {
  const railRef = useRef<HTMLOListElement>(null)
  const stopRefs = useRef<Array<HTMLLIElement | null>>([])
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([])
  const trail = useQuestTrail(railRef, stopRefs, markerRefs, nodes)

  if (!nodes.length) {
    return (
      <div className={styles.emptyWrap}>
        {emptyState ?? (
          <EmptyState
            icon="scroll"
            title="La ruta está en blanco"
            description="Añade el primer hito y la travesía empezará a dibujarse."
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.railWrap}>
      <ol className={styles.rail} ref={railRef} aria-label={routeLabel || 'Hitos'}>
        {nodes.map((node, index) => {
          const state = states[index]
          const deadline = getQuestDeadline(
            node.deadline,
            state === 'complete',
            today,
          )
          const panelId = `${baseId}-${index}-${domFragment(node.id)}-panel`

          return (
            <QuestStop
              key={node.id}
              node={node}
              index={index}
              total={nodes.length}
              state={state}
              deadline={deadline}
              tally={tallies[index]}
              open={node.id === openId}
              panelId={panelId}
              onToggle={() => onToggleNode(node.id)}
              stopRef={(element) => {
                stopRefs.current[index] = element
              }}
              markerRef={(element) => {
                markerRefs.current[index] = element
              }}
              triggerRef={(element) => {
                triggerRefs.current[index] = element
              }}
            />
          )
        })}
      </ol>

      {trail.paths.length ? (
        <svg
          className={styles.trail}
          width={trail.width}
          height={trail.height}
          aria-hidden="true"
          focusable="false"
        >
          {trail.paths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              className={path.done ? styles.trailDone : styles.trailPending}
            />
          ))}
        </svg>
      ) : null}
    </div>
  )
}
