import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Questline } from '../src/components/Questline/Questline'
import type { QuestNode } from '../src/components/Questline/questline-model'

const SOLO: QuestNode[] = [
  {
    id: 'provisiones',
    title: 'Provisiones',
    tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
  },
]

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

describe('QuestNodePanel', () => {
  it('muestra su propio error con el título vacío y conserva required', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar el hito' }))

    const input = screen.getByRole('textbox', { name: 'Nombre del hito' })
    expect(input).toBeRequired()

    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Guardar hito' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El hito necesita un nombre.',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Guardar hito' })).toBeVisible()
  })

  it('con varios pendientes, no promete que el primero baste para desbloquear', async () => {
    const user = renderChain([
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
      {
        id: 'cima',
        title: 'La cima',
        tasks: [{ id: 'bandera', title: 'Clavar la bandera', done: false }],
      },
    ])

    await user.click(screen.getByRole('button', { name: /La cima/ }))

    expect(
      screen.getByText(
        /Se desbloquea al completar los hitos anteriores, empezando por «Provisiones»\./,
      ),
    ).toBeVisible()
  })

  it('nombra el único bloqueo cuando los anteriores ya están cumplidos', async () => {
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Provisiones',
        tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }],
      },
      {
        id: 'pozo',
        title: 'El pozo',
        tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
      },
      {
        id: 'cima',
        title: 'La cima',
        tasks: [{ id: 'bandera', title: 'Clavar la bandera', done: false }],
      },
    ])

    await user.click(screen.getByRole('button', { name: /La cima/ }))

    expect(
      screen.getByText(/Se desbloquea al completar «El pozo»\./),
    ).toBeVisible()
    expect(screen.queryByText(/hitos anteriores/)).not.toBeInTheDocument()
  })

  it('recibe el foco al abrirse por teclado y lo devuelve al disparador con Escape', async () => {
    const user = renderChain()
    await user.tab()

    const trigger = screen.getByRole('button', { name: /Provisiones/ })
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    const panel = screen.getByRole('region', { name: 'Provisiones' })
    await waitFor(() => expect(panel).toHaveFocus())

    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('usa el copy de cierre cuando es el último hito', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    expect(
      screen.getByText('Completa este hito para terminar la travesía.'),
    ).toBeVisible()

    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))

    expect(screen.getByText('La travesía está completa.')).toBeVisible()
    expect(screen.queryByText('El camino sigue.')).not.toBeInTheDocument()
  })

  it('reserva «cerrar» para el panel y «completar / cumplido» para el hito', async () => {
    const user = renderChain()
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    expect(screen.getByRole('button', { name: 'Cerrar el panel' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cerrar el hito' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Completa este hito para abrir el siguiente.'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Editar el hito' }))
    expect(
      screen.getByRole('button', { name: 'Descartar los cambios del hito' }),
    ).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))
    expect(screen.getByText(/1 de 1 tarea/)).toHaveTextContent('· cumplido')
    expect(screen.getByText('Cumplido')).toBeVisible()
    expect(screen.queryByText(/· cerrado/)).not.toBeInTheDocument()
    expect(screen.getByText('El camino sigue.')).toBeVisible()
  })

  it('lleva el foco a la tarea añadida', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Provisiones', tasks: [] },
    ])
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    const input = screen.getByRole('textbox', {
      name: /Nueva tarea en «Provisiones»/,
    })
    await user.type(input, 'Sellar el mapa{Enter}')

    const added = screen.getByRole('checkbox', { name: 'Sellar el mapa' })
    await waitFor(() => expect(added).toHaveFocus())
    expect(added).toBeVisible()
    expect(input).toHaveValue('')
  })

  it('muestra el plazo una sola vez', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Provisiones',
        deadline: '2025-01-15',
        tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
      },
    ])
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    expect(screen.getByText(/Hito 01 de 01 · Vence el/)).toBeVisible()
    expect(screen.getByText('0 de 1 tarea')).not.toHaveTextContent(/Vence|Faltan/)
  })

  it('cierra el editor del hito con Escape y devuelve el foco', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar el hito' }))

    const input = screen.getByRole('textbox', { name: 'Nombre del hito' })
    await user.type(input, ' del alba')
    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('textbox', { name: 'Nombre del hito' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar el hito' })).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Provisiones' })).toBeVisible()
  })

  it('cierra la confirmación de borrado con Escape y devuelve el foco', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar hito' }))

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('group', {
        name: 'Confirmar la eliminación del hito',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar hito' })).toHaveFocus()
  })

  it('cierra el editor de tarea con Escape y devuelve el foco a la fila', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar «Llenar el odre»' }))

    const input = screen.getByRole('textbox', {
      name: 'Título de «Llenar el odre»',
    })
    await user.type(input, ' del pozo')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox', { name: /Título de/ })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Editar «Llenar el odre»' }),
    ).toHaveFocus()
  })

  it('deshace una sola capa por cada Escape', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar el hito' }))
    await user.click(screen.getByRole('button', { name: 'Editar «Llenar el odre»' }))

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox', { name: /Título de/ })).not.toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Nombre del hito' }),
    ).toBeVisible()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('textbox', { name: 'Nombre del hito' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar el hito' })).toHaveFocus()
  })

  it('valida una tarea nueva sin nombre', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))

    const input = screen.getByRole('textbox', {
      name: /Nueva tarea en «Provisiones»/,
    })
    await user.type(input, '   {Enter}')

    expect(screen.getByRole('alert')).toHaveTextContent('La tarea necesita un nombre.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  it('valida un renombrado de tarea sin nombre', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar «Llenar el odre»' }))

    const input = screen.getByRole('textbox', {
      name: 'Título de «Llenar el odre»',
    })
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByRole('alert')).toHaveTextContent('La tarea necesita un nombre.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByRole('textbox', { name: 'Título de «Llenar el odre»' }),
    ).toBeVisible()
  })

  it('devuelve el foco a la fila vecina al eliminar una tarea', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Provisiones',
        tasks: [
          { id: 'odre', title: 'Llenar el odre', done: false },
          { id: 'mapa', title: 'Sellar el mapa', done: false },
        ],
      },
    ])
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar «Llenar el odre»' }))

    const next = screen.getByRole('button', { name: 'Editar «Sellar el mapa»' })
    await waitFor(() => expect(next).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(
      screen.queryByRole('checkbox', { name: 'Llenar el odre' }),
    ).not.toBeInTheDocument()
  })

  it('devuelve el foco a la fila al renombrar una tarea', async () => {
    const user = renderChain(SOLO)
    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Editar «Llenar el odre»' }))

    const input = screen.getByRole('textbox', {
      name: 'Título de «Llenar el odre»',
    })
    await user.clear(input)
    await user.type(input, 'Llenar el odre grande')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const renamed = screen.getByRole('button', {
      name: 'Editar «Llenar el odre grande»',
    })
    await waitFor(() => expect(renamed).toHaveFocus())
  })
})
