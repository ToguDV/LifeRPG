import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface UseControllableStateOptions<T> {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

type SetControllableState<T> = (next: T | ((previous: T) => T)) => void

/**
 * Small controlled/uncontrolled bridge. Keeps every form control usable
 * both as a self-contained demo and as a controlled field in a real form.
 *
 * Uncontrolled: updates resolve against the latest internal value, not the
 * value captured by the render, so two functional updates batched in the same
 * tick both apply. `onChange` receives the resolved value.
 *
 * Controlled: the value belongs to the parent, so updates are delegated to
 * `onChange` and a functional update resolves against the `value` of the
 * current render. The hook cannot see a parent's pending state — do not batch
 * two functional updates on a controlled value; send the final value instead.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): readonly [T, SetControllableState<T>] {
  const [internal, setInternal] = useState<T>(defaultValue)
  const internalRef = useRef<T>(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  /* Props are mirrored after commit so `setValue` can keep a stable identity. */
  const optionsRef = useRef({ value, onChange })
  useLayoutEffect(() => {
    optionsRef.current = { value, onChange }
  })

  const setValue = useCallback<SetControllableState<T>>((next) => {
    const { value: controlledValue, onChange: notify } = optionsRef.current
    const resolve = (previous: T) =>
      typeof next === 'function' ? (next as (previous: T) => T)(previous) : next

    if (controlledValue !== undefined) {
      notify?.(resolve(controlledValue))
      return
    }

    const resolved = resolve(internalRef.current)
    internalRef.current = resolved
    setInternal(resolved)
    notify?.(resolved)
  }, [])

  return [current, setValue] as const
}
