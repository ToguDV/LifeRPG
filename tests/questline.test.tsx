import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Questline } from '../src/components/Questline/Questline'
import type { QuestNode } from '../src/components/Questline/questline-model'

const CHAIN: QuestNode[] = [
  {
    id: 'provisiones',
    title: 'Provisiones',
    tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
  },
  {
    id: 'pozo',
    title: 'El pozo',
    tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
  },
]

function renderChain(nodes: QuestNode[] = CHAIN) {
  render(<Questline defaultNodes={nodes} label="Ruta de prueba" />)
  return userEvent.setup()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Questline', () => {
  it('abre el hito bloqueado para preparar tareas, pero no para marcarlas', async () => {
    const user = renderChain()

    await user.click(screen.getByRole('button', { name: /El pozo/ }))

    const farol = screen.getByRole('checkbox', { name: 'Bajar el farol' })
    expect(farol).toBeDisabled()
    expect(screen.getByText(/se desbloquea al completar «Provisiones»/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeEnabled()

    await user.type(
      screen.getByRole('textbox', { name: /Nueva tarea en «El pozo»/ }),
      'Llevar una cuerda de repuesto',
    )
    await user.click(screen.getByRole('button', { name: 'Añadir' }))

    expect(
      screen.getByRole('checkbox', { name: 'Llevar una cuerda de repuesto' }),
    ).toBeDisabled()
  })

  it('desbloquea el siguiente hito al cerrar el actual y lo anuncia', async () => {
    const user = renderChain()

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      /Hito «Provisiones» cumplido. Se ha desbloqueado «El pozo»./,
    )

    await user.click(screen.getByRole('button', { name: /El pozo/ }))
    expect(screen.getByRole('checkbox', { name: 'Bajar el farol' })).toBeEnabled()
  })

  it('no considera cerrado un hito sin tareas', async () => {
    const user = renderChain([
      { id: 'vacio', title: 'Hito vacío', tasks: [] },
      CHAIN[1],
    ])

    await user.click(screen.getByRole('button', { name: /El pozo/ }))

    expect(screen.getByRole('checkbox', { name: 'Bajar el farol' })).toBeDisabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('añade, renombra y elimina tareas del hito abierto', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Provisiones', tasks: [] },
    ])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    await user.type(
      screen.getByRole('textbox', { name: /Nueva tarea en «Provisiones»/ }),
      'Sellar el mapa',
    )
    await user.click(screen.getByRole('button', { name: 'Añadir' }))
    expect(screen.getByRole('checkbox', { name: 'Sellar el mapa' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar «Sellar el mapa»' }))
    const input = screen.getByRole('textbox', { name: 'Título de «Sellar el mapa»' })
    await user.clear(input)
    await user.type(input, 'Sellar el mapa del paso')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      screen.getByRole('checkbox', { name: 'Sellar el mapa del paso' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Eliminar «Sellar el mapa del paso»' }),
    )
    expect(
      screen.queryByRole('checkbox', { name: /Sellar el mapa/ }),
    ).not.toBeInTheDocument()
  })

  it('crea un hito, lo renombra y lo elimina con confirmación', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Provisiones', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Añadir hito' }))

    const titleInput = screen.getByRole('textbox', { name: 'Nombre del hito' })
    await user.clear(titleInput)
    await user.type(titleInput, 'El paso de la Marca')
    await user.click(screen.getByRole('button', { name: 'Guardar hito' }))

    expect(
      screen.getByRole('button', { name: /El paso de la Marca/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar hito' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Eliminar hito' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Eliminar hito' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar el hito' }))

    expect(
      screen.queryByRole('button', { name: /El paso de la Marca/ }),
    ).not.toBeInTheDocument()
  })

  it('conecta el disparador con su panel y devuelve el foco al cerrar', async () => {
    const user = renderChain()
    const trigger = screen.getByRole('button', { name: /Provisiones/ })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panelId = trigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId as string)).toHaveTextContent('Provisiones')

    await user.click(screen.getByRole('button', { name: 'Cerrar el hito' }))
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('distingue un hito cumplido de uno vencido con la fecha', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    renderChain([
      {
        id: 'provisiones',
        title: 'Provisiones',
        deadline: '2025-01-08',
        tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }],
      },
      {
        id: 'pozo',
        title: 'El pozo',
        deadline: '2025-01-11',
        tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
      },
    ])

    expect(screen.getByRole('button', { name: /Provisiones/ })).toHaveTextContent(
      /cumplido/i,
    )
    expect(screen.getByRole('button', { name: /El pozo/ })).toHaveTextContent(
      /vencido/i,
    )
  })
})
