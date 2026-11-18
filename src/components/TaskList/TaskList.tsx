import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { EmptyState } from '../EmptyState/EmptyState'
import { TaskRow } from './TaskRow'
import type { Task } from './TaskRow'
import styles from './TaskList.module.css'

export interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string, done: boolean) => void
  onDelete?: (id: string) => void
  ariaLabel?: string
  emptyState?: ReactNode
  className?: string
}

export function TaskList({
  tasks,
  onToggle,
  onDelete,
  ariaLabel = 'Tareas',
  emptyState,
  className,
}: TaskListProps) {
  if (!tasks.length) {
    return (
      <div className={cx(styles.emptyWrap, className)}>
        {emptyState ?? (
          <EmptyState
            icon="feather"
            title="Nada pendiente"
            description="El diario está en blanco. Añade una tarea y la nieve traerá otra."
          />
        )}
      </div>
    )
  }

  return (
    <ul className={cx(styles.list, className)} aria-label={ariaLabel}>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
