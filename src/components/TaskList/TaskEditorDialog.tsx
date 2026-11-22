import { useId } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { TaskEditor } from './TaskEditor'
import type { TaskEditorValue, TaskUpdate } from './TaskEditor'
import styles from './TaskEditor.module.css'

export interface TaskEditorDialogProps {
  open: boolean
  task: TaskEditorValue
  tagOptions: readonly string[]
  onSave: (update: TaskUpdate) => void
  onClose: (restoreFocus?: boolean) => void
  id?: string
}

/**
 * One centred editor for every task in the app: the daily row and the quest
 * row both mount this, so there is a single form, a single validation and a
 * single focus contract. The page behind is blurred and never reflows.
 */
export function TaskEditorDialog({
  open,
  task,
  tagOptions,
  onSave,
  onClose,
  id,
}: TaskEditorDialogProps) {
  const headingId = useId()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      id={id}
      ariaLabelledby={headingId}
    >
      <h3 id={headingId} className={styles.dialogTitle}>
        Edit task
      </h3>
      <TaskEditor
        task={task}
        tagOptions={tagOptions}
        onSave={onSave}
        onCancel={() => onClose(true)}
      />
    </Dialog>
  )
}
