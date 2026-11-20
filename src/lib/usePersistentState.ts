import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

export interface PersistentStateOptions<T> {
  /** Rejects a stored payload that no longer matches the shape. */
  parse: (value: unknown) => T | null
}

/**
 * `useState` backed by `localStorage`. The stored value is read lazily on
 * mount and written after every change; malformed or unavailable storage
 * falls back to the seed instead of throwing.
 */
export function usePersistentState<T>(
  key: string,
  fallback: () => T,
  parse: PersistentStateOptions<T>['parse'],
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed = parse(JSON.parse(raw) as unknown)
        if (parsed !== null) return parsed
      }
    } catch {
      /* corrupt JSON or a blocked storage: use the seed */
    }
    return fallback()
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage can be unavailable in private contexts */
    }
  }, [key, value])

  return [value, setValue]
}
