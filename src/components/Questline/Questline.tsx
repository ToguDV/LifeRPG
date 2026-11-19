import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { startOfDay } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import { QuestNodePanel } from './QuestNodePanel'
import { QuestRail } from './QuestRail'
import {
  countQuestTasks,
  createQuestId,
  getBlockingNodes,
  getQuestNodeStates,
  type QuestNode,
  type QuestNodePatch,
  type QuestNodeState,
  type QuestTask,
} from './questline-model'
import { domFragment } from './questline-dom'
import styles from './Questline.module.css'

/*
   Public surface: consumers seed and render milestones through this module,
   so the model's vocabulary is re-exported here instead of reaching into
   `questline-model` directly.
*/
export type {
  QuestDeadline,
  QuestDeadlineTone,
  QuestNode,
  QuestNodePatch,
  QuestNodeState,
  QuestTask,
} from './questline-model'
export { formatQuestNumber } from './questline-model'

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

function quotedList(titles: string[]): string {
  const quoted = titles.map((title) => `“${title}”`)
  if (quoted.length <= 1) return quoted[0] ?? ''
  return `${quoted.slice(0, -1).join(', ')} and ${quoted[quoted.length - 1]}`
}

/*
   One sentence per transition, then the caller joins them. Completion and
   locking are derived from the state map, never from neighbouring positions:
   a deletion shifts indices but not the milestones' own states.
*/
function stateAnnouncement(
  previous: Map<string, QuestNodeState>,
  nodes: QuestNode[],
  states: QuestNodeState[],
): string {
  const completed: string[] = []
  const unlocked: string[] = []
  const locked: string[] = []

  nodes.forEach((node, index) => {
    const before = previous.get(node.id)
    const now = states[index]
    if (!before || before === now) return
    if (now === 'complete' && before !== 'complete') completed.push(node.title)
    if (before === 'locked' && (now === 'active' || now === 'overdue')) {
      unlocked.push(node.title)
    }
    if (now === 'locked' && before !== 'locked') locked.push(node.title)
  })

  const parts: string[] = []
  if (completed.length === 1) parts.push(`Milestone “${completed[0]}” completed.`)
  else if (completed.length > 1) parts.push(`Milestones ${quotedList(completed)} completed.`)

  if (unlocked.length === 1) parts.push(`“${unlocked[0]}” unlocked.`)
  else if (unlocked.length > 1) parts.push(`Unlocked ${quotedList(unlocked)}.`)

  const allComplete =
    states.length > 0 && states.every((state) => state === 'complete')
  if (completed.length && allComplete) parts.push('The journey is complete.')

  if (locked.length === 1) parts.push(`“${locked[0]}” locked.`)
  else if (locked.length > 1) parts.push(`Locked ${quotedList(locked)}.`)

  return parts.join(' ')
}

/** A freshly created milestone that the user has not touched yet. */
function isUntouchedDraft(
  node: QuestNode | undefined,
  draft: { id: string; title: string },
  kept: Set<string>,
): node is QuestNode {
  return (
    Boolean(node) &&
    node?.title === draft.title &&
    node.tasks.length === 0 &&
    !node.note &&
    !node.deadline &&
    !kept.has(draft.id)
  )
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
  label = 'Milestone route',
  addNodeLabel = 'Add milestone',
  newNodeTitle = 'New milestone',
  emptyState,
  className,
}: QuestlineProps) {
  const baseId = `quest-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
  const [nodes, setNodes] = useControllableState<QuestNode[]>({
    value: nodesProp,
    defaultValue: defaultNodes,
    onChange,
  })

  const [openId, setOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [today, setToday] = useState(() => startOfDay(new Date()))

  const addRowRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])

  const previousStates = useRef<Map<string, QuestNodeState> | null>(null)
  const pendingNotice = useRef<string | null>(null)
  const lastFocused = useRef<HTMLElement | null>(null)
  const draftRef = useRef<{ id: string; title: string } | null>(null)
  const keptDrafts = useRef<Set<string>>(new Set())

  const states = getQuestNodeStates(nodes, today)

  const completeCount = states.filter((state) => state === 'complete').length
  const tallies = nodes.map(countQuestTasks)
  const doneTasks = tallies.reduce((sum, tally) => sum + tally.done, 0)
  const totalTasks = tallies.reduce((sum, tally) => sum + tally.total, 0)
  const nodeTally = `${completeCount} of ${nodes.length} ${nodes.length === 1 ? 'milestone' : 'milestones'}`
  const taskTally = totalTasks
    ? ` · ${doneTasks} of ${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`
    : ''

  const routeLabel = label.trim()
  const openIndex = nodes.findIndex((node) => node.id === openId)
  const openNode = openIndex >= 0 ? nodes[openIndex] : null

  /* Queues the deletion notice; the announcement effect owns `status`. */
  const keepDraft = (nodeId: string) => {
    if (draftRef.current?.id === nodeId) keptDrafts.current.add(nodeId)
  }

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
    keepDraft(nodeId)
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
    draftRef.current = { id: node.id, title: newNodeTitle }
    keptDrafts.current.delete(node.id)
    setNodes((previous) => [...previous, node])
    setOpenId(node.id)
    setEditingId(node.id)
  }

  const deleteNode = (nodeId: string) => {
    const index = nodes.findIndex((node) => node.id === nodeId)
    const removed = nodes[index]
    const focusIndex =
      index > 0 ? index - 1 : index + 1 < nodes.length ? index + 1 : -1

    if (draftRef.current?.id === nodeId) draftRef.current = null
    setNodes((previous) => previous.filter((node) => node.id !== nodeId))
    setOpenId(null)
    setEditingId(null)
    if (removed) pendingNotice.current = `Milestone “${removed.title}” removed from the path.`

    const trigger = focusIndex >= 0 ? triggerRefs.current[focusIndex] : null
    if (trigger) trigger.focus()
    else addRowRef.current?.querySelector('button')?.focus()
  }

  /* Every task mutation marks the draft as touched and rewrites one node. */
  const updateTasks = (
    nodeId: string,
    updater: (tasks: QuestTask[]) => QuestTask[],
  ) => {
    keepDraft(nodeId)
    setNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId ? { ...node, tasks: updater(node.tasks) } : node,
      ),
    )
  }

  const toggleTask = (nodeId: string, taskId: string, done: boolean) =>
    updateTasks(nodeId, (tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, done } : task)),
    )

  const addTask = (nodeId: string, title: string) =>
    updateTasks(nodeId, (tasks) => [
      ...tasks,
      { id: createQuestId('task'), title, done: false },
    ])

  const renameTask = (nodeId: string, taskId: string, title: string) =>
    updateTasks(nodeId, (tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, title } : task)),
    )

  const deleteTask = (nodeId: string, taskId: string) =>
    updateTasks(nodeId, (tasks) =>
      tasks.filter((task) => task.id !== taskId),
    )

  /*
    Cancel (or closing the panel) while the freshly added milestone is still
    untouched: the draft disappears instead of blocking the next one. Any
    save or task edit keeps it.
  */
  useEffect(() => {
    const draft = draftRef.current
    if (!draft || editingId === draft.id) return

    const node = nodes.find((item) => item.id === draft.id)
    const untouched = isUntouchedDraft(node, draft, keptDrafts.current)

    draftRef.current = null
    keptDrafts.current.delete(draft.id)
    if (!untouched) return

    setNodes((previous) => previous.filter((item) => item.id !== draft.id))
    setOpenId((current) => (current === draft.id ? null : current))
    setEditingId((current) => (current === draft.id ? null : current))
  }, [editingId, nodes, setNodes])

  /*
    The only writer of the live region. State changes are compared by id so a
    deletion never looks like a completion, and a notice recorded by a handler
    is composed with the transitions of the same commit instead of racing.
  */
  useEffect(() => {
    if (previousStates.current === null) {
      previousStates.current = new Map(
        nodes.map((node, index) => [node.id, states[index]]),
      )
      return
    }

    const previous = previousStates.current
    previousStates.current = new Map(
      nodes.map((node, index) => [node.id, states[index]]),
    )

    const messages: string[] = []
    const notice = pendingNotice.current
    pendingNotice.current = null
    if (notice) messages.push(notice)

    const transitions = stateAnnouncement(previous, nodes, states)
    if (transitions) messages.push(transitions)
    if (messages.length) setStatus(messages.join(' '))

    /*
      A control that turns `disabled` drops the focus on the body. Keep it in
      the open milestone so the next Tab does not restart from the top.
    */
    const focused = lastFocused.current
    const unusable =
      focused &&
      (!focused.isConnected || (focused as HTMLInputElement).disabled === true)
    if (!unusable) return

    const panel =
      openIndex >= 0
        ? document.getElementById(
            `${baseId}-${openIndex}-${domFragment(nodes[openIndex].id)}-panel`,
          )
        : null
    const fallback =
      panel ??
      (openIndex >= 0 ? triggerRefs.current[openIndex] : null) ??
      addRowRef.current?.querySelector('button') ??
      null
    if (fallback && fallback !== focused) fallback.focus()
  }, [nodes, states, openIndex, baseId])

  /* “Due today” must expire at midnight and after returning to the tab. */
  useEffect(() => {
    let timer = 0

    const refresh = () => {
      setToday((current) => {
        const next = startOfDay(new Date())
        return next.getTime() === current.getTime() ? current : next
      })
    }

    const scheduleMidnight = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = window.setTimeout(
        () => {
          refresh()
          scheduleMidnight()
        },
        Math.max(1000, next.getTime() - now.getTime() + 1000),
      )
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    scheduleMidnight()

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div
      className={cx(styles.questline, className)}
      onFocus={(event) => {
        lastFocused.current = event.target as HTMLElement
      }}
    >
      <div className={styles.head}>
        {routeLabel ? <p className={styles.headLabel}>{routeLabel}</p> : <span />}
        <p className={styles.headTally}>
          {nodes.length ? `${nodeTally}${taskTally}` : 'No milestones yet'}
        </p>
      </div>

      <QuestRail
        nodes={nodes}
        states={states}
        tallies={tallies}
        today={today}
        openId={openId}
        baseId={baseId}
        routeLabel={routeLabel}
        emptyState={emptyState}
        triggerRefs={triggerRefs}
        onToggleNode={toggleNode}
      />

      {openNode ? (
        <QuestNodePanel
          key={openNode.id}
          node={openNode}
          index={openIndex}
          total={nodes.length}
          state={states[openIndex]}
          blockingTitles={getBlockingNodes(nodes, openIndex).map(
            (blocking) => blocking.title,
          )}
          panelId={`${baseId}-${openIndex}-${domFragment(openNode.id)}-panel`}
          headingId={`${baseId}-${openIndex}-${domFragment(openNode.id)}-heading`}
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
        <p className={styles.addHint}>The route grows at the end.</p>
      </div>

      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  )
}
