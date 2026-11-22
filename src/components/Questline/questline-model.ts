import { formatDate, formatShortDate, startOfDay } from '../../lib/format'

/**
 * A questline is a chain of milestones ("hitos"). Every milestone holds a
 * list of quests; a milestone is only closed when it has at least one quest
 * and all of them are done. An empty milestone is a draft, not a victory:
 * it must not open the gate to the next one.
 */
export interface QuestTask {
  id: string
  title: string
  done: boolean
  /** The same optional fields the daily list edits: note and labels. */
  note?: string
  tags?: string[]
}

export interface QuestNode {
  id: string
  title: string
  /** Italic aside: the rumour, the warning, the reason. */
  note?: string
  /** Local calendar date as `YYYY-MM-DD`; the deadline lives on the milestone. */
  deadline?: string
  tasks: QuestTask[]
}

export type QuestNodeState = 'locked' | 'active' | 'complete' | 'overdue'
export type QuestDeadlineTone = 'none' | 'done' | 'overdue' | 'today' | 'soon' | 'later'

/** `deadline: null` clears the date; omitting it leaves the node untouched. */
export interface QuestNodePatch {
  title?: string
  note?: string
  deadline?: string | null
}

export interface QuestDeadline {
  tone: QuestDeadlineTone
  /** Long, readable date: “12 January 2026”. */
  dateLabel: string | null
  /** Short date for the rail: “12 Jan”. */
  shortLabel: string
  /** What the date means today: “Due today”, “3 days left”, “Overdue”… */
  statusLabel: string
}

const DAY_MS = 86_400_000
const DEADLINE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Two digits for markers and headings: 1 → “01”. */
export function formatQuestNumber(value: number): string {
  return String(value).padStart(2, '0')
}

/** Parses a `YYYY-MM-DD` key as a local date, never as UTC. */
export function parseDeadlineKey(value: string | undefined): Date | null {
  if (!value) return null
  const match = DEADLINE_PATTERN.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/** Whole days from today to the deadline; negative once it has passed. */
export function daysUntilDeadline(deadline: string, today = new Date()): number | null {
  const date = parseDeadlineKey(deadline)
  if (!date) return null
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(today).getTime()) / DAY_MS,
  )
}

export function countQuestTasks(node: QuestNode): { done: number; total: number } {
  return {
    done: node.tasks.filter((task) => task.done).length,
    total: node.tasks.length,
  }
}

export function isQuestNodeComplete(node: QuestNode): boolean {
  return node.tasks.length > 0 && node.tasks.every((task) => task.done)
}

/**
 * Every unfinished milestone before `index`, oldest first: all of them hold
 * the gate closed. A blocked milestone is unfinished too, so the immediate
 * predecessor is not always the only blocker and the rail's derived state
 * cannot be trusted to name just one.
 */
export function getBlockingNodes(nodes: QuestNode[], index: number): QuestNode[] {
  return nodes.slice(0, index).filter((node) => !isQuestNodeComplete(node))
}

/**
 * States are derived, never stored: a milestone is closed when its quests
 * are done, and open when every milestone before it is closed. A milestone
 * that is already complete stays editable even if an earlier one is
 * reopened, so the chain cannot swallow finished work.
 */
export function getQuestNodeStates(
  nodes: QuestNode[],
  today = new Date(),
): QuestNodeState[] {
  let chainClosed = true
  return nodes.map((node) => {
    const complete = isQuestNodeComplete(node)
    const unlocked = chainClosed || complete
    chainClosed = chainClosed && complete

    if (!unlocked) return 'locked'
    if (complete) return 'complete'
    return getQuestDeadline(node.deadline, false, today).tone === 'overdue'
      ? 'overdue'
      : 'active'
  })
}

export function getQuestDeadline(
  deadline: string | undefined,
  complete: boolean,
  today = new Date(),
): QuestDeadline {
  const date = parseDeadlineKey(deadline)
  if (!deadline || !date) {
    return {
      tone: 'none',
      dateLabel: null,
      shortLabel: 'no date',
      statusLabel: 'No deadline',
    }
  }

  const dateLabel = formatDate(date)
  const shortLabel = formatShortDate(date)

  if (complete) {
    return { tone: 'done', dateLabel, shortLabel, statusLabel: 'Completed' }
  }

  const days = daysUntilDeadline(deadline, today) ?? 0
  if (days < 0) {
    return { tone: 'overdue', dateLabel, shortLabel, statusLabel: 'Overdue' }
  }
  if (days === 0) {
    return { tone: 'today', dateLabel, shortLabel, statusLabel: 'Due today' }
  }
  if (days === 1) {
    return { tone: 'soon', dateLabel, shortLabel, statusLabel: 'Due tomorrow' }
  }
  return {
    tone: days <= 7 ? 'soon' : 'later',
    dateLabel,
    shortLabel,
    statusLabel: `${days} days left`,
  }
}

/** Ids for items created from the UI; no persistence layer to depend on. */
let sequence = 0

export function createQuestId(prefix: 'node' | 'task'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `quest-${prefix}-${crypto.randomUUID()}`
  }
  sequence += 1
  return `quest-${prefix}-${Date.now().toString(36)}-${sequence}`
}
