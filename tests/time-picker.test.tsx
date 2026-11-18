import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimePicker } from '../src/components/TimePicker/TimePicker'

/*
  BUG-02 / BUG-04: «Ahora» used to clamp 09:58 down to 09:00 and a
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
  return screen.getByRole('button', { name: /hora/i })
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getTrigger())
  return screen.findByRole('dialog', { name: 'Elegir hora' })
}

describe('TimePicker «Ahora»', () => {
  it('redondea hacia abajo al paso de 5 minutos', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Hora" minuteStep={5} onChange={onChange} />)

    await openPicker(user)
    await user.click(screen.getByRole('button', { name: 'Ahora' }))

    expect(onChange).toHaveBeenLastCalledWith('09:55')
    expect(getTrigger()).toHaveTextContent('09:55')
  })

  it('redondea hacia abajo al paso de 15 minutos sin acarreo de hora', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Hora" minuteStep={15} onChange={onChange} />)

    await openPicker(user)
    await user.click(screen.getByRole('button', { name: 'Ahora' }))

    expect(onChange).toHaveBeenLastCalledWith('09:45')
    expect(getTrigger()).toHaveTextContent('09:45')
  })

  it('con minuteStep 0 abre la rueda y usa el paso por defecto', async () => {
    freezeClock()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TimePicker label="Hora" minuteStep={0} onChange={onChange} />)

    await openPicker(user)

    const minutes = within(screen.getByRole('listbox', { name: 'Minuto' })).getAllByRole('option')
    expect(minutes).toHaveLength(12)
    expect(minutes[0]).toHaveTextContent('00')

    await user.click(screen.getByRole('button', { name: 'Ahora' }))
    expect(onChange).toHaveBeenLastCalledWith('09:55')
  })

  it('cierra con Escape y devuelve el foco al disparador', async () => {
    const user = userEvent.setup()
    render(<TimePicker label="Hora" />)

    await openPicker(user)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Elegir hora' })).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
  })
})
