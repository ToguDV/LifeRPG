import { useState, type FormEvent } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Icon } from '../../components/Icon/Icon'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { Radio, RadioGroup } from '../../components/Radio/Radio'
import { TaskList } from '../../components/TaskList/TaskList'
import type { Task } from '../../components/TaskList/TaskRow'
import type { TaskUpdate } from '../../components/TaskList/TaskEditor'
import { mergeTagOptions } from '../../lib/tags'
import { TextInput } from '../../components/TextInput/TextInput'
import { useToast } from '../../components/Toast/Toast'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

type Filter = 'all' | 'open' | 'done'

const INITIAL_TASKS: Task[] = [
  {
    id: 'waterskin',
    title: 'Fill the waterskin at the stream',
    note: '— the ice is already creaking',
    done: false,
    due: 'at dawn',
    tags: ['Survival', 'Dawn'],
    priority: 'high',
  },
  {
    id: 'planks',
    title: 'Deliver three planks to Alderic',
    note: '— two still missing',
    done: false,
    due: 'before nightfall',
    tags: ['Offering'],
    priority: 'normal',
  },
  {
    id: 'lantern',
    title: 'Return the brass lantern',
    note: '— borrowed from the smith',
    done: true,
    due: 'completed',
    tags: ['Debt'],
    priority: 'low',
  },
  {
    id: 'watchtower',
    title: 'Visit the north watchtower',
    note: '— it burns every seventh night',
    done: false,
    due: 'day 17',
    tags: ['Exploration', 'Watch'],
    priority: 'normal',
    overdue: true,
  },
  {
    id: 'fish',
    title: 'Smoke the fish',
    done: true,
    tags: ['Provisions'],
    priority: 'low',
  },
]

function makeTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}`
}

export function ContextSection({ canvas }: SectionProps) {
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const tagOptions = mergeTagOptions(...tasks.map((task) => task.tags ?? []))
  const doneCount = tasks.filter((task) => task.done).length
  const openCount = tasks.length - doneCount
  const filtered = tasks.filter((task) => {
    if (filter === 'open') return !task.done
    if (filter === 'done') return task.done
    return true
  })

  const toggleTask = (id: string, done: boolean) => {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, done } : task)),
    )
  }

  const deleteTask = (id: string) => {
    const task = tasks.find((item) => item.id === id)
    setTasks((previous) => previous.filter((item) => item.id !== id))
    if (task) {
      toast({
        variant: 'info',
        title: 'Struck from the journal',
        description: `“${task.title}” no longer takes up a line.`,
      })
    }
  }

  const updateTask = (id: string, update: TaskUpdate) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task
        const next: Task = { ...task, title: update.title }
        if (update.note) next.note = update.note
        else delete next.note
        if (update.tags?.length) next.tags = update.tags
        else delete next.tags
        return next
      }),
    )
    toast({
      variant: 'success',
      title: 'Line amended',
      description: `“${update.title}” was rewritten.`,
    })
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return

    const task: Task = {
      id: makeTaskId(),
      title,
      done: false,
      due: 'today',
      tags: ['New'],
      priority: 'normal',
    }

    setTasks((previous) => [task, ...previous])
    setDraft('')
    setFilter('all')
    toast({
      variant: 'success',
      title: 'Task added',
      description: `“${title}” joined the journal.`,
    })
  }

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          TaskList · TaskRow · EmptyState
        </Badge>
      }
      title="The journal at work"
      folio="09"
      tilt="right"
    >
      <div className={styles.taskApp}>
        <header className={styles.taskHeader}>
          <div>
            <p className={styles.taskKicker}>Day report · folio 12</p>
            <h4 className={styles.taskTitle}>Before the door closes</h4>
          </div>
          <Badge variant={openCount === 0 ? 'success' : 'accent'} dot>
            {openCount === 0
              ? 'All in order'
              : `${openCount} ${openCount === 1 ? 'open task' : 'open tasks'}`}
          </Badge>
        </header>

        <form className={styles.addForm} onSubmit={addTask}>
          <TextInput
            aria-label="New task"
            placeholder="Add a task to the journal…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            fieldClassName={styles.addField}
          />
          <Button
            type="submit"
            variant="primary"
            iconLeft={<Icon name="plus" />}
            disabled={!draft.trim()}
          >
            Add
          </Button>
        </form>

        <div className={styles.taskToolbar}>
          <ProgressBar
            label="Day progress"
            variant="success"
            value={doneCount}
            max={Math.max(tasks.length, 1)}
            valueText={`${doneCount} / ${tasks.length}`}
            className={styles.taskProgress}
          />
          <RadioGroup
            label="Show"
            orientation="horizontal"
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            className={styles.filterGroup}
          >
            <Radio value="all" label={`All (${tasks.length})`} />
            <Radio value="open" label={`Open (${openCount})`} />
            <Radio value="done" label={`Done (${doneCount})`} />
          </RadioGroup>
        </div>

        <div className={styles.taskListWrap}>
          <TaskList
            tasks={filtered}
            onToggle={toggleTask}
            onUpdate={updateTask}
            tagOptions={tagOptions}
            onDelete={deleteTask}
            ariaLabel="Journal tasks"
            emptyState={
              <EmptyState
                icon={filter === 'done' ? 'check' : 'feather'}
                title={filter === 'done' ? 'Nothing sealed yet' : 'All in order'}
                description={
                  filter === 'done'
                    ? 'Mark a task as done.'
                    : 'No tasks match that filter.'
                }
                action={
                  <Button variant="ghost" onClick={() => setFilter('all')}>
                    View all
                  </Button>
                }
              />
            }
          />
        </div>
      </div>
    </Card>
  )
}
