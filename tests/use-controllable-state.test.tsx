import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useControllableState } from '../src/lib/useControllableState'

/*
  MAINT-01: the uncontrolled branch used to resolve every functional update
  against the value captured by the render, so two updates batched in the same
  tick collapsed into one. These tests keep the hook honest.
*/
function BatchedCounter({ onChange }: { onChange?: (value: number) => void }) {
  const [count, setCount] = useControllableState({ defaultValue: 0, onChange })

  return (
    <button
      type="button"
      onClick={() => {
        setCount((value) => value + 1)
        setCount((value) => value + 1)
      }}
    >
      {count}
    </button>
  )
}

describe('useControllableState', () => {
  it('composes two functional updates in the same tick', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<BatchedCounter onChange={onChange} />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('2')
    expect(onChange).toHaveBeenNthCalledWith(1, 1)
    expect(onChange).toHaveBeenLastCalledWith(2)
  })
})
