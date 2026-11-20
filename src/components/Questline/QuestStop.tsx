import { Icon } from '../Icon/Icon'
import {
  formatQuestNumber,
  type QuestDeadline,
  type QuestNode,
  type QuestNodeState,
} from './questline-model'
import { STATE_META } from './questline-state'
import styles from './Questline.module.css'

export interface QuestStopProps {
  node: QuestNode
  index: number
  total: number
  state: QuestNodeState
  deadline: QuestDeadline
  tally: { done: number; total: number }
  open: boolean
  panelId: string
  onToggle: () => void
  stopRef: (element: HTMLLIElement | null) => void
  markerRef: (element: HTMLSpanElement | null) => void
  triggerRef: (element: HTMLButtonElement | null) => void
}

/*
   The rail keeps the numbers short: state lives in the marker, the icon and
   a screen-reader word, while the italic line carries progress and date.
*/
function stopMeta(
  tally: { done: number; total: number },
  deadline: QuestDeadline,
): string {
  const parts = [tally.total ? `${tally.done} of ${tally.total}` : 'No tasks']
  if (deadline.tone !== 'none') parts.push(deadline.shortLabel)
  return parts.join(' · ')
}

/** One milestone on the rail: disclosure trigger, marker and state line. */
export function QuestStop({
  node,
  index,
  total,
  state,
  deadline,
  tally,
  open,
  panelId,
  onToggle,
  stopRef,
  markerRef,
  triggerRef,
}: QuestStopProps) {
  const isGoal = index === total - 1
  const meta = `${isGoal ? 'Goal · ' : ''}${stopMeta(tally, deadline)}`
  const stateIcon = isGoal ? 'flag' : STATE_META[state].icon
  const overdue = deadline.tone === 'overdue'

  return (
    <li
      ref={stopRef}
      className={styles.stop}
      data-state={state}
      data-open={open ? 'true' : undefined}
      data-overdue={overdue ? 'true' : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
      >
        <span className="visually-hidden">Milestone {index + 1}.</span>
        <span ref={markerRef} className={styles.marker} aria-hidden="true">
          {formatQuestNumber(index + 1)}
        </span>
        <span className={styles.stopTitle}>{node.title}</span>
        <span className={styles.stopMeta}>
          <span className="visually-hidden">{STATE_META[state].word}</span>
          {stateIcon ? <Icon name={stateIcon} size="xs" aria-hidden="true" /> : null}
          <span>{meta}</span>
        </span>
      </button>
    </li>
  )
}
