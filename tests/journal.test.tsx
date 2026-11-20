import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JournalPage } from '../src/journal/JournalPage'
import { TASKS_KEY } from '../src/journal/journal-data'
import { ThemeProvider } from '../src/theme/ThemeProvider'

function renderJournal() {
  return render(
    <ThemeProvider>
      <JournalPage />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('JournalPage', () => {
  it('renders the seeded tasks, the progress and the route', () => {
    renderJournal()

    expect(
      screen.getByRole('checkbox', {
        name: 'Check “Fill the waterskin at the stream”',
      }),
    ).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Done' })).toHaveAttribute(
      'aria-valuetext',
      '1 / 5',
    )
    expect(
      screen.getByRole('button', { name: /The blind well/ }),
    ).toBeVisible()
  })

  it('adds a task, stores it and restores it on the next mount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderJournal()

    await user.type(screen.getByRole('textbox', { name: 'New task' }), 'Sharpen the axe')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(
      screen.getByRole('checkbox', { name: 'Check “Sharpen the axe”' }),
    ).toBeVisible()
    expect(JSON.parse(window.localStorage.getItem(TASKS_KEY) ?? '[]')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Sharpen the axe', done: false }),
      ]),
    )

    unmount()
    renderJournal()
    expect(
      screen.getByRole('checkbox', { name: 'Check “Sharpen the axe”' }),
    ).toBeVisible()
  })

  it('rejects an empty task', async () => {
    const user = userEvent.setup()
    renderJournal()

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Write a task first.')
    expect(screen.queryByRole('checkbox', { name: /Write a task first/ })).toBeNull()
  })

  it('moves the focus to the next task after a deletion', async () => {
    const user = userEvent.setup()
    renderJournal()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete “Fill the waterskin at the stream”',
      }),
    )

    expect(
      screen.getByRole('checkbox', {
        name: 'Check “Deliver three planks to Alderic”',
      }),
    ).toHaveFocus()
    expect(screen.getByText(/Task deleted:/)).toBeInTheDocument()
  })

  it('turns the headline date over at midnight', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 12, 23, 55))

    renderJournal()
    expect(screen.getByText('12 January 2026')).toBeVisible()

    act(() => {
      vi.setSystemTime(new Date(2026, 0, 13, 0, 5))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(screen.getByText('13 January 2026')).toBeVisible()
    expect(screen.queryByText('12 January 2026')).not.toBeInTheDocument()
  })
})
