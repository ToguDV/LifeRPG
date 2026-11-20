import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge } from '../Badge/Badge'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import { TextInput } from '../TextInput/TextInput'
import {
  countQuestTasks,
  formatQuestNumber,
  getQuestDeadline,
  type QuestNode,
  type QuestNodePatch,
  type QuestNodeState,
  type QuestTask,
} from './questline-model'
import { STATE_META } from './questline-state'
import { QuestDeleteConfirm } from './QuestDeleteConfirm'
import { QuestNodeEditor } from './QuestNodeEditor'
import { QuestTaskRow } from './QuestTaskRow'
import styles from './QuestNodePanel.module.css'

export interface QuestNodePanelProps {
  node: QuestNode
  index: number
  total: number
  state: QuestNodeState
  /** Every unfinished milestone behind this one, oldest first. */
  blockingTitles: string[]
  panelId: string
  headingId: string
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onClose: () => void
  onUpdateNode: (patch: QuestNodePatch) => void
  onDeleteNode: () => void
  onToggleTask: (taskId: string, done: boolean) => void
  onAddTask: (title: string) => void
  onRenameTask: (taskId: string, title: string) => void
  onDeleteTask: (taskId: string) => void
}

export function QuestNodePanel({
  node,
  index,
  total,
  state,
  blockingTitles,
  panelId,
  headingId,
  editing,
  onEditingChange,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onToggleTask,
  onAddTask,
  onRenameTask,
  onDeleteTask,
}: QuestNodePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const editToolRef = useRef<HTMLSpanElement>(null)
  const cancelDeleteRef = useRef<HTMLSpanElement>(null)
  const deleteToolRef = useRef<HTMLSpanElement>(null)
  const hadConfirm = useRef(false)
  const taskRowRefs = useRef(new Map<string, HTMLLIElement>())
  const addFormRef = useRef<HTMLFormElement>(null)
  const previousTaskIds = useRef(new Set(node.tasks.map((task) => task.id)))
  const pendingAddedTask = useRef(false)
  const keyDownRef = useRef<(event: KeyboardEvent) => void>(() => {})
  /* A new milestone opens straight into its editor: autofocus wins there. */
  const openedWithEditor = useRef(editing)
  const editorId = `${panelId}-editor`
  const locked = state === 'locked'

  const [newTitle, setNewTitle] = useState('')
  const [taskError, setTaskError] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [taskEditError, setTaskEditError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingFocus, setPendingFocus] = useState<{ taskId: string | null } | null>(
    null,
  )

  /*
    The confirmation replaces the button that had the focus: hand it to
    Cancel while it is open, and give it back to “Delete milestone” on cancel.
  */
  useEffect(() => {
    if (confirmDelete) {
      hadConfirm.current = true
      cancelDeleteRef.current?.querySelector('button')?.focus()
      return
    }
    if (!hadConfirm.current) return
    hadConfirm.current = false
    deleteToolRef.current?.querySelector('button')?.focus()
  }, [confirmDelete])

  /*
    The panel mounts at the end of the rail, past every milestone trigger.
    Hand it the focus once so the keyboard does not have to tab through all
    of them; the editor's autofocus wins when the panel opens with it.
  */
  useEffect(() => {
    if (openedWithEditor.current) return
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      /* A click inside the panel may have taken the focus before this frame. */
      if (!panel || panel.contains(document.activeElement)) return
      panel.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  /*
    A row that leaves or enters edit mode takes its buttons with it. Focus
    has to land on a control that still exists and stay on screen: the row's
    idle button or, when the row is gone, the add field below the list.
  */
  useEffect(() => {
    if (!pendingFocus) return
    const row = pendingFocus.taskId
      ? taskRowRefs.current.get(pendingFocus.taskId)
      : undefined
    const target =
      row?.querySelector<HTMLButtonElement>('button') ??
      addFormRef.current?.querySelector<HTMLInputElement>('input')
    setPendingFocus(null)
    if (!target) return
    target.focus()
    target.scrollIntoView({ block: 'nearest' })
  }, [pendingFocus])

  /*
    The new task opens above the add field. Move the focus to its checkbox
    so the change is heard; a locked milestone has a disabled checkbox, so
    it falls back to the row's edit button.
  */
  useEffect(() => {
    const ids = new Set(node.tasks.map((task) => task.id))
    if (!pendingAddedTask.current) {
      previousTaskIds.current = ids
      return
    }
    pendingAddedTask.current = false
    const added = node.tasks.find((task) => !previousTaskIds.current.has(task.id))
    previousTaskIds.current = ids
    if (!added) return

    const row = taskRowRefs.current.get(added.id)
    const checkbox = row?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const target =
      checkbox && !checkbox.disabled
        ? checkbox
        : row?.querySelector<HTMLButtonElement>('button')
    if (!target) return
    target.focus()
    target.scrollIntoView({ block: 'nearest' })
  }, [node.tasks])

  const tally = countQuestTasks(node)
  const deadline = getQuestDeadline(node.deadline, state === 'complete')
  const overdue = deadline.tone === 'overdue'
  const deadlineLine =
    deadline.tone === 'none'
      ? 'No deadline'
      : deadline.tone === 'done'
        ? `Deadline: ${deadline.dateLabel}`
        : deadline.tone === 'overdue'
          ? `Was due on ${deadline.dateLabel}`
          : deadline.tone === 'today'
            ? 'Due today'
            : `Due on ${deadline.dateLabel}`

  const finishEditing = () => {
    onEditingChange(false)
    editToolRef.current?.querySelector('button')?.focus()
  }

  const submitTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      setTaskError('The task needs a name.')
      return
    }
    setTaskError(null)
    onAddTask(title)
    setNewTitle('')
    pendingAddedTask.current = true
  }

  const startTaskEdit = (task: QuestTask) => {
    setEditingTaskId(task.id)
    setTaskDraft(task.title)
    setTaskEditError(null)
  }

  /* The row's edit form is unmounted: hand the focus back to its button. */
  const cancelTaskEdit = () => {
    const taskId = editingTaskId
    setEditingTaskId(null)
    setTaskDraft('')
    setTaskEditError(null)
    if (taskId) setPendingFocus({ taskId })
  }

  const saveTask = (taskId: string) => {
    const title = taskDraft.trim()
    if (!title) {
      setTaskEditError('The task needs a name.')
      return
    }
    onRenameTask(taskId, title)
    setEditingTaskId(null)
    setTaskDraft('')
    setTaskEditError(null)
    setPendingFocus({ taskId })
  }

  /* Removing the focused row would drop the focus on the body: take it to the neighbour. */
  const removeTask = (taskId: string) => {
    const index = node.tasks.findIndex((task) => task.id === taskId)
    const neighbour = node.tasks[index + 1]?.id ?? node.tasks[index - 1]?.id ?? null
    if (editingTaskId === taskId) {
      setEditingTaskId(null)
      setTaskDraft('')
      setTaskEditError(null)
    }
    onDeleteTask(taskId)
    setPendingFocus({ taskId: neighbour })
  }

  /*
    Escape backs out one layer at a time: the delete confirmation, the
    milestone editor, the task editor, then the panel itself. Pickers and the
    task editor call `preventDefault` first, so their own Escape is not stolen.
    While an IME is composing, Escape only dismisses the candidate list; it
    must not tear the editor down and take the typed text with it.
  */
  const handlePanelKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (event.isComposing || event.keyCode === 229) return
    if (confirmDelete) {
      event.preventDefault()
      setConfirmDelete(false)
      return
    }
    if (editing) {
      event.preventDefault()
      finishEditing()
      return
    }
    if (editingTaskId) {
      event.preventDefault()
      cancelTaskEdit()
      return
    }
    event.preventDefault()
    onClose()
  }

  /*
    The listener sits on the document in the bubble phase: React's root runs
    first, so a nested editor can consume Escape with `preventDefault`. It
    only acts on keys pressed inside this panel.
  */
  useEffect(() => {
    keyDownRef.current = handlePanelKeyDown
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) return
      keyDownRef.current(event)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <section
      ref={panelRef}
      id={panelId}
      className={styles.panel}
      aria-labelledby={headingId}
      tabIndex={-1}
      data-state={state}
      data-overdue={overdue ? 'true' : undefined}
    >
      <div className={styles.head}>
        <div className={styles.headMain}>
          <p className={styles.kicker}>
            Milestone {formatQuestNumber(index + 1)} of {formatQuestNumber(total)} · {deadlineLine}
          </p>
          <div className={styles.titleRow}>
            <h4 id={headingId} className={styles.title}>
              {node.title}
            </h4>
            <Badge variant={STATE_META[state].badgeVariant}>
              {STATE_META[state].label}
            </Badge>
          </div>
          {/*
            The note is the author's margin aside, not a task or a deadline.
            `QuestNodePatch` accepts it for callers that edit the model
            directly; this editor deliberately leaves it read-only.
          */}
          {node.note ? <p className={styles.note}>{node.note}</p> : null}
          <p className={styles.tally}>
            {tally.total
              ? `${tally.done} of ${tally.total} ${tally.total === 1 ? 'task' : 'tasks'}`
              : 'No tasks yet'}
            {tally.total && tally.done === tally.total ? ' · completed' : null}
          </p>
        </div>

        <div className={styles.tools}>
          <span ref={editToolRef}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={
                editing ? 'Discard milestone changes' : 'Edit milestone'
              }
              aria-expanded={editing}
              aria-controls={editing ? editorId : undefined}
              iconLeft={<Icon name={editing ? 'close' : 'edit'} size="sm" />}
              onClick={() => (editing ? finishEditing() : onEditingChange(true))}
            />
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close panel"
            iconLeft={<Icon name="chevron-up" size="sm" />}
            onClick={onClose}
          />
        </div>
      </div>

      {editing ? (
        <QuestNodeEditor
          node={node}
          editorId={editorId}
          onUpdateNode={onUpdateNode}
          onDone={finishEditing}
        />
      ) : null}

      {locked ? (
        <p className={styles.lockNote}>
          <span className={styles.lockIcon} aria-hidden="true">
            <Icon name="lock" size="sm" />
          </span>
          <span className={styles.lockText}>
            {blockingTitles.length > 1
              ? `It unlocks when the previous milestones are completed, starting with “${blockingTitles[0]}”.`
              : blockingTitles.length === 1
                ? `It unlocks when “${blockingTitles[0]}” is completed.`
                : 'It unlocks when the previous milestone is completed.'}{' '}
            You can prepare the list, but not check it off yet.
          </span>
        </p>
      ) : null}

      <ul className={styles.taskList} aria-label={`Tasks in “${node.title}”`}>
        {node.tasks.map((task) => (
          <QuestTaskRow
            key={task.id}
            task={task}
            locked={locked}
            editing={editingTaskId === task.id}
            draft={taskDraft}
            error={taskEditError}
            rowRef={(element) => {
              if (element) taskRowRefs.current.set(task.id, element)
              else taskRowRefs.current.delete(task.id)
            }}
            onStartEdit={() => startTaskEdit(task)}
            onDraftChange={(value) => {
              setTaskDraft(value)
              if (taskEditError) setTaskEditError(null)
            }}
            onSubmit={() => saveTask(task.id)}
            onCancelEdit={cancelTaskEdit}
            onToggle={(done) => onToggleTask(task.id, done)}
            onDelete={() => removeTask(task.id)}
          />
        ))}
      </ul>

      {node.tasks.length === 0 ? (
        <p className={styles.emptyTasks}>
          This milestone has no tasks yet. Add the first one and it will start to count.
        </p>
      ) : null}

      <form ref={addFormRef} className={styles.addTask} onSubmit={submitTask}>
        <TextInput
          aria-label={`New task in “${node.title}”`}
          placeholder="Add a task to this milestone…"
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value)
            if (taskError) setTaskError(null)
          }}
          error={taskError ?? undefined}
          size="sm"
          fieldClassName={styles.addTaskField}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          iconLeft={<Icon name="plus" size="sm" />}
        >
          Add
        </Button>
      </form>

      <div className={styles.foot}>
        <p className={styles.footNote}>
          {state === 'complete'
            ? index === total - 1
              ? 'The journey is complete.'
              : 'The path goes on.'
            : locked
              ? 'The route awaits your signature.'
              : index === total - 1
                ? 'Complete this milestone to finish the journey.'
                : 'Complete this milestone to open the next one.'}
        </p>
        {confirmDelete ? (
          <QuestDeleteConfirm
            title={node.title}
            taskCount={node.tasks.length}
            cancelRef={cancelDeleteRef}
            onConfirm={onDeleteNode}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <span ref={deleteToolRef}>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Icon name="trash" size="sm" />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete milestone
            </Button>
          </span>
        )}
      </div>
    </section>
  )
}
