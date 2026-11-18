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
describe('required anunciado', () => {
  it('DatePicker describe el campo como obligatorio', () => {
    render(<DatePicker label="Fecha" required />)

    expect(screen.getByRole('button', { name: /fecha/i })).toHaveAccessibleDescription(
      'Campo obligatorio',
    )
  })

  it('TimePicker describe el campo como obligatorio', () => {
    render(<TimePicker label="Hora" required />)

    expect(screen.getByRole('button', { name: /hora/i })).toHaveAccessibleDescription(
      'Campo obligatorio',
    )
  })

  it('CheckboxGroup describe el grupo como obligatorio', () => {
    render(
      <CheckboxGroup label="Equipo" required>
        <Checkbox label="Lee" />
      </CheckboxGroup>,
    )

    expect(screen.getByRole('group', { name: 'Equipo' })).toHaveAccessibleDescription(
      'Campo obligatorio',
    )
  })

  it('RadioGroup describe el grupo como obligatorio', () => {
    render(
      <RadioGroup label="Ruta" required>
        <Radio value="norte" label="Norte" />
      </RadioGroup>,
    )

    expect(screen.getByRole('group', { name: 'Ruta' })).toHaveAccessibleDescription(
      'Campo obligatorio',
    )
  })

  it('no anuncia obligatoriedad cuando no se pide', () => {
    render(<TimePicker label="Hora" />)

    expect(screen.getByRole('button', { name: /hora/i })).not.toHaveAccessibleDescription(
      /campo obligatorio/i,
    )
  })
})
