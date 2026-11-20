import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge/Badge'
import { Button } from '../components/Button/Button'
import { Card } from '../components/Card/Card'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { TaskList } from '../components/TaskList/TaskList'
import type { Task } from '../components/TaskList/TaskRow'
import { TextInput } from '../components/TextInput/TextInput'
import { usePersistentState } from '../lib/usePersistentState'
import {
  TASKS_KEY,
  createTaskId,
  parseTasks,
  seedTasks,
} from './journal-data'
import styles from './TaskJournal.module.css'

export function TaskJournal() {
  const [tasks, setTasks] = usePersistentState<Task[]>(
    TASKS_KEY,
    seedTasks,
    parseTasks,
  )
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const formRef = useRef<HTMLFormElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const focusIndex = useRef<number | null>(null)

  /*
    After a deletion, the button that had the focus is gone. Move it to the
    checkbox that took its place, or to the composer when the list is empty.
  */
  useEffect(() => {
    if (focusIndex.current === null) return
    const index = focusIndex.current
    focusIndex.current = null

    const boxes =
      listRef.current?.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    const target = boxes?.length
      ? boxes[Math.min(index, boxes.length - 1)]
      : null
    if (target) target.focus()
    else formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }, [tasks])

  const done = tasks.filter((task) => task.done).length

  const focusComposer = () => {
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) {
      setError('Write a task first.')
      focusComposer()
      return
    }

    setTasks((previous) => [
      { id: createTaskId(), title, done: false },
      ...previous,
    ])
    setDraft('')
    setError('')
    setStatus(`Task added: ${title}`)
    focusComposer()
  }

  const toggleTask = (id: string, isDone: boolean) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, done: isDone } : task,
      ),
    )
  }

  const deleteTask = (id: string) => {
    const index = tasks.findIndex((task) => task.id === id)
    const removed = tasks[index]
    focusIndex.current = Math.max(index, 0)
    setTasks((previous) => previous.filter((task) => task.id !== id))
    if (removed) setStatus(`Task deleted: ${removed.title}`)
  }

  return (
    <Card
      size="lg"
      kicker={
        <Badge variant="outline" size="sm">
          Task log
        </Badge>
      }
      title="Today’s tasks"
      folio="I"
    >
      <form ref={formRef} className={styles.add} onSubmit={addTask} noValidate>
        <TextInput
          label="New task"
          placeholder="Write a task"
          value={draft}
          error={error || undefined}
          autoComplete="off"
          maxLength={120}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError('')
          }}
        />
        <Button
          type="submit"
          variant="primary"
          className={styles.addButton}
        >
          Add
        </Button>
      </form>

      {tasks.length ? (
        <ProgressBar
          className={styles.progress}
          label="Done"
          value={done}
          max={tasks.length}
          valueText={`${done} / ${tasks.length}`}
        />
      ) : null}

      <div ref={listRef} className={styles.list}>
        <TaskList
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          ariaLabel="Tasks"
          emptyState={<EmptyState icon="feather" title="No tasks yet" />}
        />
      </div>

      <p className="visually-hidden" role="status">
        {status}
      </p>
    </Card>
  )
}
