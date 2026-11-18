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
  const editorId = `${panelId}-editor`
  const locked = state === 'locked'

  const [draftTitle, setDraftTitle] = useState(node.title)
  const [draftDeadline, setDraftDeadline] = useState<Date | null>(() =>
    parseDeadlineKey(node.deadline),
  )
  const [titleError, setTitleError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    if (!title) return
    onAddTask(title)
    setNewTitle('')
  }

  const startTaskEdit = (task: QuestTask) => {
    setEditingTaskId(task.id)
    setTaskDraft(task.title)
  }

  const focusPanel = () => panelRef.current?.focus({ preventScroll: true })

  /* The row's edit form is unmounted: keep the focus inside the milestone. */
  const cancelTaskEdit = () => {
    setEditingTaskId(null)
    setTaskDraft('')
    focusPanel()
  }

  const saveTask = (taskId: string) => {
    const title = taskDraft.trim()
    if (!title) return
    onRenameTask(taskId, title)
    setEditingTaskId(null)
    setTaskDraft('')
    focusPanel()
  }

  /* Removing the focused row would drop the focus on the body; keep it in the panel. */
  const removeTask = (taskId: string) => {
    if (editingTaskId === taskId) {
      setEditingTaskId(null)
      setTaskDraft('')
    }
    onDeleteTask(taskId)
    focusPanel()
  }

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
          {node.note ? <p className={styles.note}>{node.note}</p> : null}
          <p className={styles.tally}>
            {tally.total
              ? `${tally.done} de ${tally.total} ${tally.total === 1 ? 'tarea' : 'tareas'}`
              : 'Sin tareas todavía'}
            {tally.total && tally.done === tally.total ? ' · cerrado' : null}
            {deadline.tone === 'later' ||
            deadline.tone === 'soon' ||
            deadline.tone === 'today' ||
            deadline.tone === 'overdue'
              ? ` · ${deadline.statusLabel}`
              : null}
          </p>
        </div>

        <div className={styles.tools}>
          <span ref={editToolRef}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={editing ? 'Cerrar la edición del hito' : 'Editar el hito'}
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
            aria-label="Cerrar el hito"
            iconLeft={<Icon name="chevron-up" size="sm" />}
            onClick={onClose}
          />
        </div>
      </div>

      {editing ? (
        <form id={editorId} className={styles.editor} onSubmit={submitNode}>
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
          <span>
            Se desbloquea al completar
            {blockingTitle ? ` «${blockingTitle}»` : ' el hito anterior'}. Puedes
            preparar la lista, pero todavía no marcarla.
          </span>
        </p>
      ) : null}

      <ul className={styles.taskList} aria-label={`Tareas de «${node.title}»`}>
        {node.tasks.map((task) => (
          <li key={task.id} className={styles.task} data-done={task.done ? 'true' : undefined}>
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
                  onChange={(event) => setTaskDraft(event.target.value)}
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

      <form className={styles.addTask} onSubmit={submitTask}>
        <TextInput
          aria-label={`Nueva tarea en «${node.title}»`}
          placeholder="Añadir una tarea a este hito…"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
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
            ? 'El camino sigue.'
            : locked
              ? 'La ruta espera tu firma.'
              : 'Cierra este hito para abrir el siguiente.'}
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
