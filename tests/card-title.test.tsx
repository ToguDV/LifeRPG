import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../src/components/Card/Card'

/*
  The ribbon wraps the heading in decorative layers. The test pins the
  thing the ornament could break: the title must stay a real heading with
  its accessible name, next to the kicker, description and seal.
*/
describe('Card title', () => {
  it('keeps the ribboned title as the heading of the card', () => {
    render(
      <Card
        title="Contexto de la partida"
        kicker="04 · Contexto"
        description="La lista de tareas del día."
        folio="04"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 3, name: 'Contexto de la partida' }),
    ).toBeVisible()
    expect(screen.getByText('04 · Contexto')).toBeVisible()
    expect(screen.getByText('La lista de tareas del día.')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Folio 04' })).toBeVisible()
  })

  it('keeps the plain heading on the panel surface', () => {
    render(<Card surface="panel" title="Registro de campaña" />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Registro de campaña' }),
    ).toBeVisible()
  })
})
