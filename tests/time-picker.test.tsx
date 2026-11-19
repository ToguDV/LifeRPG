import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimePicker } from '../src/components/TimePicker/TimePicker'

/*
  BUG-02 / BUG-04: “Now” used to clamp 09:58 down to 09:00 and a
  `minuteStep` of 0 made the minute loop never finish. Only `Date` is faked:
  the popover, the focus frame and the scroll timers keep running on real
  timers, so the tests stay deterministic without stalling user-event.
*/
const FIXED_NOW = new Date(2026, 10, 21, 9, 58, 0, 0)

function freezeClock() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
}

afterEach(() => {
  vi.useRealTimers()
})

function getTrigger(): HTMLElement {
  return screen.getByRole('button', { name: /time/i })
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getTrigger())
  return screen.findByRole('dialog', { name: 'Pick a time' })
}

describe('TimePicker “Now”', () => {
  it('rounds down to the 5-minute step', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Time" minuteStep={5} onChange={onChange} />)

    await openPicker(user)
    await user.click(screen.getByRole('button', { name: 'Now' }))

    expect(onChange).toHaveBeenLastCalledWith('09:55')
    expect(getTrigger()).toHaveTextContent('09:55')
  })

  it('rounds down to the 15-minute step without carrying into the hour', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Time" minuteStep={15} onChange={onChange} />)

    await openPicker(user)
    await user.click(screen.getByRole('button', { name: 'Now' }))

    expect(onChange).toHaveBeenLastCalledWith('09:45')
    expect(getTrigger()).toHaveTextContent('09:45')
  })

  it('opens the wheel with minuteStep 0 and uses the default step', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Time" minuteStep={0} onChange={onChange} />)

    await openPicker(user)

    const minutes = within(screen.getByRole('listbox', { name: 'Minute' })).getAllByRole('option')
    expect(minutes).toHaveLength(12)
    expect(minutes[0]).toHaveTextContent('00')

    await user.click(screen.getByRole('button', { name: 'Now' }))
    expect(onChange).toHaveBeenLastCalledWith('09:55')
  })

  it('closes with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<TimePicker label="Time" />)

    await openPicker(user)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Pick a time' })).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
  })
})
