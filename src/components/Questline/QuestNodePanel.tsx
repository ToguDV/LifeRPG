import { useEffect, useRef, useState, type FormEvent } from 'react'
import { cx } from '../../lib/cx'
import { dateKey } from '../../lib/date'
import { Badge, type BadgeVariant } from '../Badge/Badge'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { DatePicker } from '../DatePicker/DatePicker'
import { Icon } from '../Icon/Icon'
import { TextInput } from '../TextInput/TextInput'
import {
  countQuestTasks,
  formatQuestNumber,
  getQuestDeadline,
  parseDeadlineKey,
  type QuestNode,
  type QuestNodePatch,
  type QuestNodeState,
  type QuestTask,
} from './questline-model'
import styles from './QuestNodePanel.module.css'

export interface QuestNodePanelProps {
  node: QuestNode
  index: number
  total: number
  state: QuestNodeState
  /** First unanswered milestone; it holds the gate closed. */
  blockingTitle?: string
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

const STATE_LABEL: Record<QuestNodeState, string> = {
  locked: 'Bloqueado',
  active: 'En curso',
  complete: 'Cumplido',
  overdue: 'Vencido',
}

const STATE_VARIANT: Record<QuestNodeState, BadgeVariant> = {
  locked: 'outline',
  active: 'accent',
  complete: 'success',
  overdue: 'danger',
}

export function QuestNodePanel({
  node,
  index,
  total,
  state,
  blockingTitle,
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

  const [draftTitle, setDraftTitle] = useState(node.title)
  const [draftDeadline, setDraftDeadline] = useState<Date | null>(() =>
    parseDeadlineKey(node.deadline),
  )
  const [titleError, setTitleError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [taskError, setTaskError] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [taskEditError, setTaskEditError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingFocus, setPendingFocus] = useState<{ taskId: string | null } | null>(
    null,
  )

  /* Opening the editor always starts from the stored milestone, never a stale draft. */
  useEffect(() => {
    if (!editing) return
    setDraftTitle(node.title)
    setDraftDeadline(parseDeadlineKey(node.deadline))
    setTitleError(null)
  }, [editing, node.title, node.deadline])

  /*
    The confirmation replaces the button that had the focus: hand it to
    Cancel while it is open, and give it back to «Eliminar hito» on cancel.
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
  const deadlineLine =
    deadline.tone === 'none'
      ? 'Sin fecha límite'
      : deadline.tone === 'done'
        ? `Plazo: ${deadline.dateLabel}`
        : deadline.tone === 'overdue'
          ? `Venció el ${deadline.dateLabel}`
          : deadline.tone === 'today'
            ? 'Vence hoy'
            : `Vence el ${deadline.dateLabel}`

  const finishEditing = () => {
    onEditingChange(false)
    editToolRef.current?.querySelector('button')?.focus()
  }

  const submitNode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) {
      setTitleError('El hito necesita un nombre.')
      return
    }
    onUpdateNode({
      title,
      deadline: draftDeadline ? dateKey(draftDeadline) : null,
    })
    finishEditing()
  }

  const cancelEditing = () => {
    setTitleError(null)
    finishEditing()
  }

  const submitTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      setTaskError('La tarea necesita un nombre.')
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
      setTaskEditError('La tarea necesita un nombre.')
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
  */
  const handlePanelKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (confirmDelete) {
      event.preventDefault()
      setConfirmDelete(false)
      return
    }
    if (editing) {
      event.preventDefault()
      cancelEditing()
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
    >
      <div className={styles.head}>
        <div className={styles.headMain}>
          <p className={styles.kicker}>
            Hito {formatQuestNumber(index + 1)} de {formatQuestNumber(total)} · {deadlineLine}
          </p>
          <div className={styles.titleRow}>
            <h4 id={headingId} className={styles.title}>
              {node.title}
            </h4>
            <Badge variant={STATE_VARIANT[state]}>{STATE_LABEL[state]}</Badge>
          </div>
          {/*
            The note is the author's margin aside, not a task or a deadline.
            `QuestNodePatch` accepts it for callers that edit the model
            directly; this editor deliberately leaves it read-only.
          */}
          {node.note ? <p className={styles.note}>{node.note}</p> : null}
          <p className={styles.tally}>
            {tally.total
              ? `${tally.done} de ${tally.total} ${tally.total === 1 ? 'tarea' : 'tareas'}`
              : 'Sin tareas todavía'}
            {tally.total && tally.done === tally.total ? ' · cumplido' : null}
          </p>
        </div>

        <div className={styles.tools}>
          <span ref={editToolRef}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={
                editing ? 'Descartar los cambios del hito' : 'Editar el hito'
              }
              aria-expanded={editing}
              aria-controls={editing ? editorId : undefined}
              iconLeft={<Icon name={editing ? 'close' : 'edit'} size="sm" />}
              onClick={() => (editing ? cancelEditing() : onEditingChange(true))}
            />
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Cerrar el panel"
            iconLeft={<Icon name="chevron-up" size="sm" />}
            onClick={onClose}
          />
        </div>
      </div>

      {editing ? (
        <form id={editorId} className={styles.editor} onSubmit={submitNode} noValidate>
          <TextInput
            label="Nombre del hito"
            autoFocus
            value={draftTitle}
            onChange={(event) => {
              setDraftTitle(event.target.value)
              if (titleError) setTitleError(null)
            }}
            error={titleError ?? undefined}
            required
          />
          <div className={styles.deadlineRow}>
            <DatePicker
              label="Fecha límite"
              optional
              value={draftDeadline}
              onChange={setDraftDeadline}
              fieldClassName={styles.deadlineField}
              placeholder="Sin fecha"
            />
            {draftDeadline ? (
              <Button variant="ghost" size="sm" onClick={() => setDraftDeadline(null)}>
                Quitar fecha
              </Button>
            ) : null}
          </div>
          <div className={styles.editorActions}>
            <Button type="submit" variant="primary" size="sm">
              Guardar hito
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {locked ? (
        <p className={styles.lockNote}>
          <span className={styles.lockIcon} aria-hidden="true">
            <Icon name="lock" size="sm" />
          </span>
          <span className={styles.lockText}>
            Se desbloquea al completar
            {blockingTitle ? ` «${blockingTitle}»` : ' el hito anterior'}. Puedes
            preparar la lista, pero todavía no marcarla.
          </span>
        </p>
      ) : null}

      <ul className={styles.taskList} aria-label={`Tareas de «${node.title}»`}>
        {node.tasks.map((task) => (
          <li
            key={task.id}
            ref={(element) => {
              if (element) taskRowRefs.current.set(task.id, element)
              else taskRowRefs.current.delete(task.id)
            }}
            className={styles.task}
          >
            {editingTaskId === task.id ? (
              <form
                className={styles.taskEdit}
                onSubmit={(event) => {
                  event.preventDefault()
                  saveTask(task.id)
                }}
              >
                <TextInput
                  aria-label={`Título de «${task.title}»`}
                  value={taskDraft}
                  onChange={(event) => {
                    setTaskDraft(event.target.value)
                    if (taskEditError) setTaskEditError(null)
                  }}
                  error={taskEditError ?? undefined}
                  size="sm"
                  autoFocus
                  fieldClassName={styles.taskEditField}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      cancelTaskEdit()
                    }
                  }}
                />
                <div className={styles.taskTools}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label="Guardar cambios"
                    iconLeft={<Icon name="check" size="sm" />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label="Cancelar edición"
                    iconLeft={<Icon name="close" size="sm" />}
                    onClick={cancelTaskEdit}
                  />
                </div>
              </form>
            ) : (
              <>
                <Checkbox
                  label={task.title}
                  checked={task.done}
                  disabled={locked}
                  strikeWhenChecked
                  onChange={(event) => onToggleTask(task.id, event.target.checked)}
                />
                <div className={cx(styles.taskTools, styles.taskToolsIdle)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`Editar «${task.title}»`}
                    iconLeft={<Icon name="edit" size="sm" />}
                    onClick={() => startTaskEdit(task)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`Eliminar «${task.title}»`}
                    iconLeft={<Icon name="trash" size="sm" />}
                    onClick={() => removeTask(task.id)}
                  />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {node.tasks.length === 0 ? (
        <p className={styles.emptyTasks}>
          Este hito todavía no tiene tareas. Añade la primera y empezará a contar.
        </p>
      ) : null}

      <form ref={addFormRef} className={styles.addTask} onSubmit={submitTask}>
        <TextInput
          aria-label={`Nueva tarea en «${node.title}»`}
          placeholder="Añadir una tarea a este hito…"
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
          Añadir
        </Button>
      </form>

      <div className={styles.foot}>
        <p className={styles.footNote}>
          {state === 'complete'
            ? index === total - 1
              ? 'La travesía está completa.'
              : 'El camino sigue.'
            : locked
              ? 'La ruta espera tu firma.'
              : index === total - 1
                ? 'Completa este hito para cerrar la travesía.'
                : 'Completa este hito para abrir el siguiente.'}
        </p>
        {confirmDelete ? (
          <div
            className={styles.confirm}
            role="group"
            aria-label="Confirmar la eliminación del hito"
          >
            <p className={styles.confirmText} role="alert">
              ¿Eliminar «{node.title}»
              {node.tasks.length
                ? ` y sus ${node.tasks.length} ${node.tasks.length === 1 ? 'tarea' : 'tareas'}`
                : ''}
              ? No se puede deshacer.
            </p>
            <Button variant="danger" size="sm" onClick={onDeleteNode}>
              Sí, eliminar el hito
            </Button>
            <span ref={cancelDeleteRef}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </span>
          </div>
        ) : (
          <span ref={deleteToolRef}>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Icon name="trash" size="sm" />}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar hito
            </Button>
          </span>
        )}
      </div>
    </section>
  )
}
