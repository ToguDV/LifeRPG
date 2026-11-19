import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DatePicker } from '../src/components/DatePicker/DatePicker'

/*
  WCAG 2.5.3 (label in name): the grid prints the day as a plain number
  ("1"), so the accessible name must not pad it ("01 de enero de 2026" did
  not contain the visible text). Only `Date` is faked, like in the
  TimePicker tests, so the popover and the focus frame keep real timers.
*/
afterEach(() => {
  vi.useRealTimers()
})

describe('DatePicker nombre de los días', () => {
  it('contiene el número visible, sin relleno de cero', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 15))
    const user = userEvent.setup()
    render(<DatePicker label="Fecha" defaultValue={new Date(2026, 0, 1)} />)

    await user.click(screen.getByRole('button', { name: /^Fecha/ }))
    const day = await screen.findByRole('button', { name: '1 de enero de 2026' })

    expect(day).toHaveTextContent(/^1$/)
    expect(day).toHaveAccessibleName('1 de enero de 2026')
  })
})
