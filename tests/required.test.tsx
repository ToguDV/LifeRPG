import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Checkbox, CheckboxGroup } from '../src/components/Checkbox/Checkbox'
import { DatePicker } from '../src/components/DatePicker/DatePicker'
import { Radio, RadioGroup } from '../src/components/Radio/Radio'
import { TimePicker } from '../src/components/TimePicker/TimePicker'

/*
  `aria-required` is not allowed on `role="button"` or `role="group"`, so the
  required state is announced as a visually hidden description. These tests
  assert the announced text, not the markup that carries it.
*/
describe('announced required state', () => {
  it('DatePicker describes the field as required', () => {
    render(<DatePicker label="Date" required />)

    expect(screen.getByRole('button', { name: /date/i })).toHaveAccessibleDescription(
      'Required',
    )
  })

  it('TimePicker describes the field as required', () => {
    render(<TimePicker label="Time" required />)

    expect(screen.getByRole('button', { name: /time/i })).toHaveAccessibleDescription(
      'Required',
    )
  })

  it('CheckboxGroup describes the group as required', () => {
    render(
      <CheckboxGroup label="Party" required>
        <Checkbox label="Lee" />
      </CheckboxGroup>,
    )

    expect(screen.getByRole('group', { name: 'Party' })).toHaveAccessibleDescription(
      'Required',
    )
  })

  it('RadioGroup describes the group as required', () => {
    render(
      <RadioGroup label="Route" required>
        <Radio value="north" label="North" />
      </RadioGroup>,
    )

    expect(screen.getByRole('group', { name: 'Route' })).toHaveAccessibleDescription(
      'Required',
    )
  })

  it('does not announce required when it is not asked for', () => {
    render(<TimePicker label="Time" />)

    expect(screen.getByRole('button', { name: /time/i })).not.toHaveAccessibleDescription(
      /required/i,
    )
  })
})
