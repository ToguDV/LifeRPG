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
        title="Session context"
        kicker="04 · Context"
        description="The day's task list."
        folio="04"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 3, name: 'Session context' }),
    ).toBeVisible()
    expect(screen.getByText('04 · Context')).toBeVisible()
    expect(screen.getByText("The day's task list.")).toBeVisible()
    expect(screen.getByRole('img', { name: 'Folio 04' })).toBeVisible()
  })

  it('keeps the plain heading on the panel surface', () => {
    render(<Card surface="panel" title="Campaign log" />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Campaign log' }),
    ).toBeVisible()
  })
})
