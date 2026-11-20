import { StrictMode, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePersistentState } from '../src/lib/usePersistentState'

const KEY = 'liferpg-test-list-v1'

function parseStored(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : null
}

function renderList(parse = parseStored) {
  return renderHook(() => usePersistentState<string[]>(KEY, () => [], parse))
}

function strict({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>
}

/* A tab only ever learns about another tab through this event. */
function externalWrite(newValue: string | null, key = KEY) {
  act(() => {
    if (newValue === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, newValue)
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('usePersistentState · a second tab', () => {
  it('adopts a write from another tab instead of overwriting it later', () => {
    const { result } = renderList()
    expect(result.current[0]).toEqual([])

    externalWrite(JSON.stringify(['written elsewhere']))

    expect(result.current[0]).toEqual(['written elsewhere'])
    /* Adopting is not a change: the value on screen is the one in storage. */
    expect(window.localStorage.getItem(KEY)).toBe(
      JSON.stringify(['written elsewhere']),
    )
  })

  it('ignores the echo of its own write', () => {
    const parseSpy = vi.fn(parseStored)
    const { result } = renderList(parseSpy)

    act(() => result.current[1](['mine']))
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(['mine']))
    expect(parseSpy).not.toHaveBeenCalled()

    externalWrite(JSON.stringify(['mine']))

    expect(parseSpy).not.toHaveBeenCalled()
    expect(result.current[0]).toEqual(['mine'])
  })

  it('ignores a payload it cannot parse, and keys that are not its own', () => {
    const { result } = renderList()
    act(() => result.current[1](['mine']))

    externalWrite('{ not json')
    externalWrite('"a string, not a list"')
    externalWrite(JSON.stringify(['theirs']), 'another-key')

    expect(result.current[0]).toEqual(['mine'])
  })
})

describe('usePersistentState · a payload that does not fit', () => {
  it('reads an empty journal as valid storage, not as corruption', () => {
    window.localStorage.setItem(KEY, '[]')

    const { result } = renderList()

    expect(result.current[0]).toEqual([])
    expect(window.localStorage.getItem(KEY)).toBe('[]')
    expect(window.localStorage.getItem(`${KEY}-corrupt`)).toBeNull()
  })

  it('keeps the unreadable payload aside and writes only on the first real change', () => {
    const broken = '[{"id":"a"},'
    window.localStorage.setItem(KEY, broken)

    const { result } = renderHook(
      () => usePersistentState<string[]>(KEY, () => ['seed'], parseStored),
      { wrapper: strict },
    )

    expect(result.current[0]).toEqual(['seed'])
    expect(window.localStorage.getItem(KEY)).toBe(broken)
    expect(window.localStorage.getItem(`${KEY}-corrupt`)).toBe(broken)

    act(() => result.current[1](['the real one']))

    expect(window.localStorage.getItem(KEY)).toBe(
      JSON.stringify(['the real one']),
    )
    expect(window.localStorage.getItem(`${KEY}-corrupt`)).toBe(broken)
  })

  it('stashes the payload once instead of overwriting an earlier loss', () => {
    window.localStorage.setItem(`${KEY}-corrupt`, 'the payload lost yesterday')
    window.localStorage.setItem(KEY, '{"shape":"wrong"}')

    const { result } = renderHook(
      () => usePersistentState<string[]>(KEY, () => ['seed'], parseStored),
      { wrapper: strict },
    )

    expect(result.current[0]).toEqual(['seed'])
    expect(window.localStorage.getItem(`${KEY}-corrupt`)).toBe(
      'the payload lost yesterday',
    )
  })
})
