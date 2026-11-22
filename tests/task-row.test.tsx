import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const TAG_OPTIONS = ['Survival', 'Dawn', 'Kit']

/** The editable row: pencil, trash and the popover behind the pencil. */
function renderEditable(task: Task = TASK, tagOptions = TAG_OPTIONS) {
  const onUpdate = vi.fn()
  render(
    <ul>
      <TaskRow
        task={task}
        onToggle={vi.fn()}
        onUpdate={onUpdate}
        tagOptions={tagOptions}
        onDelete={vi.fn()}
      />
    </ul>,
  )
  return onUpdate
}

const editor = () => screen.getByRole('dialog', { name: 'Edit task' })

async function openEditor() {
  const user = userEvent.setup()
  await user.click(
    screen.getByRole('button', { name: 'Edit “Watch the pass”' }),
  )
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus(),
  )
  return user
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

  it('renders one label per tag', () => {
    renderRow({ ...TASK, tags: ['Survival', 'Dawn'] })

    expect(screen.getByText('Survival')).toBeVisible()
    expect(screen.getByText('Dawn')).toBeVisible()
  })
})

describe('TaskRow · popover editing', () => {
  it('puts the pencil before the trash and opens the editor', async () => {
    renderEditable({
      ...TASK,
      note: 'The ice is creaking.',
      tags: ['Survival', 'Dawn'],
    })

    const [edit, remove] = screen.getAllByRole('button')
    expect(edit).toHaveAccessibleName('Edit “Watch the pass”')
    expect(remove).toHaveAccessibleName('Delete “Watch the pass”')

    const user = userEvent.setup()
    await user.click(edit)

    expect(editor()).toBeVisible()
    expect(edit).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Watch the pass',
    )
    expect(screen.getByRole('checkbox', { name: 'Survival' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Dawn' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Kit' })).not.toBeChecked()
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(
      'The ice is creaking.',
    )
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus(),
    )
  })

  it('saves the title, the selected tags and the description', async () => {
    const onUpdate = renderEditable({ ...TASK, tags: ['Survival'] })
    const user = await openEditor()

    const title = screen.getByRole('textbox', { name: 'Title' })
    await user.clear(title)
    await user.type(title, '  Watch the ford  ')

    await user.click(screen.getByRole('checkbox', { name: 'Survival' }))
    await user.click(screen.getByRole('checkbox', { name: 'Dawn' }))
    await user.type(screen.getByRole('textbox', { name: 'New tag' }), 'night   watch')
    await user.click(screen.getByRole('button', { name: 'Add tag' }))

    const note = screen.getByRole('textbox', { name: /description/i })
    await user.type(note, 'The ice is thinner than it looks.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onUpdate).toHaveBeenCalledWith('watch', {
      title: 'Watch the ford',
      tags: ['Dawn', 'night watch'],
      note: 'The ice is thinner than it looks.',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    /* The pencil is the element that opened the editor, so it gets the focus. */
    expect(
      screen.getByRole('button', { name: 'Edit “Watch the pass”' }),
    ).toHaveFocus()
  })

  it('refuses an empty title, keeps the editor and focuses the field', async () => {
    const onUpdate = renderEditable()
    const user = await openEditor()

    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Write a title first.')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus()
    expect(editor()).toBeVisible()
  })

  it('refuses a seventh tag and disables the unchecked ones', async () => {
    const onUpdate = renderEditable({
      ...TASK,
      tags: ['one', 'two', 'three', 'four', 'five', 'six'],
    })
    const user = await openEditor()

    expect(screen.getByRole('checkbox', { name: 'Kit' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'New tag' }), 'seven')
    await user.click(screen.getByRole('button', { name: 'Add tag' }))

    expect(screen.getByRole('alert')).toHaveTextContent('6 tags at most.')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(editor()).toBeVisible()
  })

  it('cancels on Escape and gives the focus back to the pencil', async () => {
    const onUpdate = renderEditable()
    const user = await openEditor()

    await user.type(screen.getByRole('textbox', { name: 'Title' }), ' (draft)')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Edit “Watch the pass”' }),
    ).toHaveFocus()
  })

  it('leaves the first Escape of an IME composition to the IME', async () => {
    renderEditable()
    await openEditor()

    const title = screen.getByRole('textbox', { name: 'Title' })
    fireEvent.keyDown(title, { key: 'Escape', isComposing: true, keyCode: 229 })

    expect(editor()).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Title' })).toBe(title)
  })
})
