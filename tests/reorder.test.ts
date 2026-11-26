import { describe, expect, it } from 'vitest'
import {
  applyVisibleOrder,
  moveBeside,
  moveOneStep,
  sameOrder,
} from '../src/lib/reorder'

const ORDER = ['a', 'b', 'c', 'd']

describe('moveBeside', () => {
  it('drops a row below the anchor', () => {
    expect(moveBeside(ORDER, 'a', 'c', 'after')).toEqual(['b', 'c', 'a', 'd'])
  })

  it('drops a row above the anchor', () => {
    expect(moveBeside(ORDER, 'd', 'b', 'before')).toEqual(['a', 'd', 'b', 'c'])
  })

  it('drops a row above the first row and after the last one', () => {
    expect(moveBeside(ORDER, 'c', 'a', 'before')).toEqual(['c', 'a', 'b', 'd'])
    expect(moveBeside(ORDER, 'b', 'd', 'after')).toEqual(['a', 'c', 'd', 'b'])
  })

  it('returns null when the drop would not move anything', () => {
    /* Already above b and already below a: the same slot. */
    expect(moveBeside(ORDER, 'a', 'b', 'before')).toBeNull()
    expect(moveBeside(ORDER, 'b', 'a', 'after')).toBeNull()
    expect(moveBeside(ORDER, 'a', 'a', 'after')).toBeNull()
  })

  it('returns null for ids the list does not know', () => {
    expect(moveBeside(ORDER, 'z', 'a', 'after')).toBeNull()
    expect(moveBeside(ORDER, 'a', 'z', 'after')).toBeNull()
  })
})

describe('moveOneStep', () => {
  it('swaps with the neighbour', () => {
    expect(moveOneStep(ORDER, 'b', -1)).toEqual(['b', 'a', 'c', 'd'])
    expect(moveOneStep(ORDER, 'b', 1)).toEqual(['a', 'c', 'b', 'd'])
  })

  it('stops at the edges instead of wrapping', () => {
    expect(moveOneStep(ORDER, 'a', -1)).toBeNull()
    expect(moveOneStep(ORDER, 'd', 1)).toBeNull()
  })

  it('returns null for an unknown id', () => {
    expect(moveOneStep(ORDER, 'z', 1)).toBeNull()
  })
})

describe('sameOrder', () => {
  it('is true for the same ids in the same slots', () => {
    expect(sameOrder(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true)
  })

  it('is false for a different order or length', () => {
    expect(sameOrder(['a', 'b', 'c'], ['b', 'a', 'c'])).toBe(false)
    expect(sameOrder(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
  })
})

describe('applyVisibleOrder', () => {
  const items = ORDER.map((id) => ({ id, title: id.toUpperCase() }))
  const getId = (item: (typeof items)[number]) => item.id

  it('rewrites the whole collection when every row is visible', () => {
    expect(
      applyVisibleOrder(items, ['d', 'c', 'b', 'a'], getId).map(getId),
    ).toEqual(['d', 'c', 'b', 'a'])
  })

  it('keeps hidden rows in their slots and refills the visible ones', () => {
    const next = applyVisibleOrder(items, ['d', 'b'], getId).map(getId)
    expect(next).toEqual(['a', 'd', 'c', 'b'])
  })

  it('ignores unknown and repeated ids', () => {
    expect(
      applyVisibleOrder(items, ['b', 'z', 'a', 'b'], getId).map(getId),
    ).toEqual(['b', 'a', 'c', 'd'])
  })

  it('returns a new collection even when the order is the same', () => {
    const next = applyVisibleOrder(items, ['a', 'b'], getId)
    expect(next.map(getId)).toEqual(['a', 'b', 'c', 'd'])
    expect(next).not.toBe(items)
  })
})
