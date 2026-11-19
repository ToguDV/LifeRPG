import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskRow, type Task } from '../src/components/TaskList/TaskRow'

/*
  TaskRow used to encode priority and lateness with colour only. The same
  facts must reach the accessibility tree through the checkbox description,
  and the label has to say what the toggle will do.
*/
const TASK: Task = {
  id: 'vigilar',
  title: 'Vigilar el paso',
  done: false,
  due: '12 ene',
  overdue: true,
  priority: 'high',
}

function renderRow(task: Task = TASK) {
  const onToggle = vi.fn()
  render(
    <ul>
      <TaskRow task={task} onToggle={onToggle} />
    </ul>,
  )
  return onToggle
}

describe('TaskRow', () => {
  it('expone prioridad y vencimiento en la descripción del checkbox', () => {
    renderRow()

    const checkbox = screen.getByRole('checkbox', { name: 'Marcar «Vigilar el paso»' })
    expect(checkbox).toHaveAccessibleDescription(/prioridad alta/i)
    expect(checkbox).toHaveAccessibleDescription(/vencida/i)
  })

  it('cambia Marcar por Desmarcar según el estado', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox', { name: 'Marcar «Vigilar el paso»' }))
    expect(onToggle).toHaveBeenCalledWith('vigilar', true)

    render(
      <ul>
        <TaskRow task={{ ...TASK, done: true }} onToggle={onToggle} />
      </ul>,
    )
    expect(screen.getByRole('checkbox', { name: 'Desmarcar «Vigilar el paso»' })).toBeChecked()
  })

  it('anuncia prioridad media cuando la tarea no declara prioridad', () => {
    renderRow({ ...TASK, priority: undefined, overdue: false })

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(/prioridad media/i)
    expect(screen.getByRole('checkbox')).not.toHaveAccessibleDescription(/vencida/i)
  })

  it('marca al pulsar el título: la fila entera sigue siendo clicable', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()

    await user.click(screen.getByText('Vigilar el paso'))

    expect(onToggle).toHaveBeenCalledWith('vigilar', true)
  })
})
