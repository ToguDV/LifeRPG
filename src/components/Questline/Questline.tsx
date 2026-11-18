import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { useControllableState } from '../../lib/useControllableState'
import { Button } from '../Button/Button'
import { EmptyState } from '../EmptyState/EmptyState'
import { Icon, type IconName } from '../Icon/Icon'
import { QuestNodePanel } from './QuestNodePanel'
import {
  countQuestTasks,
  createQuestId,
  formatQuestNumber,
  getBlockingNode,
  getQuestDeadline,
  getQuestNodeStates,
  isQuestNodeComplete,
  type QuestNode,
  type QuestNodePatch,
  type QuestNodeState,
} from './questline-model'
import { useQuestTrail } from './useQuestTrail'
import styles from './Questline.module.css'

export type {
  QuestNode,
  QuestNodePatch,
  QuestNodeState,
  QuestTask,
} from './questline-model'

export interface QuestlineProps {
  /** Controlled milestones. Pair with `onChange`. */
  nodes?: QuestNode[]
  /** Uncontrolled seed. Ignored when `nodes` is provided. */
  defaultNodes?: QuestNode[]
  onChange?: (nodes: QuestNode[]) => void
  /** Names the route in the visible header and in the rail's list. */
  label?: string
  addNodeLabel?: string
  /** Title of a milestone created from the rail; the editor opens focused. */
  newNodeTitle?: string
  emptyState?: ReactNode
  className?: string
}

const STATE_ICON: Record<QuestNodeState, IconName | null> = {
  locked: 'lock',
  active: null,
  complete: 'check',
  overdue: 'alert',
}

const STATE_WORD: Partial<Record<QuestNodeState, string>> = {
  locked: 'Bloqueado.',
  complete: 'Cumplido.',
  overdue: 'Vencido.',
}

/*
   The rail keeps the numbers short: state lives in the marker, the icon and
   a screen-reader word, while the handwritten line carries progress and date.
*/
function stopMeta(
  tally: { done: number; total: number },
  deadline: ReturnType<typeof getQuestDeadline>,
): string {
  const parts = [tally.total ? `${tally.done} de ${tally.total}` : 'Sin tareas']
  if (deadline.tone !== 'none') parts.push(deadline.shortLabel)
  return parts.join(' · ')
}

/**
 * A route of milestones. Every stop holds its own quests; the trail inks as
 * a milestone closes and the next gate opens. States are derived from the
 * data — no separate "locked" flag to keep in sync.
 */
export function Questline({
  nodes: nodesProp,
  defaultNodes = [],
  onChange,
  label = 'Questline',
  addNodeLabel = 'Añadir hito',
  newNodeTitle = 'Nuevo hito',
  emptyState,
  className,
}: QuestlineProps) {
  const baseId = useId()
  const [nodes, setNodes] = useControllableState<QuestNode[]>({
    value: nodesProp,
    defaultValue: defaultNodes,
    onChange,
  })

  const [openId, setOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const railRef = useRef<HTMLOListElement>(null)
  const addRowRef = useRef<HTMLDivElement>(null)
  const stopRefs = useRef<Array<HTMLLIElement | null>>([])
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([])
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])

  const states = getQuestNodeStates(nodes)
  const trail = useQuestTrail(railRef, stopRefs, markerRefs, nodes)

  const completeCount = states.filter((state) => state === 'complete').length
  const tallies = nodes.map(countQuestTasks)
  const doneTasks = tallies.reduce((sum, tally) => sum + tally.done, 0)
  const totalTasks = tallies.reduce((sum, tally) => sum + tally.total, 0)

  const openIndex = nodes.findIndex((node) => node.id === openId)
  const openNode = openIndex >= 0 ? nodes[openIndex] : null

  const toggleNode = (nodeId: string) => {
    setEditingId(null)
    setOpenId((current) => (current === nodeId ? null : nodeId))
  }

  const closePanel = useCallback(() => {
    const index = openIndex
    setOpenId(null)
    setEditingId(null)
    if (index < 0) return
    /* The trigger is always mounted: no need to wait for the portal frame. */
    triggerRefs.current[index]?.focus()
  }, [openIndex])

  const updateNode = (nodeId: string, patch: QuestNodePatch) => {
    setNodes((previous) =>
      previous.map((node) => {
        if (node.id !== nodeId) return node
        const { deadline, ...rest } = patch
        const next: QuestNode = { ...node, ...rest }
        if (deadline === null) delete next.deadline
        else if (deadline !== undefined) next.deadline = deadline
        return next
      }),
    )
  }

  const addNode = () => {
    const node: QuestNode = {
      id: createQuestId('node'),
      title: newNodeTitle,
      tasks: [],
    }
    setNodes((previous) => [...previous, node])
    setOpenId(node.id)
    setEditingId(node.id)
  }

  const deleteNode = (nodeId: string) => {
    const index = nodes.findIndex((node) => node.id === nodeId)
    const removed = nodes[index]
    const focusIndex =
      index > 0 ? index - 1 : index + 1 < nodes.length ? index + 1 : -1

    setNodes((previous) => previous.filter((node) => node.id !== nodeId))
    setOpenId(null)
    setEditingId(null)
    if (removed) setStatus(`Hito «${removed.title}» eliminado del camino.`)

    const trigger = focusIndex >= 0 ? triggerRefs.current[focusIndex] : null
    if (trigger) trigger.focus()
    else addRowRef.current?.querySelector('button')?.focus()
  }

  const toggleTask = (nodeId: string, taskId: string, done: boolean) => {
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              tasks: node.tasks.map((task) =>
                task.id === taskId ? { ...task, done } : task,
              ),
            }
          : node,
      ),
    )
  }

  const addTask = (nodeId: string, title: string) => {
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              tasks: [...node.tasks, { id: createQuestId('task'), title, done: false }],
            }
          : node,
      ),
    )
  }

  const renameTask = (nodeId: string, taskId: string, title: string) => {
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              tasks: node.tasks.map((task) =>
                task.id === taskId ? { ...task, title } : task,
              ),
            }
          : node,
      ),
    )
  }

  const deleteTask = (nodeId: string, taskId: string) => {
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? { ...node, tasks: node.tasks.filter((task) => task.id !== taskId) }
          : node,
      ),
    )
  }

  /*
    Closing a milestone opens the next one, and that change has to be heard,
    not only seen in the trail. The signature keeps the announcement from
    firing on renames or on the first paint.
  */
  const completionSignature = nodes
    .map((node) => (isQuestNodeComplete(node) ? '1' : '0'))
    .join('')
  const previousCompletion = useRef(completionSignature)

  useEffect(() => {
    if (previousCompletion.current === completionSignature) return
    const previous = previousCompletion.current
    previousCompletion.current = completionSignature

    const index = nodes.findIndex(
      (node, position) =>
        isQuestNodeComplete(node) && previous[position] !== '1',
    )
    if (index < 0) {
      setStatus('')
      return
    }

    const next = nodes[index + 1]
    setStatus(
      next
        ? `Hito «${nodes[index].title}» cumplido. Se ha desbloqueado «${next.title}».`
        : `Hito «${nodes[index].title}» cumplido. La travesía está completa.`,
    )
  }, [completionSignature, nodes])

  return (
    <div className={cx(styles.questline, className)}>
      <div className={styles.head}>
        {label ? <p className={styles.headLabel}>{label}</p> : <span />}
        <p className={styles.headTally}>
          {nodes.length
            ? `${completeCount} de ${nodes.length} ${nodes.length === 1 ? 'hito' : 'hitos'} · ${doneTasks} de ${totalTasks} ${totalTasks === 1 ? 'tarea' : 'tareas'}`
            : 'Sin hitos todavía'}
        </p>
      </div>

      {nodes.length ? (
        <div className={styles.railWrap}>
          <ol className={styles.rail} ref={railRef} aria-label={label || 'Questline'}>
            {nodes.map((node, index) => {
              const state = states[index]
              const tally = tallies[index]
              const deadline = getQuestDeadline(node.deadline, state === 'complete')
              const open = node.id === openId
              const isGoal = index === nodes.length - 1
              const triggerId = `quest-${baseId}-${node.id}-trigger`
              const panelId = `quest-${baseId}-${node.id}-panel`
              const meta = `${isGoal ? 'Meta · ' : ''}${stopMeta(tally, deadline)}`
              const stateIcon = isGoal ? 'flag' : STATE_ICON[state]

              return (
                <li
                  key={node.id}
                  ref={(element) => {
                    stopRefs.current[index] = element
                  }}
                  className={styles.stop}
                  data-state={state}
                  data-open={open ? 'true' : undefined}
                >
                  <button
                    ref={(element) => {
                      triggerRefs.current[index] = element
                    }}
                    type="button"
                    id={triggerId}
                    className={styles.trigger}
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                    onClick={() => toggleNode(node.id)}
                  >
                    <span className="visually-hidden">Hito {index + 1}.</span>
                    <span
                      ref={(element) => {
                        markerRefs.current[index] = element
                      }}
                      className={styles.marker}
                      aria-hidden="true"
                    >
                      {formatQuestNumber(index + 1)}
                    </span>
                    <span className={styles.stopTitle}>{node.title}</span>
                    <span className={styles.stopMeta}>
                      {STATE_WORD[state] ? (
                        <span className="visually-hidden">{STATE_WORD[state]}</span>
                      ) : null}
                      {stateIcon ? <Icon name={stateIcon} size="xs" aria-hidden="true" /> : null}
                      <span>{meta}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {trail.paths.length ? (
            <svg
              className={styles.trail}
              width={trail.width}
              height={trail.height}
              aria-hidden="true"
              focusable="false"
            >
              {trail.paths.map((path, index) => (
                <path
                  key={index}
                  d={path.d}
                  className={path.done ? styles.trailDone : styles.trailPending}
                />
              ))}
            </svg>
          ) : null}
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          {emptyState ?? (
            <EmptyState
              icon="scroll"
              title="La ruta está en blanco"
              description="Añade el primer hito y la travesía empezará a dibujarse."
            />
          )}
        </div>
      )}

      {openNode ? (
        <QuestNodePanel
          key={openNode.id}
          node={openNode}
          index={openIndex}
          total={nodes.length}
          state={states[openIndex]}
          blockingTitle={getBlockingNode(nodes, openIndex)?.title}
          panelId={`quest-${baseId}-${openNode.id}-panel`}
          headingId={`quest-${baseId}-${openNode.id}-heading`}
          editing={editingId === openNode.id}
          onEditingChange={(editing) => setEditingId(editing ? openNode.id : null)}
          onClose={closePanel}
          onUpdateNode={(patch) => updateNode(openNode.id, patch)}
          onDeleteNode={() => deleteNode(openNode.id)}
          onToggleTask={(taskId, done) => toggleTask(openNode.id, taskId, done)}
          onAddTask={(title) => addTask(openNode.id, title)}
          onRenameTask={(taskId, title) => renameTask(openNode.id, taskId, title)}
          onDeleteTask={(taskId) => deleteTask(openNode.id, taskId)}
        />
      ) : null}

      <div className={styles.addRow} ref={addRowRef}>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<Icon name="plus" size="sm" />}
          onClick={addNode}
        >
          {addNodeLabel}
        </Button>
        <p className={styles.addHint}>La ruta crece por el final.</p>
      </div>

      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  )
}
