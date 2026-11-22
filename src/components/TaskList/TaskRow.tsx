import { useId, useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import { Icon } from '../Icon/Icon'
import { TaskEditorDialog } from './TaskEditorDialog'
import type { TaskUpdate } from './TaskEditor'
import styles from './TaskRow.module.css'

export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  note?: string
  done: boolean
  due?: string
  overdue?: boolean
  tags?: string[]
  priority?: TaskPriority
}

export interface TaskRowProps {
  task: Task
  onToggle: (id: string, done: boolean) => void
  /** Passing it adds the pencil; without it the row stays read-only. */
  onUpdate?: (id: string, update: TaskUpdate) => void
  /** The global tag catalogue offered by the editor. */
  tagOptions?: readonly string[]
  onDelete?: (id: string) => void
  className?: string
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low priority',
  normal: 'Normal priority',
  high: 'High priority',
}

export function TaskRow({
  task,
  onToggle,
  onUpdate,
  tagOptions = [],
  onDelete,
  className,
}: TaskRowProps) {
  const autoId = useId()
  const inputId = `task-${task.id}-${autoId}`
  const editorId = `task-editor-${autoId}`
  const priority = task.priority ?? 'normal'
  const priorityId = `${inputId}-priority`
  const overdueId = `${inputId}-overdue`
  /*
    The diamond and the red date encode priority and lateness on their own,
    so the same facts are mirrored in hidden text and referenced from the
    checkbox: WCAG 1.4.1 (never colour alone) and a real name for screen
    readers in focus mode. The `title` stays as a pointer aid only.
  */
  const describedBy = cx(priorityId, task.overdue ? overdueId : undefined)
  const nameId = `${inputId}-name`
  const action = `${task.done ? 'Uncheck' : 'Check'} “${task.title}”`

  const [editing, setEditing] = useState(false)
  const editButton = useRef<HTMLButtonElement>(null)

  const closeEditor = (restoreFocus?: boolean) => {
    setEditing(false)
    /* The pencil is still mounted: Escape and Save hand the focus back to it. */
    if (restoreFocus) editButton.current?.focus()
  }

  return (
    <li
      className={cx(styles.row, className)}
      data-done={task.done ? 'true' : 'false'}
      data-overdue={task.overdue ? 'true' : undefined}
      data-editing={editing ? 'true' : undefined}
    >
      {/*
        One labelling mechanism: a single native `<label>` wraps the box and
        the row body, so the whole row stays clickable. The checkbox name is
        an explicit reference to the hidden action phrase inside that same
        label, which keeps the exact “Check/Uncheck ‘title’” name and the
        visible title inside it (WCAG 2.5.3). The old `aria-label` on the
        input plus two `<label for>` elements made axe unable to decide the
        name (`form-field-multiple-labels`).
      */}
      <label htmlFor={inputId} className={styles.control}>
        <span id={nameId} className="visually-hidden">
          {action}
        </span>
        <input
          id={inputId}
          type="checkbox"
          checked={task.done}
          aria-labelledby={nameId}
          aria-describedby={describedBy}
          onChange={(event) => onToggle(task.id, event.target.checked)}
          className={styles.input}
        />
        <span className={styles.box} aria-hidden="true">
          <Icon name="check" size="xs" className={styles.check} />
        </span>

        <span className={styles.body}>
          <span className={styles.line}>
            <span className={styles.title}>
              <span
                className={styles.priority}
                data-priority={priority}
                title={PRIORITY_LABEL[priority]}
                aria-hidden="true"
              />
              <span id={priorityId} className="visually-hidden">
                {PRIORITY_LABEL[priority]}.
              </span>
              <span>{task.title}</span>
            </span>
            {task.overdue ? (
              <span id={overdueId} className="visually-hidden">
                Overdue.
              </span>
            ) : null}
            {task.due ? <span className={styles.due}>{task.due}</span> : null}
          </span>
          {task.note || task.tags?.length ? (
            <span className={styles.meta}>
              {task.note ? <span className={styles.note}>{task.note}</span> : null}
              {task.tags?.length
                ? task.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      <Icon name="tag" size="sm" aria-hidden="true" />
                      {tag}
                    </span>
                  ))
                : null}
            </span>
          ) : null}
        </span>
      </label>

      {onUpdate || onDelete ? (
        <div className={styles.actions}>
          {onUpdate ? (
            <button
              ref={editButton}
              type="button"
              className={cx(styles.action, styles.edit)}
              aria-label={`Edit “${task.title}”`}
              aria-haspopup="dialog"
              aria-expanded={editing}
              aria-controls={editing ? editorId : undefined}
              onClick={() => (editing ? closeEditor(true) : setEditing(true))}
            >
              <Icon name="edit" size="sm" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className={cx(styles.action, styles.delete)}
              aria-label={`Delete “${task.title}”`}
              onClick={() => onDelete(task.id)}
            >
              <Icon name="trash" size="sm" />
            </button>
          ) : null}
        </div>
      ) : null}

      {onUpdate ? (
        <TaskEditorDialog
          id={editorId}
          open={editing}
          task={task}
          tagOptions={tagOptions}
          onSave={(update) => {
            onUpdate(task.id, update)
            closeEditor(true)
          }}
          onClose={closeEditor}
        />
      ) : null}
    </li>
  )
}
