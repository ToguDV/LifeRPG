import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '../src/components/Dialog/Dialog'

/*
  Dialogs nest in the journal: the milestone sheet hosts its own editor,
  which hosts the task editor and the pickers. Only the topmost one may
  answer Escape or trap Tab, or one press would take two layers down.
*/
interface NestedDialogsProps {
  inner?: boolean
  onOuterClose?: () => void
  onInnerClose?: () => void
}

function NestedDialogs({
  inner = false,
  onOuterClose = () => {},
  onInnerClose = () => {},
}: NestedDialogsProps) {
  return (
    <Dialog open onClose={onOuterClose} ariaLabel="Outer">
      <button type="button">Outer action</button>
      {inner ? (
        <Dialog open onClose={onInnerClose} ariaLabel="Inner">
          <button type="button">Inner action</button>
        </Dialog>
      ) : null}
    </Dialog>
  )
}

function hasFocus(container: HTMLElement): boolean {
  return container.contains(document.activeElement)
}

describe('Dialog', () => {
  it('gives the focus to the dialog that opens on top', async () => {
    const { rerender } = render(<NestedDialogs />)
    const outer = screen.getByRole('dialog', { name: 'Outer' })
    const outerAction = screen.getByRole('button', { name: 'Outer action' })

    await waitFor(() => expect(outerAction).toHaveFocus())

    rerender(<NestedDialogs inner />)
    const inner = screen.getByRole('dialog', { name: 'Inner' })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Inner action' })).toHaveFocus(),
    )
    expect(hasFocus(inner)).toBe(true)
    expect(hasFocus(outer)).toBe(false)
  })

  it('closes only the innermost dialog on Escape', async () => {
    const onOuterClose = vi.fn()
    const onInnerClose = vi.fn()
    const user = userEvent.setup()

    render(
      <NestedDialogs
        inner
        onOuterClose={onOuterClose}
        onInnerClose={onInnerClose}
      />,
    )

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Inner action' })).toHaveFocus(),
    )
    await user.keyboard('{Escape}')

    expect(onInnerClose).toHaveBeenCalledWith(true)
    expect(onOuterClose).not.toHaveBeenCalled()
  })

  it('traps Tab inside the innermost dialog', async () => {
    const user = userEvent.setup()

    render(<NestedDialogs inner />)
    const inner = screen.getByRole('dialog', { name: 'Inner' })
    const outer = screen.getByRole('dialog', { name: 'Outer' })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Inner action' })).toHaveFocus(),
    )

    for (let press = 0; press < 4; press += 1) {
      await user.tab()
      expect(hasFocus(inner)).toBe(true)
      expect(hasFocus(outer)).toBe(false)
    }
  })
})
