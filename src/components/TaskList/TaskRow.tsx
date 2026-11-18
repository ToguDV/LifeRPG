import { useId } from 'react'
import { cx } from '../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './TaskRow.module.css'

export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  note?: string
  done: boolean
  due?: string
  overdue?: boolean
  tag?: string
  priority?: TaskPriority
}

export interface TaskRowProps {
  task: Task
  onToggle: (id: string, done: boolean) => void
  onDelete?: (id: string) => void
  className?: string
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Prioridad baja',
  normal: 'Prioridad media',
  high: 'Prioridad alta',
}

export function TaskRow({ task, onToggle, onDelete, className }: TaskRowProps) {
  const autoId = useId()
  const inputId = `task-${task.id}-${autoId}`
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

  return (
    <li
      className={cx(styles.row, className)}
      data-done={task.done ? 'true' : 'false'}
      data-overdue={task.overdue ? 'true' : undefined}
    >
      <span className={styles.boxWrap}>
        <input
          id={inputId}
          type="checkbox"
          checked={task.done}
          aria-label={`${task.done ? 'Desmarcar' : 'Marcar'} «${task.title}»`}
          aria-describedby={describedBy}
          onChange={(event) => onToggle(task.id, event.target.checked)}
          className={styles.input}
        />
        <label htmlFor={inputId} className={styles.boxLabel}>
          <span className={styles.box} aria-hidden="true">
            <Icon name="check" size="xs" className={styles.check} />
          </span>
        </label>
      </span>

      <label htmlFor={inputId} className={styles.body}>
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
              Vencida.
            </span>
          ) : null}
          {task.due ? <span className={styles.due}>{task.due}</span> : null}
        </span>
        {task.note || task.tag ? (
          <span className={styles.meta}>
            {task.note ? <span className={styles.note}>{task.note}</span> : null}
            {task.tag ? (
              <span className={styles.tag}>
                <Icon name="tag" size="xs" aria-hidden="true" />
                {task.tag}
              </span>
            ) : null}
          </span>
        ) : null}
      </label>

      {onDelete ? (
        <button
          type="button"
          className={styles.delete}
          aria-label={`Eliminar «${task.title}»`}
          onClick={() => onDelete(task.id)}
        >
          <Icon name="trash" size="sm" />
        </button>
      ) : null}
    </li>
  )
}
