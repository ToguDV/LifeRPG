import type { QuestNode, QuestTask } from '../components/Questline/Questline'
import type { Task, TaskPriority } from '../components/TaskList/TaskRow'
import { addDays, dateKey } from '../lib/date'

export const TASKS_KEY = 'liferpg-journal-tasks-v1'
export const QUESTS_KEY = 'liferpg-journal-quests-v1'

const PRIORITIES: readonly string[] = ['low', 'normal', 'high']
const DEADLINE = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

/** Keeps only the fields the UI reads; anything unexpected is dropped. */
export function parseTasks(value: unknown): Task[] | null {
  if (!Array.isArray(value)) return null

  const tasks: Task[] = []
  for (const item of value) {
    if (!isRecord(item)) return null
    const id = text(item.id)
    const title = text(item.title)
    if (!id || !title || typeof item.done !== 'boolean') return null

    const task: Task = { id, title, done: item.done }
    const note = text(item.note)
    const due = text(item.due)
    const tag = text(item.tag)
    if (note) task.note = note
    if (due) task.due = due
    if (tag) task.tag = tag
    if (item.overdue === true) task.overdue = true
    if (typeof item.priority === 'string' && PRIORITIES.includes(item.priority)) {
      task.priority = item.priority as TaskPriority
    }
    tasks.push(task)
  }
  return tasks
}

export function parseNodes(value: unknown): QuestNode[] | null {
  if (!Array.isArray(value)) return null

  const nodes: QuestNode[] = []
  for (const item of value) {
    if (!isRecord(item) || !Array.isArray(item.tasks)) return null
    const id = text(item.id)
    const title = text(item.title)
    if (!id || !title) return null

    const tasks: QuestTask[] = []
    for (const rawTask of item.tasks) {
      if (!isRecord(rawTask)) return null
      const taskId = text(rawTask.id)
      const taskTitle = text(rawTask.title)
      if (!taskId || !taskTitle || typeof rawTask.done !== 'boolean') return null
      tasks.push({ id: taskId, title: taskTitle, done: rawTask.done })
    }

    const node: QuestNode = { id, title, tasks }
    const note = text(item.note)
    const deadline = text(item.deadline)
    if (note) node.note = note
    if (deadline && DEADLINE.test(deadline)) node.deadline = deadline
    nodes.push(node)
  }
  return nodes
}

let sequence = 0

export function createTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `task-${crypto.randomUUID()}`
  }
  sequence += 1
  return `task-${Date.now().toString(36)}-${sequence}`
}

export function seedTasks(): Task[] {
  return [
    {
      id: 'seed-waterskin',
      title: 'Fill the waterskin at the stream',
      due: 'Before dusk',
      tag: 'Survival',
      priority: 'high',
      done: false,
    },
    {
      id: 'seed-planks',
      title: 'Deliver three planks to Alderic',
      due: 'Before nightfall',
      tag: 'Offering',
      done: false,
    },
    {
      id: 'seed-lantern',
      title: 'Return the brass lantern',
      due: 'Tomorrow',
      tag: 'Debt',
      priority: 'low',
      done: false,
    },
    {
      id: 'seed-cloak',
      title: 'Mend the torn cloak',
      due: 'Yesterday',
      tag: 'Kit',
      priority: 'high',
      overdue: true,
      done: false,
    },
    {
      id: 'seed-entry',
      title: 'Copy the route into the journal',
      tag: 'Journal',
      done: true,
    },
  ]
}

export function seedNodes(): QuestNode[] {
  const today = new Date()
  const deadline = (days: number) => dateKey(addDays(today, days))

  return [
    {
      id: 'seed-provisions',
      title: 'The provisions',
      deadline: deadline(-5),
      tasks: [
        { id: 'seed-waterskin', title: 'Fill the waterskin', done: true },
        { id: 'seed-salt', title: 'Seal the salt in waxed cloth', done: true },
        { id: 'seed-tinder', title: 'Change the tinder', done: true },
      ],
    },
    {
      id: 'seed-well',
      title: 'The blind well',
      deadline: deadline(3),
      tasks: [
        { id: 'seed-rope', title: 'Tie the rope to the winch', done: true },
        { id: 'seed-lower', title: 'Lower the brass lantern', done: false },
        { id: 'seed-raise', title: 'Raise the bucket', done: false },
      ],
    },
    {
      id: 'seed-watchtower',
      title: 'The north watchtower',
      deadline: deadline(9),
      tasks: [
        { id: 'seed-firewood', title: 'Carry the dry firewood up', done: false },
        { id: 'seed-signal', title: 'Light the signal at dusk', done: false },
      ],
    },
    {
      id: 'seed-door',
      title: 'The hollow door',
      deadline: deadline(20),
      tasks: [
        { id: 'seed-key', title: 'Find the bone key', done: false },
        { id: 'seed-threshold', title: 'Cross the threshold', done: false },
      ],
    },
  ]
}
