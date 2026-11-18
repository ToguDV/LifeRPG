import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tooltip } from '../src/components/Tooltip/Tooltip'

/*
  BUG-01: `useFloating` ignored the requested side and always placed the
  surface below the anchor. jsdom has no layout, so the two rectangles the
  hook actually reads are stubbed: the anchor and the floating node. The
  return value is a minimal `DOMRect` — the cast is justified because jsdom
  never produces a real one here.
*/
interface AnchorBox {
  top: number
  height: number
}

function stubRects(anchor: AnchorBox, floating: { width: number; height: number }) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    const isFloating = this.getAttribute('role') === 'tooltip'
    const height = isFloating ? floating.height : anchor.height
    const top = isFloating ? 0 : anchor.top
    return {
      top,
      bottom: top + height,
      height,
      left: 80,
      right: 200,
      width: floating.width,
      x: 80,
      y: top,
      toJSON: () => ({}),
    } as DOMRect
  })
}

async function openTooltip(side: 'top' | 'bottom') {
  const user = userEvent.setup()
  render(
    <Tooltip content="Guardar en el códice" side={side}>
      <button type="button">Guardar</button>
    </Tooltip>,
  )
  /* Clicking focuses the button, and focus opens the tooltip synchronously. */
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  return screen.findByRole('tooltip')
}

describe('Tooltip side', () => {
  it('respeta side="top" cuando hay espacio encima', async () => {
    stubRects({ top: 300, height: 20 }, { width: 120, height: 40 })

    expect(await openTooltip('top')).toHaveAttribute('data-side', 'top')
  })

  it('respeta side="bottom" cuando hay espacio debajo', async () => {
    stubRects({ top: 300, height: 20 }, { width: 120, height: 40 })

    expect(await openTooltip('bottom')).toHaveAttribute('data-side', 'bottom')
  })

  it('voltea a bottom si no cabe encima', async () => {
    stubRects({ top: 10, height: 20 }, { width: 120, height: 40 })

    expect(await openTooltip('top')).toHaveAttribute('data-side', 'bottom')
  })

  it('voltea a top si no cabe debajo', async () => {
    const { innerHeight } = window
    stubRects({ top: innerHeight - 30, height: 20 }, { width: 120, height: 40 })

    expect(await openTooltip('bottom')).toHaveAttribute('data-side', 'top')
  })

  it('describe el disparador con el contenido mientras está abierto', async () => {
    stubRects({ top: 300, height: 20 }, { width: 120, height: 40 })
    await openTooltip('top')

    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAccessibleDescription(
      'Guardar en el códice',
    )
  })
})
