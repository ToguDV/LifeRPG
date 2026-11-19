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
  { value: 'lee', label: 'Traveller' },
  { value: 'guarda', label: 'Ranger' },
]

describe('Select', () => {
  it('names the listbox from the label and only exposes aria-controls while open', async () => {
    const user = userEvent.setup()
    render(<Select label="Trade" options={OPTIONS} />)

    const trigger = screen.getByRole('combobox', { name: 'Trade' })
    expect(trigger).not.toHaveAttribute('aria-controls')

    await user.click(trigger)

    const controls = trigger.getAttribute('aria-controls')
    if (!controls) throw new Error('aria-controls missing while open')
    const listbox = screen.getByRole('listbox', { name: 'Trade' })
    expect(document.getElementById(controls)).toBe(listbox)
    expect(listbox).toHaveAttribute('id', controls)

    await user.keyboard('{Escape}')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('moves with the arrow keys and selects with Enter', async () => {
    const user = userEvent.setup()
    render(<Select label="Trade" options={OPTIONS} />)

    const trigger = screen.getByRole('combobox', { name: 'Trade' })
    await user.click(trigger)
    /* The menu opens on the first option; one step down reaches the second. */
    await user.keyboard('{ArrowDown}{Enter}')

    expect(trigger).toHaveTextContent('Ranger')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(trigger).toHaveFocus()
  })
})

describe('Combobox', () => {
  it('names the listbox from the label and only exposes aria-controls while open', async () => {
    const user = userEvent.setup()
    render(<Combobox label="Trade" options={OPTIONS} />)

    const input = screen.getByRole('combobox', { name: 'Trade' })
    expect(input).not.toHaveAttribute('aria-controls')

    await user.click(input)

    const controls = input.getAttribute('aria-controls')
    if (!controls) throw new Error('aria-controls missing while open')
    const listbox = screen.getByRole('listbox', { name: 'Trade' })
    expect(document.getElementById(controls)).toBe(listbox)

    await user.keyboard('{Escape}')
    expect(input).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
