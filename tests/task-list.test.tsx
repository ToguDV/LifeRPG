import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskList } from '../src/components/TaskList/TaskList'
import type { Task } from '../src/components/TaskList/TaskRow'

const TASKS: Task[] = [
  { id: 'waterskin', title: 'Fill the waterskin', done: false },
  { id: 'planks', title: 'Deliver three planks', done: false },
  { id: 'lantern', title: 'Return the brass lantern', done: true },
]

function renderList(onReorder = vi.fn()) {
  render(
    <TaskList
      tasks={TASKS}
      onToggle={vi.fn()}
      onReorder={onReorder}
      ariaLabel="Tasks"
    />,
  )
  return onReorder
}

const handle = (title: string) =>
  screen.getByRole('button', { name: `Reorder “${title}”` })

describe('TaskList · reordering', () => {
  it('adds one grip per row and describes the arrow keys', () => {
    renderList()

    expect(screen.getAllByRole('button', { name: /^Reorder / })).toHaveLength(3)
    expect(handle('Fill the waterskin')).toHaveAccessibleDescription(
      'Use the up and down arrow keys to move this task.',
    )
  })

  it('leaves the list without grips when no reorder handler is passed', () => {
    render(
      <TaskList tasks={TASKS} onToggle={vi.fn()} ariaLabel="Tasks" />,
    )

    expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull()
    /* Without the handler the live regions are not there either. */
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('moves a task down with ArrowDown and announces its position', async () => {
    const onReorder = renderList()
    const user = userEvent.setup()
    const grip = handle('Fill the waterskin')
    grip.focus()

    await user.keyboard('{ArrowDown}')

    expect(onReorder).toHaveBeenCalledWith(['planks', 'waterskin', 'lantern'])
    expect(screen.getByRole('status')).toHaveTextContent(
      'Moved “Fill the waterskin” to position 2 of 3.',
    )
    /* The grip travels with the row, so the next ArrowDown needs no tabbing. */
    expect(grip).toHaveFocus()
  })

  it('moves a task up with ArrowUp', async () => {
    const onReorder = renderList()
    const user = userEvent.setup()
    handle('Return the brass lantern').focus()

    await user.keyboard('{ArrowUp}')

    expect(onReorder).toHaveBeenCalledWith(['waterskin', 'lantern', 'planks'])
    expect(screen.getByRole('status')).toHaveTextContent(
      'Moved “Return the brass lantern” to position 2 of 3.',
    )
  })

  it('says so instead of wrapping at the first and last row', async () => {
    const onReorder = renderList()
    const user = userEvent.setup()

    handle('Fill the waterskin').focus()
    await user.keyboard('{ArrowUp}')

    expect(onReorder).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      '“Fill the waterskin” is already first.',
    )
  })

  it('does not steal arrow keys from the other controls', async () => {
    const onReorder = renderList()
    const user = userEvent.setup()

    screen.getByRole('checkbox', { name: 'Check “Fill the waterskin”' }).focus()
    await user.keyboard('{ArrowDown}')

    expect(onReorder).not.toHaveBeenCalled()
  })
})
