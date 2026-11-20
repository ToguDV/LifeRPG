import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

export interface PersistentStateOptions<T> {
  /** Rejects a stored payload that no longer matches the shape. */
  parse: (value: unknown) => T | null
}

interface Initial<T> {
  value: T
  /**
   * The raw string that was stored but did not survive `parse`, kept so the
   * first commit can spare it instead of writing the seed over the journal.
   */
  corrupt: string | null
}

function readInitial<T>(
  key: string,
  fallback: () => T,
  parse: PersistentStateOptions<T>['parse'],
): Initial<T> {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    /* storage can be unavailable in private contexts */
  }
  if (!raw) return { value: fallback(), corrupt: null }

  try {
    const parsed = parse(JSON.parse(raw) as unknown)
    if (parsed !== null) return { value: parsed, corrupt: null }
  } catch {
    /* corrupt JSON falls through to the salvage path below */
  }
  /*
    A payload we cannot read is the user's data, not ours to overwrite with
    the seed: keep the raw string aside and let the next real change write.
  */
  return { value: fallback(), corrupt: raw }
}

/**
 * `useState` backed by `localStorage`. The stored value is read lazily on
 * mount and written after every change; malformed or unavailable storage
 * falls back to the seed instead of throwing.
 *
 * A second tab is a second writer: the `storage` listener adopts its writes
 * so two journals cannot silently overwrite each other.
 */
export function usePersistentState<T>(
  key: string,
  fallback: () => T,
  parse: PersistentStateOptions<T>['parse'],
): [T, Dispatch<SetStateAction<T>>] {
  /*
    The initial read happens once per component instance, not per render, and
    StrictMode's second mount reuses it: the parse and the corrupt stash must
    not run twice.
  */
  const initialRef = useRef<Initial<T> | null>(null)
  if (initialRef.current === null) {
    initialRef.current = readInitial(key, fallback, parse)
  }
  const initial = initialRef.current

  const [value, setValueState] = useState<T>(initial.value)
  /* The serialisation we last put in storage, to recognise our own echo. */
  const lastWritten = useRef<string | null>(null)
  /* Whether the caller has changed anything since mount. */
  const touched = useRef(false)

  /*
    Only a caller's change counts as a change. Mounting is not an edit, and a
    commit that only re-renders must never rewrite the key.
  */
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    touched.current = true
    setValueState(next)
  }, [])

  const parseRef = useRef(parse)
  parseRef.current = parse

  useEffect(() => {
    const corrupt = initial.corrupt
    /*
      The stored payload did not parse: keep it under its own key (once, so a
      StrictMode remount and a reload cannot stash it twice) and skip this
      write, which would otherwise replace the journal with the seed. The
      first user change produces the next write.
    */
    if (corrupt !== null && !touched.current) {
      try {
        if (window.localStorage.getItem(`${key}-corrupt`) === null) {
          window.localStorage.setItem(`${key}-corrupt`, corrupt)
        }
      } catch {
        /* storage can be unavailable in private contexts */
      }
      return
    }

    /*
      Serialising and writing share one guard: a value that cannot be
      serialised and a full quota both leave the screen working.
    */
    try {
      const serialised = JSON.stringify(value)
      if (serialised === lastWritten.current) return
      lastWritten.current = serialised
      window.localStorage.setItem(key, serialised)
    } catch {
      /* storage can be unavailable in private contexts */
    }
  }, [key, value, initial])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return
      /* Our own write comes back with the same bytes: nothing to adopt. */
      if (event.newValue === lastWritten.current) return

      let next: T | null = null
      try {
        next = parseRef.current(JSON.parse(event.newValue) as unknown)
      } catch {
        return
      }
      /* A payload we cannot read never replaces what is on screen. */
      if (next === null) return

      lastWritten.current = event.newValue
      setValueState(next)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, setValue]
}
