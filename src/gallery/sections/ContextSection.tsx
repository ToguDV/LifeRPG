import { useState, type FormEvent } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Icon } from '../../components/Icon/Icon'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { Radio, RadioGroup } from '../../components/Radio/Radio'
import { TaskList } from '../../components/TaskList/TaskList'
import type { Task } from '../../components/TaskList/TaskRow'
import { TextInput } from '../../components/TextInput/TextInput'
import { useToast } from '../../components/Toast/Toast'
import { DemoCard } from '../DemoCard'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

type Filter = 'all' | 'open' | 'done'

const INITIAL_TASKS: Task[] = [
  {
    id: 'odre',
    title: 'Llenar el odre en el arroyo',
    note: '— el hielo ya cruje',
    done: false,
    due: 'al alba',
    tag: 'Supervivencia',
    priority: 'high',
  },
  {
    id: 'tablones',
    title: 'Entregar tres tablones a Alderic',
    note: '— faltan dos',
    done: false,
    due: 'antes del anochecer',
    tag: 'Ofrenda',
    priority: 'normal',
  },
  {
    id: 'farol',
    title: 'Devolver el farol de latón',
    note: '— prestado al herrero',
    done: true,
    due: 'cumplido',
    tag: 'Deuda',
    priority: 'low',
  },
  {
    id: 'atalaya',
    title: 'Visitar la atalaya del norte',
    note: '— arde cada séptima noche',
    done: false,
    due: 'día 17',
    tag: 'Exploración',
    priority: 'normal',
    overdue: true,
  },
  {
    id: 'pescado',
    title: 'Ahumar el pescado',
    done: true,
    tag: 'Provisiones',
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
        title: 'Tachado del diario',
        description: `«${task.title}» ya no ocupa una línea.`,
      })
    }
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return

    const task: Task = {
      id: makeTaskId(),
      title,
      done: false,
      due: 'hoy',
      tag: 'Nueva',
      priority: 'normal',
    }

    setTasks((previous) => [task, ...previous])
    setDraft('')
    setFilter('all')
    toast({
      variant: 'success',
      title: 'Tarea añadida',
      description: `«${title}» entró en el diario.`,
    })
  }

  return (
    <DemoCard
      canvas={canvas}
      component="TaskList · TaskRow · EmptyState"
      title="El diario en marcha"
      description="Todas las piezas anteriores, ahora con una tarea real entre manos: añade, marca, filtra y elimina. El estado vive en la página; los tokens siguen mandando."
      folio="09"
      tilt="right"
    >
      <div className={styles.taskApp}>
        <header className={styles.taskHeader}>
          <div>
            <p className={styles.taskKicker}>Parte del día · folio 12</p>
            <h4 className={styles.taskTitle}>Antes de que cierre la puerta</h4>
            <p className={styles.taskSub}>
              Lo que quede sin hacer dormirá con la escarcha.
            </p>
          </div>
          <Badge variant={openCount === 0 ? 'success' : 'accent'} dot>
            {openCount === 0
              ? 'Todo en orden'
              : `${openCount} ${openCount === 1 ? 'pendiente' : 'pendientes'}`}
          </Badge>
        </header>

        <form className={styles.addForm} onSubmit={addTask}>
          <TextInput
            aria-label="Nueva tarea"
            placeholder="Añadir una tarea al diario…"
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
            Añadir
          </Button>
        </form>

        <div className={styles.taskToolbar}>
          <ProgressBar
            label="Progreso del día"
            variant="success"
            value={doneCount}
            max={Math.max(tasks.length, 1)}
            valueText={`${doneCount} / ${tasks.length}`}
            className={styles.taskProgress}
          />
          <RadioGroup
            label="Mostrar"
            orientation="horizontal"
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            className={styles.filterGroup}
          >
            <Radio value="all" label={`Todas (${tasks.length})`} />
            <Radio value="open" label={`Pendientes (${openCount})`} />
            <Radio value="done" label={`Hechas (${doneCount})`} />
          </RadioGroup>
        </div>

        <div className={styles.taskListWrap}>
          <TaskList
            tasks={filtered}
            onToggle={toggleTask}
            onDelete={deleteTask}
            ariaLabel="Tareas del diario"
            emptyState={
              <EmptyState
                icon={filter === 'done' ? 'check' : 'feather'}
                title={filter === 'done' ? 'Nada sellado todavía' : 'Todo en orden'}
                description={
                  filter === 'done'
                    ? 'Marca una tarea como hecha y aparecerá aquí, con la tinta seca.'
                    : 'No quedan tareas con ese filtro. La nieve cubre el camino.'
                }
                action={
                  <Button variant="ghost" onClick={() => setFilter('all')}>
                    Ver todas
                  </Button>
                }
              />
            }
          />
        </div>

        <p className={styles.taskFoot}>
          {doneCount} de {tasks.length} selladas · {filter === 'all' ? 'todo el diario' : filter === 'open' ? 'solo pendientes' : 'solo hechas'}
        </p>
      </div>
    </DemoCard>
  )
}
