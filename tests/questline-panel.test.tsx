import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Questline } from '../src/components/Questline/Questline'
import type { QuestNode } from '../src/components/Questline/questline-model'

const SOLO: QuestNode[] = [
  {
    id: 'provisiones',
    title: 'Supplies',
    tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
  },
]

const CHAIN: QuestNode[] = [
  {
    id: 'provisiones',
    title: 'Supplies',
    tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
  },
  {
    id: 'pozo',
    title: 'The well',
    tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
  },
]

function renderChain(nodes: QuestNode[] = CHAIN) {
  render(<Questline defaultNodes={nodes} label="Test route" />)
  return userEvent.setup()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('QuestNodePanel', () => {
  it('shows its own error with an empty title and keeps required', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit milestone' }))

    const input = screen.getByRole('textbox', { name: 'Milestone name' })
    expect(input).toBeRequired()

    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save milestone' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The milestone needs a name.',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Save milestone' })).toBeVisible()
  })

  it('with several pending milestones, does not promise that the first is enough to unlock', async () => {
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
      },
      {
        id: 'pozo',
        title: 'The well',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
      {
        id: 'cima',
        title: 'The summit',
        tasks: [{ id: 'bandera', title: 'Plant the flag', done: false }],
      },
    ])

    await user.click(screen.getByRole('button', { name: /The summit/ }))

    expect(
      screen.getByText(
        /It unlocks when the previous milestones are completed, starting with “Supplies”\./,
      ),
    ).toBeVisible()
  })

  it('names the only lock when the earlier ones are already complete', async () => {
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
      },
      {
        id: 'pozo',
        title: 'The well',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
      {
        id: 'cima',
        title: 'The summit',
        tasks: [{ id: 'bandera', title: 'Plant the flag', done: false }],
      },
    ])

    await user.click(screen.getByRole('button', { name: /The summit/ }))

    expect(
      screen.getByText(/It unlocks when “The well” is completed\./),
    ).toBeVisible()
    expect(screen.queryByText(/previous milestones/)).not.toBeInTheDocument()
  })

  it('takes focus when opened from the keyboard and returns it to the trigger on Escape', async () => {
    const user = renderChain()
    await user.tab()

    const trigger = screen.getByRole('button', { name: /Supplies/ })
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    const panel = screen.getByRole('region', { name: 'Supplies' })
    await waitFor(() => expect(panel).toHaveFocus())

    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('uses the closing copy on the last milestone', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    expect(
      screen.getByText('Complete this milestone to finish the journey.'),
    ).toBeVisible()

    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))

    expect(screen.getByText('The journey is complete.')).toBeVisible()
    expect(screen.queryByText('The path goes on.')).not.toBeInTheDocument()
  })

  it('keeps “close” for the panel and “complete / completed” for the milestone', async () => {
    const user = renderChain()
    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Close milestone' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Complete this milestone to open the next one.'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Edit milestone' }))
    expect(
      screen.getByRole('button', { name: 'Discard milestone changes' }),
    ).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))
    expect(screen.getByText(/1 of 1 task/)).toHaveTextContent('· completed')
    expect(screen.getByText('Completed')).toBeVisible()
    expect(screen.queryByText(/· closed/)).not.toBeInTheDocument()
    expect(screen.getByText('The path goes on.')).toBeVisible()
  })

  it('moves focus to the added task', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Supplies', tasks: [] },
    ])
    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    const input = screen.getByRole('textbox', {
      name: /New task in “Supplies”/,
    })
    await user.type(input, 'Seal the map{Enter}')

    const added = screen.getByRole('checkbox', { name: 'Seal the map' })
    await waitFor(() => expect(added).toHaveFocus())
    expect(added).toBeVisible()
    expect(input).toHaveValue('')
  })

  it('shows the deadline only once', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        deadline: '2025-01-15',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
      },
    ])
    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    expect(screen.getByText(/Milestone 01 of 01 · Due on/)).toBeVisible()
    expect(screen.getByText('0 of 1 task')).not.toHaveTextContent(/Due|days left/)
  })

  it('closes the milestone editor with Escape and returns focus', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit milestone' }))

    const input = screen.getByRole('textbox', { name: 'Milestone name' })
    await user.type(input, ' of dawn')
    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('textbox', { name: 'Milestone name' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit milestone' })).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Supplies' })).toBeVisible()
  })

  it('closes the delete confirmation with Escape and returns focus', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Delete milestone' }))

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('group', {
        name: 'Confirm milestone deletion',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete milestone' })).toHaveFocus()
  })

  it('closes the task editor with Escape and returns focus to the row', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit “Fill the waterskin”' }))

    const input = screen.getByRole('textbox', { name: 'Title' })
    await user.type(input, ' of the well')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Edit task' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit “Fill the waterskin”' }),
    ).toHaveFocus()

    /* The next Escape backs out of the panel itself. */
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Supplies' })).not.toBeInTheDocument()
  })

  it('lets the date picker consume Escape before the milestone editor', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit milestone' }))

    await user.click(screen.getByRole('button', { name: /deadline/i }))
    const calendar = screen.getByRole('dialog', { name: 'Pick a date' })
    expect(calendar).toBeVisible()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Pick a date' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Milestone name' })).toBeVisible()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('textbox', { name: 'Milestone name' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit milestone' })).toHaveFocus()
  })

  it('leaves the first Escape of an IME composition to the IME', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit milestone' }))

    const input = screen.getByRole('textbox', { name: 'Milestone name' })
    await user.clear(input)
    await user.type(input, 'The pass')

    /* While the candidate list is open, Escape belongs to the IME. */
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true, keyCode: 229 })

    expect(screen.getByRole('region', { name: 'Supplies' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Milestone name' })).toBe(input)

    await user.type(input, ' of dawn')
    expect(
      screen.getByRole('textbox', { name: 'Milestone name' }),
    ).toHaveValue('The pass of dawn')
  })

  it('keeps the task draft when Escape belongs to an IME composition', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit “Fill the waterskin”' }))

    const input = screen.getByRole('textbox', { name: 'Title' })
    await user.type(input, ' of the well')

    fireEvent.keyDown(input, { key: 'Escape', isComposing: true })

    expect(input).toHaveValue('Fill the waterskin of the well')
    await user.type(input, ' at dawn')
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Fill the waterskin of the well at dawn',
    )
  })

  it('validates a new task with no name', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    const input = screen.getByRole('textbox', {
      name: /New task in “Supplies”/,
    })
    await user.type(input, '   {Enter}')

    expect(screen.getByRole('alert')).toHaveTextContent('The task needs a name.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  it('validates a task rename with no name', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit “Fill the waterskin”' }))

    const input = screen.getByRole('textbox', { name: 'Title' })
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Write a title first.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeVisible()
  })

  it('returns focus to the neighbouring row when a task is deleted', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        tasks: [
          { id: 'odre', title: 'Fill the waterskin', done: false },
          { id: 'mapa', title: 'Seal the map', done: false },
        ],
      },
    ])
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Delete “Fill the waterskin”' }))

    const next = screen.getByRole('button', { name: 'Edit “Seal the map”' })
    await waitFor(() => expect(next).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(
      screen.queryByRole('checkbox', { name: 'Fill the waterskin' }),
    ).not.toBeInTheDocument()
  })

  it('returns focus to the row when a task is renamed', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Edit “Fill the waterskin”' }))

    const input = screen.getByRole('textbox', { name: 'Title' })
    await user.clear(input)
    await user.type(input, 'Fill the big waterskin')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const renamed = screen.getByRole('button', {
      name: 'Edit “Fill the big waterskin”',
    })
    await waitFor(() => expect(renamed).toHaveFocus())
  })
})
