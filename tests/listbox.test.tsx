import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Combobox } from '../src/components/Combobox/Combobox'
import { Select } from '../src/components/Select/Select'

/*
  Both listboxes used to be portaled with no accessible name, and the trigger
  always advertised `aria-controls`, even closed and pointing at a popup that
  was not mounted. The name comes from the `Field` label node.
*/
const OPTIONS = [
  { value: 'lee', label: 'Viajera' },
  { value: 'guarda', label: 'Guardabosques' },
]

describe('Select', () => {
  it('nombra el listbox con la etiqueta y resuelve aria-controls solo abierto', async () => {
    const user = userEvent.setup()
    render(<Select label="Oficio" options={OPTIONS} />)

    const trigger = screen.getByRole('combobox', { name: 'Oficio' })
    expect(trigger).not.toHaveAttribute('aria-controls')

    await user.click(trigger)

    const controls = trigger.getAttribute('aria-controls')
    if (!controls) throw new Error('aria-controls missing while open')
    const listbox = screen.getByRole('listbox', { name: 'Oficio' })
    expect(document.getElementById(controls)).toBe(listbox)
    expect(listbox).toHaveAttribute('id', controls)

    await user.keyboard('{Escape}')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navega con las flechas y selecciona con Enter', async () => {
    const user = userEvent.setup()
    render(<Select label="Oficio" options={OPTIONS} />)

    const trigger = screen.getByRole('combobox', { name: 'Oficio' })
    await user.click(trigger)
    /* The menu opens on the first option; one step down reaches the second. */
    await user.keyboard('{ArrowDown}{Enter}')

    expect(trigger).toHaveTextContent('Guardabosques')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(trigger).toHaveFocus()
  })
})

describe('Combobox', () => {
  it('nombra el listbox con la etiqueta y resuelve aria-controls solo abierto', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Oficio" options={OPTIONS} />)

    const input = screen.getByRole('combobox', { name: 'Oficio' })
    expect(input).not.toHaveAttribute('aria-controls')

    await user.click(input)

    const controls = input.getAttribute('aria-controls')
    if (!controls) throw new Error('aria-controls missing while open')
    const listbox = screen.getByRole('listbox', { name: 'Oficio' })
    expect(document.getElementById(controls)).toBe(listbox)

    await user.keyboard('{Escape}')
    expect(input).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
