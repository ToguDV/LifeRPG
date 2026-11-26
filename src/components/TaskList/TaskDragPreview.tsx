import type { Ref } from 'react'
import { Icon } from '../Icon/Icon'
import { useSurface } from '../Surface/surface-context'
import type { Task } from './TaskRow'
import styles from './TaskDragPreview.module.css'

export interface TaskDragPreviewProps {
  task: Task
  width: number
  /** Viewport position and tilt, owned by the list so moves do not re-render. */
  transform: string
  ref?: Ref<HTMLDivElement>
}

/**
 * The slip that follows the pointer while a task is carried. It is a
 * decorative echo of the row, not a second control surface: no checkbox, no
 * buttons and no tab stop. `data-surface` keeps the material right when the
 * list lives on paper or on the dark panel.
 */
export function TaskDragPreview({
  task,
  width,
  transform,
  ref,
}: TaskDragPreviewProps) {
  const surface = useSurface()
  const priority = task.priority ?? 'normal'

  return (
    <div
      ref={ref}
      className={styles.preview}
      data-surface={surface}
      data-drag-preview
      data-done={task.done ? 'true' : 'false'}
      aria-hidden="true"
      style={{ width, transform }}
    >
      <span className={styles.grip}>
        <Icon name="drag" size="sm" />
      </span>
      <span className={styles.box} data-done={task.done ? 'true' : 'false'}>
        {task.done ? <Icon name="check" size="xs" /> : null}
      </span>

      <span className={styles.body}>
        <span className={styles.line}>
          <span className={styles.title}>
            <span className={styles.priority} data-priority={priority} />
            <span>{task.title}</span>
          </span>
          {task.due ? <span className={styles.due}>{task.due}</span> : null}
        </span>

        {task.note || task.tags?.length ? (
          <span className={styles.meta}>
            {task.note ? <span className={styles.note}>{task.note}</span> : null}
            {task.tags?.map((tag) => (
              <span key={tag} className={styles.tag}>
                <Icon name="tag" size="sm" />
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </div>
  )
}
