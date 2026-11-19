import type { RefObject } from 'react'
import { Button } from '../Button/Button'
import styles from './QuestNodePanel.module.css'

export interface QuestDeleteConfirmProps {
  title: string
  taskCount: number
  /** Focus lands on Cancel while the confirmation is open. */
  cancelRef: RefObject<HTMLSpanElement | null>
  onConfirm: () => void
  onCancel: () => void
}

/** Two-step deletion: the irreversible action never sits under the pointer. */
export function QuestDeleteConfirm({
  title,
  taskCount,
  cancelRef,
  onConfirm,
  onCancel,
}: QuestDeleteConfirmProps) {
  return (
    <div
      className={styles.confirm}
      role="group"
      aria-label="Confirm milestone deletion"
    >
      <p className={styles.confirmText} role="alert">
        Delete “{title}”
        {taskCount
          ? ` and its ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`
          : ''}
        ? This cannot be undone.
      </p>
      <Button variant="danger" size="sm" onClick={onConfirm}>
        Yes, delete the milestone
      </Button>
      <span ref={cancelRef}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </span>
    </div>
  )
}
