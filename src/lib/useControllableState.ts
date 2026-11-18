import { useCallback, useState } from 'react'

interface UseControllableStateOptions<T> {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

/**
 * Small controlled/uncontrolled bridge. Keeps every form control usable
 * both as a self-contained demo and as a controlled field in a real form.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>) {
  const [internal, setInternal] = useState<T>(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (previous: T) => T)(current) : next
      if (!isControlled) setInternal(resolved)
      onChange?.(resolved)
    },
    [current, isControlled, onChange],
  )

  return [current, setValue] as const
}
