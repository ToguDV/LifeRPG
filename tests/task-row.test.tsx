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
  id: 'watch',
  title: 'Watch the pass',
  done: false,
  due: '12 Jan',
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
  it('exposes priority and overdue state in the checkbox description', () => {
    renderRow()

    const checkbox = screen.getByRole('checkbox', { name: 'Check “Watch the pass”' })
    expect(checkbox).toHaveAccessibleDescription(/high priority/i)
    expect(checkbox).toHaveAccessibleDescription(/overdue/i)
  })

  it('swaps Check for Uncheck depending on the state', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox', { name: 'Check “Watch the pass”' }))
    expect(onToggle).toHaveBeenCalledWith('watch', true)

    render(
      <ul>
        <TaskRow task={{ ...TASK, done: true }} onToggle={onToggle} />
      </ul>,
    )
    expect(screen.getByRole('checkbox', { name: 'Uncheck “Watch the pass”' })).toBeChecked()
  })

  it('announces normal priority when the task declares none', () => {
    renderRow({ ...TASK, priority: undefined, overdue: false })

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(/normal priority/i)
    expect(screen.getByRole('checkbox')).not.toHaveAccessibleDescription(/overdue/i)
  })

  it('toggles when the title is clicked: the whole row stays clickable', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()

    await user.click(screen.getByText('Watch the pass'))

    expect(onToggle).toHaveBeenCalledWith('watch', true)
  })
})
