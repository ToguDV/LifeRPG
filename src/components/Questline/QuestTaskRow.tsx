import { useId, useRef, useState } from 'react'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { Icon } from '../Icon/Icon'
import { TaskEditorDialog } from '../TaskList/TaskEditorDialog'
import type { TaskUpdate } from '../TaskList/TaskEditor'
import type { QuestTask } from './questline-model'
import styles from './QuestNodePanel.module.css'

export interface QuestTaskRowProps {
  task: QuestTask
  /** A locked milestone can prepare tasks but cannot tick them. */
  locked: boolean
  /** The catalogue shared with the daily list. */
  tagOptions: readonly string[]
  rowRef: (element: HTMLLIElement | null) => void
  onUpdate: (update: TaskUpdate) => void
  onToggle: (done: boolean) => void
  onDelete: () => void
}

/**
 * One quest inside the milestone sheet. The editor is the same floating form the
 * daily list uses, so title, labels and description behave identically and
 * opening it never pushes the list down.
 */
export function QuestTaskRow({
  task,
  locked,
  tagOptions,
  rowRef,
  onUpdate,
  onToggle,
  onDelete,
}: QuestTaskRowProps) {
  const autoId = useId()
  const editorId = `quest-task-editor-${autoId}`
  const [editing, setEditing] = useState(false)
  const editAnchor = useRef<HTMLSpanElement>(null)

  const closeEditor = (restoreFocus?: boolean) => {
    setEditing(false)
    if (restoreFocus) {
      editAnchor.current?.querySelector('button')?.focus()
    }
  }

  return (
    <li
      ref={rowRef}
      className={styles.task}
      data-editing={editing ? 'true' : undefined}
    >
      <div className={styles.taskBody}>
        <Checkbox
          label={task.title}
          checked={task.done}
          disabled={locked}
          strikeWhenChecked
          onChange={(event) => onToggle(event.target.checked)}
        />
        {task.note || task.tags?.length ? (
          <div className={styles.taskMeta}>
            {task.note ? <span className={styles.taskNote}>{task.note}</span> : null}
            {task.tags?.map((tag) => (
              <span key={tag} className={styles.taskTag}>
                <Icon name="tag" size="sm" aria-hidden="true" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.taskTools}>
        <span ref={editAnchor}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={`Edit “${task.title}”`}
            aria-haspopup="dialog"
            aria-expanded={editing}
            aria-controls={editing ? editorId : undefined}
            iconLeft={<Icon name="edit" size="sm" />}
            onClick={() => (editing ? closeEditor(true) : setEditing(true))}
          />
        </span>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={`Delete “${task.title}”`}
          iconLeft={<Icon name="trash" size="sm" />}
          onClick={onDelete}
        />
      </div>

      <TaskEditorDialog
        id={editorId}
        open={editing}
        task={task}
        tagOptions={tagOptions}
        onSave={(update) => {
          onUpdate(update)
          closeEditor(true)
        }}
        onClose={closeEditor}
      />
    </li>
  )
}
