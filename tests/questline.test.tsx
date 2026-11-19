import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Questline, formatQuestNumber } from '../src/components/Questline/Questline'
import type { QuestNode } from '../src/components/Questline/Questline'

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

/*
  The chain's live region. The milestone panel may grow its own announcements,
  so pick the region reporting chain events and fall back to the last one (the
  chain region renders after the panel and the add row).
*/
function chainStatus(): HTMLElement {
  const regions = screen.getAllByRole('status')
  return (
    regions.find((region) =>
      /(cumplido|desbloque|bloquead|eliminado|travesía)/i.test(region.textContent ?? ''),
    ) ?? regions[regions.length - 1]
  )
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

    expect(chainStatus()).toHaveTextContent(
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
    expect(chainStatus()).toBeEmptyDOMElement()
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

    await user.click(screen.getByRole('button', { name: /Cerrar/ }))
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

describe('Questline · anuncios y estado de la cadena', () => {
  const A_COMPLETE = { id: 'provisiones', title: 'Provisiones', tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }] }
  const B_COMPLETE = { id: 'pozo', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: true }] }
  const C_PENDING = { id: 'cima', title: 'La cima', tasks: [{ id: 'bandera', title: 'Clavar la bandera', done: false }] }

  it('anuncia el primer hito desbloqueado y no un vecino que ya estaba cumplido', async () => {
    const user = renderChain([A_COMPLETE, B_COMPLETE, C_PENDING])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))
    expect(chainStatus()).toHaveTextContent(/Se ha bloqueado «La cima»\./)

    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))

    expect(chainStatus()).toHaveTextContent(
      /Hito «Provisiones» cumplido\. Se ha desbloqueado «La cima»\./,
    )
    expect(chainStatus()).not.toHaveTextContent(/El pozo/)
  })

  it('anuncia la travesía completa al reabrir y cerrar un hito sin posteriores', async () => {
    const user = renderChain([A_COMPLETE, B_COMPLETE])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))
    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))

    expect(chainStatus()).toHaveTextContent(
      /Hito «Provisiones» cumplido\. La travesía está completa\./,
    )
    expect(chainStatus()).not.toHaveTextContent(/desbloqueado/)
  })

  it('anuncia el rebloqueo al añadir una tarea a un hito cumplido', async () => {
    const user = renderChain([
      A_COMPLETE,
      { id: 'pozo', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.type(
      screen.getByRole('textbox', { name: /Nueva tarea en «Provisiones»/ }),
      'Revisar las alforjas',
    )
    await user.click(screen.getByRole('button', { name: 'Añadir' }))

    expect(chainStatus()).toHaveTextContent(/Se ha bloqueado «El pozo»\./)
  })

  it('anuncia el rebloqueo de un hito al reabrir uno anterior', async () => {
    const user = renderChain([
      A_COMPLETE,
      { id: 'pozo', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Llenar el odre' }))

    expect(chainStatus()).toHaveTextContent(/Se ha bloqueado «El pozo»\./)

    await user.click(screen.getByRole('button', { name: /El pozo/ }))
    expect(screen.getByRole('checkbox', { name: 'Bajar el farol' })).toBeDisabled()
  })
})

describe('Questline · borrado y borradores', () => {
  it('no anuncia un cumplimiento falso al borrar un hito anterior a uno cumplido', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Provisiones', tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }] },
      { id: 'pozo', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: true }] },
    ])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar hito' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar el hito' }))

    expect(chainStatus()).toHaveTextContent(
      'Hito «Provisiones» eliminado del camino.',
    )
    expect(chainStatus()).not.toHaveTextContent(/El pozo.*cumplido/i)
  })

  it('conserva el mensaje de borrado cuando la cadena cambia de estado', async () => {
    const user = renderChain([
      { id: 'provisiones', title: 'Provisiones', tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }] },
      { id: 'pozo', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }] },
    ])

    await user.click(screen.getByRole('button', { name: /Provisiones/ }))
    await user.click(screen.getByRole('button', { name: 'Eliminar hito' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar el hito' }))

    expect(chainStatus()).toHaveTextContent(
      /Hito «Provisiones» eliminado del camino\./,
    )
    expect(chainStatus()).toHaveTextContent(/Se ha desbloqueado «El pozo»\./)
  })

  it('descarta el hito borrador si se cancela la creación', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Provisiones', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Añadir hito' }))
    expect(screen.getByRole('textbox', { name: 'Nombre del hito' })).toHaveValue('Nuevo hito')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('button', { name: /Nuevo hito/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Añadir hito' })).toHaveFocus()
  })

  it('conserva el hito nuevo si ya tiene trabajo al cerrar el editor', async () => {
    const user = renderChain([{ id: 'provisiones', title: 'Provisiones', tasks: [] }])

    await user.click(screen.getByRole('button', { name: 'Añadir hito' }))
    await user.type(
      screen.getByRole('textbox', { name: /Nueva tarea en «Nuevo hito»/ }),
      'Sellar el mapa',
    )
    await user.click(screen.getByRole('button', { name: 'Añadir' }))

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: /Nuevo hito/ })).toBeInTheDocument()
  })
})

describe('Questline · estado, nombres e ids', () => {
  const STATE_CASES = [
    {
      state: 'active',
      nodes: [
        {
          id: 'provisiones',
          title: 'Provisiones',
          tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
        },
      ],
      title: 'Provisiones',
      word: 'En curso.',
      label: 'En curso',
    },
    {
      state: 'complete',
      nodes: [
        {
          id: 'provisiones',
          title: 'Provisiones',
          tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }],
        },
      ],
      title: 'Provisiones',
      word: 'Cumplido.',
      label: 'Cumplido',
    },
    {
      state: 'overdue',
      nodes: [
        {
          id: 'provisiones',
          title: 'Provisiones',
          deadline: '2025-01-10',
          tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
        },
      ],
      title: 'Provisiones',
      word: 'Vencido.',
      label: 'Vencido',
    },
    {
      state: 'locked',
      nodes: [
        {
          id: 'provisiones',
          title: 'Provisiones',
          tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
        },
        {
          id: 'cima',
          title: 'La cima',
          tasks: [{ id: 'bandera', title: 'Clavar la bandera', done: false }],
        },
      ],
      title: 'La cima',
      word: 'Bloqueado.',
      label: 'Bloqueado',
    },
  ]

  it.each(STATE_CASES)(
    'expone el estado $state en el raíl y en el panel',
    async ({ nodes, title, word, label }) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2025, 0, 12, 12))

      const user = renderChain(nodes)
      const trigger = screen.getByRole('button', {
        name: new RegExp(title),
      })

      expect(trigger).toHaveAccessibleName(
        new RegExp(word.replace('.', '\\.')),
      )

      await user.click(trigger)
      expect(screen.getByText(label)).toBeVisible()
    },
  )

  it('anuncia en texto el estado de cada hito, incluido el activo', () => {
    renderChain([
      { id: 'hecho', title: 'Provisiones', tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }] },
      { id: 'curso', title: 'El pozo', tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }] },
      { id: 'bloqueado', title: 'La cima', tasks: [] },
    ])

    expect(screen.getByRole('button', { name: /Provisiones/ })).toHaveAccessibleName(/Cumplido/)
    expect(screen.getByRole('button', { name: /El pozo/ })).toHaveAccessibleName(/En curso/)
    expect(screen.getByRole('button', { name: /La cima/ })).toHaveAccessibleName(/Bloqueado/)
  })

  it('anuncia en texto el vencimiento de un hito', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    renderChain([
      {
        id: 'pozo',
        title: 'El pozo',
        deadline: '2025-01-10',
        tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
      },
    ])

    expect(screen.getByRole('button', { name: /El pozo/ })).toHaveAccessibleName(/Vencido/)
  })

  it('avisa del plazo vencido de un hito bloqueado sin cambiar su estado', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 12))

    const user = renderChain([
      {
        id: 'provisiones',
        title: 'Provisiones',
        tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }],
      },
      {
        id: 'pozo',
        title: 'El pozo',
        deadline: '2025-01-10',
        tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
      },
    ])

    const trigger = screen.getByRole('button', { name: /El pozo/ })
    expect(trigger).toHaveAccessibleName(/Bloqueado/)

    await user.click(trigger)
    const panel = screen.getByRole('region', { name: 'El pozo' })

    expect(panel).toHaveAttribute('data-overdue', 'true')
    expect(panel).toHaveTextContent('Venció el')
    expect(screen.getByText('Bloqueado')).toBeVisible()
  })

  it('usa un nombre en español por defecto', () => {
    render(<Questline defaultNodes={CHAIN} />)

    expect(screen.getByText('Ruta de hitos')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Ruta de hitos' })).toBeInTheDocument()
  })

  it('nombra el raíl de forma neutra cuando no hay label', () => {
    render(<Questline defaultNodes={CHAIN} label="" />)

    expect(screen.queryByText('Ruta de hitos')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Hitos' })).toBeInTheDocument()
  })

  it('reexporta desde el componente los helpers públicos del modelo', () => {
    expect(formatQuestNumber(7)).toBe('07')
  })

  it('sanea los ids del DOM sin romper aria-controls', async () => {
    const user = renderChain([{ id: 'paso de la marca', title: 'Paso de la Marca', tasks: [] }])
    const trigger = screen.getByRole('button', { name: /Paso de la Marca/ })

    await user.click(trigger)
    const panelId = trigger.getAttribute('aria-controls')

    expect(panelId).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(document.getElementById(panelId as string)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Paso de la Marca' })).toBeInTheDocument()
  })

  it('refresca los plazos al volver a la pestaña', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 12, 9))

    renderChain([
      {
        id: 'pozo',
        title: 'El pozo',
        deadline: '2025-01-12',
        tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
      },
    ])

    const trigger = screen.getByRole('button', { name: /El pozo/ })
    expect(trigger).not.toHaveAccessibleName(/Vencido/)

    act(() => {
      vi.setSystemTime(new Date(2025, 0, 13, 9))
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(trigger).toHaveAccessibleName(/Vencido/)
  })

  it('no cuenta «0 de 0 tareas» cuando los hitos no tienen tareas', () => {
    renderChain([{ id: 'provisiones', title: 'Provisiones', tasks: [] }])

    const tally = screen.getByText(/^0 de 1 hito/)
    expect(tally).toBeInTheDocument()
    expect(tally).not.toHaveTextContent(/tareas/)
  })
})

describe('Questline · foco ante cambios externos', () => {
  it('mantiene el foco en el panel si su control deja de ser usable', async () => {
    const user = userEvent.setup()
    const provisiones = {
      id: 'provisiones',
      title: 'Provisiones',
      tasks: [{ id: 'odre', title: 'Llenar el odre', done: true }],
    }
    const pozo = {
      id: 'pozo',
      title: 'El pozo',
      tasks: [{ id: 'farol', title: 'Bajar el farol', done: false }],
    }

    const { rerender } = render(
      <Questline nodes={[provisiones, pozo]} label="Ruta de prueba" />,
    )

    await user.click(screen.getByRole('button', { name: /El pozo/ }))
    const farol = screen.getByRole('checkbox', { name: 'Bajar el farol' })
    farol.focus()
    expect(farol).toHaveFocus()

    rerender(
      <Questline
        nodes={[
          { ...provisiones, tasks: [{ id: 'odre', title: 'Llenar el odre', done: false }] },
          pozo,
        ]}
        label="Ruta de prueba"
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Bajar el farol' })).toBeDisabled()
    expect(screen.getByRole('region', { name: 'El pozo' })).toHaveFocus()
  })
})
