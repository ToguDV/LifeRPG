import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import {
  moveBeside,
  moveOneStep,
  sameOrder,
  type DropSide,
} from '../../lib/reorder'
import { EmptyState } from '../EmptyState/EmptyState'
import { TaskDragPreview } from './TaskDragPreview'
import { TaskRow } from './TaskRow'
import type { Task, TaskSortable } from './TaskRow'
import type { TaskUpdate } from './TaskEditor'
import styles from './TaskList.module.css'

/*
  A pointer that has not travelled this far is a click on the row (which is a
  label), not a drag: the row must not be marked, announced or moved by a
  stray pixel.
*/
const DRAG_THRESHOLD = 4
/* How close to the viewport edge a drag scrolls the page, and by how much. */
const SCROLL_EDGE = 64
const SCROLL_STEP = 12

interface Slot {
  id: string
  /* The row's midpoint in document coordinates: stable while the page scrolls. */
  midpoint: number
}

interface DragSession {
  id: string
  /* The row node, kept so the grip can take the focus when the drag starts. */
  row: HTMLElement
  pointerId: number
  startX: number
  startY: number
  moved: boolean
  /* Horizontal geometry is fixed: the slip rides up and down, not sideways. */
  left: number
  width: number
  offsetY: number
  /* The original layout, captured before the preview moves anything. */
  slots: Slot[]
}

interface DropTarget {
  id: string
  side: DropSide
}

interface DragPreview {
  id: string
  width: number
  left: number
  offsetY: number
}

/** Places the floating slip under the pointer, keeping the vertical grab offset. */
function previewTransform(y: number, preview: DragPreview): string {
  return `translate3d(${preview.left}px, ${y - preview.offsetY}px, 0) rotate(-0.55deg)`
}

export interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string, done: boolean) => void
  onUpdate?: (id: string, update: TaskUpdate) => void
  tagOptions?: readonly string[]
  onDelete?: (id: string) => void
  /**
   * Passing it makes the list reorderable. The callback receives the visible
   * rows in their new order; with a filtered list that is the subset, not the
   * whole collection (fold it back with `applyVisibleOrder`).
   */
  onReorder?: (order: string[]) => void
  ariaLabel?: string
  emptyState?: ReactNode
  className?: string
}

export function TaskList({
  tasks,
  onToggle,
  onUpdate,
  tagOptions = [],
  onDelete,
  onReorder,
  ariaLabel = 'Tareas',
  emptyState,
  className,
}: TaskListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const instructionsId = useId()
  const session = useRef<DragSession | null>(null)
  const detach = useRef<(() => void) | null>(null)
  const pointer = useRef<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  /* Document tops recorded just before a preview reorder, for the FLIP. */
  const positions = useRef<Map<string, number>>(new Map())
  const previewOrderRef = useRef<string[] | null>(null)
  const [preview, setPreview] = useState<DragPreview | null>(null)
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null)
  const [announcement, setAnnouncement] = useState('')
  /*
    The row is also its label, so the click that follows a real drag must not
    toggle the checkbox. This flag eats exactly that click and is cleared by
    the next pointerdown, so a drag released outside the list cannot leave it
    armed for a later, genuine click.
  */
  const suppressClick = useRef(false)

  /*
    The order the list draws. While a pointer drag is alive the preview holds
    the dragged id in its provisional slot; the parent's array is not touched
    until the drop.
  */
  const order = tasks.map((task) => task.id)
  const renderOrder = previewOrder ?? order
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const renderedTasks = renderOrder
    .map((id) => byId.get(id))
    .filter((task): task is Task => Boolean(task))
  const draggedTask = preview ? byId.get(preview.id) : undefined
  const draggingId = preview?.id ?? null

  const recordRows = useCallback(() => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-id]')
    if (!rows) {
      positions.current.clear()
      return
    }
    const next = new Map<string, number>()
    for (const row of rows) {
      const id = row.dataset.taskId
      if (id) {
        next.set(id, row.getBoundingClientRect().top + window.scrollY)
      }
    }
    positions.current = next
  }, [])

  const stopDrag = useCallback(() => {
    if (session.current?.moved) recordRows()
    detach.current?.()
    detach.current = null
    session.current = null
    pointer.current = null
    previewOrderRef.current = null
    setPreviewOrder(null)
    setPreview(null)
  }, [recordRows])

  useEffect(() => () => detach.current?.(), [])

  /*
    FLIP: the new order is already in the DOM when this runs, so each row is
    inverted to where it was a frame ago and then released into the CSS
    transition. The page's scroll is added back so auto-scrolling cannot be
    mistaken for reordering, and a row caught mid-flight is measured with its
    current transform, which makes a second push start where the first ended.
  */
  useLayoutEffect(() => {
    if (!positions.current.size) return
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-id]')
    if (!rows) {
      positions.current.clear()
      return
    }

    for (const row of rows) {
      const id = row.dataset.taskId
      if (!id) continue
      const previousTop = positions.current.get(id)
      if (previousTop === undefined) continue
      const nextTop = row.getBoundingClientRect().top + window.scrollY
      const delta = previousTop - nextTop
      if (Math.abs(delta) < 1) continue

      row.style.transition = 'none'
      row.style.transform = `translateY(${delta}px)`
      /* Commit the inverted frame before handing it to the transition. */
      void row.offsetHeight
      row.style.transition = ''
      row.style.transform = ''
    }
    positions.current.clear()
  }, [previewOrder])

  /*
    Escape is the way out of a gesture that grabbed the pointer: without a
    listener the only exit would be finishing a move the user no longer wants.
  */
  useEffect(() => {
    if (!draggingId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Esc') return
      event.preventDefault()
      if (session.current?.moved) suppressClick.current = true
      stopDrag()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [draggingId, stopDrag])

  /** Commits an order and names the new position in the live region. */
  const commit = (task: Task, next: string[]) => {
    if (!onReorder) return
    onReorder(next)
    setAnnouncement(
      `Moved “${task.title}” to position ${next.indexOf(task.id) + 1} of ${next.length}.`,
    )
  }

  /*
    The destination is read from the layout captured at pointerdown, not from
    the moving preview: the thresholds stay still while the rows glide, so a
    row cannot push itself back and forth under the pointer.
  */
  const measureSlots = (): Slot[] => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-id]')
    if (!rows) return []

    const slots: Slot[] = []
    for (const row of rows) {
      const id = row.dataset.taskId
      if (!id) continue
      const rect = row.getBoundingClientRect()
      slots.push({
        id,
        midpoint: rect.top + rect.height / 2 + window.scrollY,
      })
    }
    return slots
  }

  const findSlotTarget = (
    drag: DragSession,
    pointerY: number,
  ): DropTarget | null => {
    let target: DropTarget | null = null
    for (const slot of drag.slots) {
      if (slot.id === drag.id) continue
      if (pointerY < slot.midpoint) return { id: slot.id, side: 'before' }
      target = { id: slot.id, side: 'after' }
    }
    return target
  }

  /*
    The gesture listens on the window, not on the row: the pointer leaves the
    row as soon as it crosses its edge, and capturing it on pointerdown would
    retarget the click and stop a plain click from toggling the checkbox.
  */
  const attachWindowListeners = () => {
    const onMove = (event: PointerEvent) => {
      const drag = session.current
      if (!drag || event.pointerId !== drag.pointerId) return
      /* A missed pointerup must not leave a drag armed for the next move. */
      if (event.buttons === 0) {
        if (drag.moved) suppressClick.current = true
        stopDrag()
        return
      }

      if (!drag.moved) {
        const distance = Math.hypot(
          event.clientX - drag.startX,
          event.clientY - drag.startY,
        )
        if (distance < DRAG_THRESHOLD) return
        drag.moved = true
        /*
          It is a drag now: drop any selection the press had started, stop the
          browser from selecting more and put the focus on the keyboard handle
          so the move can continue with the arrow keys after the drop.
        */
        window.getSelection()?.removeAllRanges()
        event.preventDefault()
        drag.row
          .querySelector<HTMLButtonElement>('[data-reorder-handle]')
          ?.focus()
        setPreview({
          id: drag.id,
          width: drag.width,
          left: drag.left,
          offsetY: drag.offsetY,
        })
      }

      pointer.current = event.clientY
      if (previewRef.current) {
        previewRef.current.style.transform = previewTransform(event.clientY, {
          id: drag.id,
          width: drag.width,
          left: drag.left,
          offsetY: drag.offsetY,
        })
      }

      /*
        The page follows the pointer near the edges so a row can be carried
        past the viewport.
      */
      if (event.clientY < SCROLL_EDGE) window.scrollBy(0, -SCROLL_STEP)
      else if (event.clientY > window.innerHeight - SCROLL_EDGE) {
        window.scrollBy(0, SCROLL_STEP)
      }

      const current = previewOrderRef.current ?? order
      const target = findSlotTarget(drag, event.clientY + window.scrollY)
      const next = target
        ? moveBeside(current, drag.id, target.id, target.side)
        : null
      if (!next || sameOrder(next, current)) return

      /* Back in the original slot: stop holding a preview and let FLIP return. */
      const previewNext = sameOrder(next, order) ? null : next
      recordRows()
      previewOrderRef.current = previewNext
      setPreviewOrder(previewNext)
    }

    const onUp = (event: PointerEvent) => {
      const drag = session.current
      if (!drag || event.pointerId !== drag.pointerId) return

      const nextOrder = previewOrderRef.current
      const moved = drag.moved
      const task = tasks.find((item) => item.id === drag.id)
      if (moved) suppressClick.current = true
      stopDrag()

      if (!nextOrder || !task) return
      commit(task, nextOrder)
    }

    const onCancel = (event: PointerEvent) => {
      if (!session.current || event.pointerId !== session.current.pointerId) return
      if (session.current.moved) suppressClick.current = true
      stopDrag()
    }

    /* The pointer can leave the app while the button is down: that cancels. */
    const onBlur = () => {
      if (!session.current) return
      if (session.current.moved) suppressClick.current = true
      stopDrag()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('blur', onBlur)
    detach.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onBlur)
    }
  }

  const startDrag = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (!onReorder || session.current) return
    /* A new gesture always clears the residue of the previous one. */
    suppressClick.current = false
    /* One pointer, primary button: a right click or a second finger is not a drag. */
    if (!event.isPrimary || event.button !== 0) return

    const element = event.target as HTMLElement
    const row = element.closest<HTMLElement>('[data-task-id]')
    const id = row?.dataset.taskId
    if (!row || !id) return

    const grip = element.closest('[data-reorder-handle]')
    const interactive = element.closest('button, a, input, select, textarea')

    /*
      A button or a field keeps its own gesture, except the grip: it is the
      handle on purpose. On touch the row body would need `touch-action:none`
      to drag, and that would stop the page from scrolling, so a finger only
      drags from the grip.
    */
    if (interactive && !grip) return
    if (event.pointerType === 'touch' && !grip) return

    const rect = row.getBoundingClientRect()
    pointer.current = event.clientY
    session.current = {
      id,
      row,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      left: rect.left,
      width: rect.width,
      offsetY: event.clientY - rect.top,
      slots: measureSlots(),
    }
    attachWindowListeners()
  }

  /* One click is eaten after a drag: the row is a label, not a drag surface. */
  const eatDragClick = (event: ReactMouseEvent<HTMLUListElement>) => {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const moveWithKeys = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (!onReorder || session.current) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()

    const task = tasks.find((item) => item.id === id)
    if (!task) return

    const grip = event.currentTarget
    const step = event.key === 'ArrowUp' ? -1 : 1
    const next = moveOneStep(order, id, step)
    if (!next) {
      setAnnouncement(
        `“${task.title}” is already ${step < 0 ? 'first' : 'last'}.`,
      )
      return
    }
    commit(task, next)
    /* The new slot may be outside the viewport: keep the grip on screen. */
    requestAnimationFrame(() => grip.scrollIntoView({ block: 'nearest' }))
  }

  const sortableFor = (task: Task): TaskSortable | undefined => {
    if (!onReorder) return undefined
    return {
      instructionsId,
      dragging: draggingId === task.id,
      onKeyDown: moveWithKeys,
    }
  }

  if (!tasks.length) {
    return (
      <div className={cx(styles.emptyWrap, className)}>
        {emptyState ?? (
          <EmptyState
            icon="feather"
            title="Nada pendiente"
            description="The journal is blank. Add a task and the snow will bring another."
          />
        )}
      </div>
    )
  }

  return (
    <>
      <ul
        ref={listRef}
        className={cx(styles.list, className)}
        aria-label={ariaLabel}
        data-sortable={onReorder ? 'true' : undefined}
        data-dragging={draggingId ? 'true' : undefined}
        onClickCapture={onReorder ? eatDragClick : undefined}
        onPointerDown={onReorder ? startDrag : undefined}
        /* Selected text would otherwise start the browser's own drag. */
        onDragStart={onReorder ? (event) => event.preventDefault() : undefined}
      >
        {renderedTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={onToggle}
            onUpdate={onUpdate}
            tagOptions={tagOptions}
            onDelete={onDelete}
            sortable={sortableFor(task)}
          />
        ))}
      </ul>

      {onReorder && preview && draggedTask
        ? createPortal(
            <TaskDragPreview
              ref={previewRef}
              task={draggedTask}
              width={preview.width}
              transform={previewTransform(pointer.current ?? 0, preview)}
            />,
            document.body,
          )
        : null}

      {onReorder ? (
        <>
          <span id={instructionsId} className="visually-hidden">
            Use the up and down arrow keys to move this task.
          </span>
          <p className="visually-hidden" role="status">
            {announcement}
          </p>
        </>
      ) : null}
    </>
  )
}
