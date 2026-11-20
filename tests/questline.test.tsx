import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Questline, formatQuestNumber } from '../src/components/Questline/Questline'
import type { QuestNode } from '../src/components/Questline/Questline'

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

/*
  The chain's live region. The milestone panel may grow its own announcements,
  so pick the region reporting chain events and fall back to the last one (the
  chain region renders after the panel and the add row).
*/
function chainStatus(): HTMLElement {
  const regions = screen.getAllByRole('status')
  return (
    regions.find((region) =>
      /(completed|unlocked|locked|removed|journey)/i.test(region.textContent ?? ''),
    ) ?? regions[regions.length - 1]
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Questline', () => {
  it('opens the locked milestone to prepare tasks, but not to check them', async () => {
    const user = renderChain()

    await user.click(screen.getByRole('button', { name: /The well/ }))

    const farol = screen.getByRole('checkbox', { name: 'Lower the lantern' })
    expect(farol).toBeDisabled()
    expect(screen.getByText(/unlocks when “Supplies” is completed/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()

    await user.type(
      screen.getByRole('textbox', { name: /New task in “The well”/ }),
      'Bring a spare rope',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(
      screen.getByRole('checkbox', { name: 'Bring a spare rope' }),
    ).toBeDisabled()
  })

  it('unlocks the next milestone when the current one is completed, and announces it', async () => {
    const user = renderChain()

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))

    expect(chainStatus()).toHaveTextContent(
      /Milestone “Supplies” completed. “The well” unlocked./,
    )

    await user.click(screen.getByRole('button', { name: /The well/ }))
    expect(screen.getByRole('checkbox', { name: 'Lower the lantern' })).toBeEnabled()
  })

  it('does not count a milestone without tasks as completed', async () => {
    const user = renderChain([
      { id: 'empty', title: 'Empty milestone', tasks: [] },
      CHAIN[1],
    ])

    await user.click(screen.getByRole('button', { name: /The well/ }))

    expect(screen.getByRole('checkbox', { name: 'Lower the lantern' })).toBeDisabled()
    expect(chainStatus()).toBeEmptyDOMElement()
  })

  it('adds, renames and deletes tasks in the open milestone', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Supplies', tasks: [] },
    ])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))

    await user.type(
      screen.getByRole('textbox', { name: /New task in “Supplies”/ }),
      'Seal the map',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('checkbox', { name: 'Seal the map' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit “Seal the map”' }))
    const input = screen.getByRole('textbox', { name: 'Title of “Seal the map”' })
    await user.clear(input)
    await user.type(input, 'Seal the pass map')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      screen.getByRole('checkbox', { name: 'Seal the pass map' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Delete “Seal the pass map”' }),
    )
    expect(
      screen.queryByRole('checkbox', { name: /Seal the map/ }),
    ).not.toBeInTheDocument()
  })

  it('creates a milestone, renames it and deletes it with confirmation', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Supplies', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Add milestone' }))

    const titleInput = screen.getByRole('textbox', { name: 'Milestone name' })
    await user.clear(titleInput)
    await user.type(titleInput, 'The March pass')
    await user.click(screen.getByRole('button', { name: 'Save milestone' }))

    expect(
      screen.getByRole('button', { name: /The March pass/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete milestone' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Delete milestone' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Delete milestone' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete the milestone' }))

    expect(
      screen.queryByRole('button', { name: /The March pass/ }),
    ).not.toBeInTheDocument()
  })

  it('wires the trigger to its panel and returns focus on close', async () => {
    const user = renderChain()
    const trigger = screen.getByRole('button', { name: /Supplies/ })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panelId = trigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId as string)).toHaveTextContent('Supplies')

    await user.click(screen.getByRole('button', { name: /Close panel/ }))
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('tells a completed milestone from an overdue one using the date', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        deadline: '2025-01-08',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
      },
      {
        id: 'pozo',
        title: 'The well',
        deadline: '2025-01-11',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
    ])

    expect(screen.getByRole('button', { name: /Supplies/ })).toHaveTextContent(
      /completed/i,
    )
    expect(screen.getByRole('button', { name: /The well/ })).toHaveTextContent(
      /overdue/i,
    )
  })
})

describe('Questline · announcements and chain state', () => {
  const A_COMPLETE = { id: 'provisiones', title: 'Supplies', tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }] }
  const B_COMPLETE = { id: 'pozo', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: true }] }
  const C_PENDING = { id: 'cima', title: 'The summit', tasks: [{ id: 'bandera', title: 'Plant the flag', done: false }] }

  it('announces the first unlocked milestone and not a neighbour that was already complete', async () => {
    const user = renderChain([A_COMPLETE, B_COMPLETE, C_PENDING])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))
    expect(chainStatus()).toHaveTextContent(/“The summit” locked\./)

    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))

    expect(chainStatus()).toHaveTextContent(
      /Milestone “Supplies” completed\. “The summit” unlocked\./,
    )
    expect(chainStatus()).not.toHaveTextContent(/The well/)
  })

  it('announces the completed journey when reopening and closing the last milestone', async () => {
    const user = renderChain([A_COMPLETE, B_COMPLETE])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))
    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))

    expect(chainStatus()).toHaveTextContent(
      /Milestone “Supplies” completed\. The journey is complete\./,
    )
    expect(chainStatus()).not.toHaveTextContent(/unlocked/)
  })

  it('announces the re-lock when a task is added to a completed milestone', async () => {
    const user = renderChain([
      A_COMPLETE,
      { id: 'pozo', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.type(
      screen.getByRole('textbox', { name: /New task in “Supplies”/ }),
      'Check the saddlebags',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(chainStatus()).toHaveTextContent(/“The well” locked\./)
  })

  it('announces the re-lock of a milestone when an earlier one reopens', async () => {
    const user = renderChain([
      A_COMPLETE,
      { id: 'pozo', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Fill the waterskin' }))

    expect(chainStatus()).toHaveTextContent(/“The well” locked\./)

    await user.click(screen.getByRole('button', { name: /The well/ }))
    expect(screen.getByRole('checkbox', { name: 'Lower the lantern' })).toBeDisabled()
  })
})

describe('Questline · deletion and drafts', () => {
  it('does not announce a false completion when deleting a milestone before a completed one', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Supplies', tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }] },
      { id: 'pozo', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: true }] },
    ])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Delete milestone' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete the milestone' }))

    expect(chainStatus()).toHaveTextContent(
      'Milestone “Supplies” removed from the path.',
    )
    expect(chainStatus()).not.toHaveTextContent(/The well.*completed/i)
  })

  it('keeps the delete message when the chain changes state', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Supplies', tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }] },
      { id: 'pozo', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Supplies/ }))
    await user.click(screen.getByRole('button', { name: 'Delete milestone' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete the milestone' }))

    expect(chainStatus()).toHaveTextContent(
      /Milestone “Supplies” removed from the path\./,
    )
    expect(chainStatus()).toHaveTextContent(/“The well” unlocked\./)
  })

  it('discards the draft milestone when creation is cancelled', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Supplies', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Add milestone' }))
    expect(screen.getByRole('textbox', { name: 'Milestone name' })).toHaveValue('New milestone')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('button', { name: /New milestone/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add milestone' })).toHaveFocus()
  })

  it('keeps the new milestone if it already has work when the editor closes', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Supplies', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Add milestone' }))
    await user.type(
      screen.getByRole('textbox', { name: /New task in “New milestone”/ }),
      'Seal the map',
    )
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: /New milestone/ })).toBeInTheDocument()
  })

  it('asks for one new milestone when “Add milestone” is pressed twice', async () => {
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Add milestone' }))
    await user.click(screen.getByRole('button', { name: 'Add milestone' }))

    /*
      The first draft was never touched, so it must be replaced, not stranded:
      an empty milestone is never complete and would lock everything after it.
    */
    const drafts = screen.getAllByRole('button', { name: /New milestone/ })
    expect(drafts).toHaveLength(1)
    expect(drafts[0]).toHaveAccessibleName(/In progress/)
    expect(screen.getByText(/^1 of 2 milestones/)).toBeInTheDocument()
    expect(screen.queryByText(/unlocks when/i)).not.toBeInTheDocument()

    /* The second press opens its own editor, so the route keeps growing. */
    expect(screen.getByRole('textbox', { name: 'Milestone name' })).toHaveValue(
      'New milestone',
    )
  })
})

describe('Questline · state, names and ids', () => {
  const STATE_CASES = [
    {
      state: 'active',
      nodes: [
        {
          id: 'provisiones',
          title: 'Supplies',
          tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
        },
      ],
      title: 'Supplies',
      word: 'In progress.',
      label: 'In progress',
    },
    {
      state: 'complete',
      nodes: [
        {
          id: 'provisiones',
          title: 'Supplies',
          tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
        },
      ],
      title: 'Supplies',
      word: 'Completed.',
      label: 'Completed',
    },
    {
      state: 'overdue',
      nodes: [
        {
          id: 'provisiones',
          title: 'Supplies',
          deadline: '2025-01-10',
          tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
        },
      ],
      title: 'Supplies',
      word: 'Overdue.',
      label: 'Overdue',
    },
    {
      state: 'locked',
      nodes: [
        {
          id: 'provisiones',
          title: 'Supplies',
          tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
        },
        {
          id: 'cima',
          title: 'The summit',
          tasks: [{ id: 'bandera', title: 'Plant the flag', done: false }],
        },
      ],
      title: 'The summit',
      word: 'Locked.',
      label: 'Locked',
    },
  ]

  it.each(STATE_CASES)(
    'exposes the $state state on the rail and in the panel',
    async ({ nodes, title, word, label }) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2025, 0, 12, 12))

      const user = renderChain(nodes)
      const trigger = screen.getByRole('button', {
        name: new RegExp(title),
      })

      expect(trigger).toHaveAccessibleName(
        new RegExp(word.replace('.', '\\.')),
      )

      await user.click(trigger)
      expect(screen.getByText(label)).toBeVisible()
    },
  )

  it('announces each milestone state in text, including the active one', () => {
    renderChain([
      { id: 'done', title: 'Supplies', tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }] },
      { id: 'active', title: 'The well', tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }] },
      { id: 'locked', title: 'The summit', tasks: [] },
    ])

    expect(screen.getByRole('button', { name: /Supplies/ })).toHaveAccessibleName(/Completed/)
    expect(screen.getByRole('button', { name: /The well/ })).toHaveAccessibleName(/In progress/)
    expect(screen.getByRole('button', { name: /The summit/ })).toHaveAccessibleName(/Locked/)
  })

  it('announces the overdue state in text', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    renderChain([
      {
        id: 'pozo',
        title: 'The well',
        deadline: '2025-01-10',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
    ])

    expect(screen.getByRole('button', { name: /The well/ })).toHaveAccessibleName(/Overdue/)
  })

  it('flags an overdue deadline on a locked milestone without changing its state', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Supplies',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }],
      },
      {
        id: 'pozo',
        title: 'The well',
        deadline: '2025-01-10',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
    ])

    const trigger = screen.getByRole('button', { name: /The well/ })
    expect(trigger).toHaveAccessibleName(/Locked/)

    await user.click(trigger)
    const panel = screen.getByRole('region', { name: 'The well' })

    expect(panel).toHaveAttribute('data-overdue', 'true')
    expect(panel).toHaveTextContent('Was due on')
    expect(screen.getByText('Locked')).toBeVisible()
  })

  it('uses a default label', () => {
    render(<Questline defaultNodes={CHAIN} />)

    expect(screen.getByText('Milestone route')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Milestone route' })).toBeInTheDocument()
  })

  it('names the rail neutrally when there is no label', () => {
    render(<Questline defaultNodes={CHAIN} label="" />)

    expect(screen.queryByText('Milestone route')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Milestones' })).toBeInTheDocument()
  })

  it('re-exports the public model helpers from the component', () => {
    expect(formatQuestNumber(7)).toBe('07')
  })

  it('sanitises DOM ids without breaking aria-controls', async () => {
    const user = renderChain([{ id: 'march pass', title: 'March pass', tasks: [] }])
    const trigger = screen.getByRole('button', { name: /March pass/ })

    await user.click(trigger)
    const panelId = trigger.getAttribute('aria-controls')

    expect(panelId).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(document.getElementById(panelId as string)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'March pass' })).toBeInTheDocument()
  })

  it('refreshes deadlines when returning to the tab', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 9))

    renderChain([
      {
        id: 'pozo',
        title: 'The well',
        deadline: '2025-01-12',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
      },
    ])

    const trigger = screen.getByRole('button', { name: /The well/ })
    expect(trigger).not.toHaveAccessibleName(/Overdue/)

    act(() => {
      vi.setSystemTime(new Date(2025, 0, 13, 9))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(trigger).toHaveAccessibleName(/Overdue/)
  })

  it('does not show “0 of 0 tasks” when milestones have no tasks', () => {
    renderChain([{ id: 'provisiones', title: 'Supplies', tasks: [] }])

    const tally = screen.getByText(/^0 of 1 milestone/)
    expect(tally).toBeInTheDocument()
    expect(tally).not.toHaveTextContent(/tasks/)
  })
})

describe('Questline · focus on external changes', () => {
  it('keeps focus in the panel when its control becomes unusable', async () => {
    const user = userEvent.setup()
    const provisiones = {
      id: 'provisiones',
      title: 'Supplies',
      tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
    }
    const pozo = {
      id: 'pozo',
      title: 'The well',
      tasks: [{ id: 'farol', title: 'Lower the lantern', done: false }],
    }

    const { rerender } = render(
      <Questline nodes={[provisiones, pozo]} label="Test route" />,
    )

    await user.click(screen.getByRole('button', { name: /The well/ }))
    const farol = screen.getByRole('checkbox', { name: 'Lower the lantern' })
    farol.focus()
    expect(farol).toHaveFocus()

    rerender(
      <Questline
        nodes={[
          { ...provisiones, tasks: [{ id: 'odre', title: 'Fill the waterskin', done: false }] },
          pozo,
        ]}
        label="Test route"
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Lower the lantern' })).toBeDisabled()
    expect(screen.getByRole('region', { name: 'The well' })).toHaveFocus()
  })
})
