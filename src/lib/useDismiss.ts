import { useEffect, useRef, type RefObject } from 'react'

interface UseDismissOptions {
  open: boolean
  onClose: (restoreFocus?: boolean) => void
  refs: Array<RefObject<HTMLElement | null>>
}

interface DismissEntry {
  /**
   * Live refs: the array is replaced on every render, the ref object is
   * stable, so an entry always sees the current trigger and surface.
   */
  refsRef: RefObject<Array<RefObject<HTMLElement | null>>>
}

/*
  Overlays can nest — the milestone editor hosts a date picker. A flat list
  in mount order lets the inner surface own the first Escape and treat its
  own floating node as “inside” for every surface below it, so opening a
  calendar does not dismiss the editor that contains its trigger.
*/
const openEntries: DismissEntry[] = []

function contains(entry: DismissEntry, target: Node): boolean {
  return entry.refsRef.current.some((ref) => ref.current?.contains(target))
}

/**
 * Closes a floating surface on outside pointer, Escape or focus leaving both
 * the trigger and the surface. Escape restores focus to the trigger.
 */
export function useDismiss({ open, onClose, refs }: UseDismissOptions) {
  const refsRef = useRef(refs)
  const onCloseRef = useRef(onClose)
  refsRef.current = refs
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const entry: DismissEntry = { refsRef }
    openEntries.push(entry)

    /* A nested surface opened after this one owns the next Escape. */
    const isTop = () => openEntries[openEntries.length - 1] === entry
    const isNested = (target: Node) => {
      const index = openEntries.indexOf(entry)
      if (index < 0) return false
      for (let cursor = index + 1; cursor < openEntries.length; cursor += 1) {
        if (contains(openEntries[cursor], target)) return true
      }
      return false
    }
    const staysOpen = (target: Node | null) =>
      Boolean(target) && (contains(entry, target as Node) || isNested(target as Node))

    const onPointerDown = (event: PointerEvent) => {
      if (staysOpen(event.target as Node)) return
      onCloseRef.current(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop()) return
      if (event.key === 'Escape' || event.key === 'Esc') {
        /* An IME owns Escape while it composes: let it cancel the candidate. */
        if (event.isComposing || event.keyCode === 229) return
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current(true)
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      if (staysOpen(event.target as Node)) return
      onCloseRef.current(false)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn, true)

    return () => {
      const index = openEntries.indexOf(entry)
      if (index >= 0) openEntries.splice(index, 1)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocusIn, true)
    }
  }, [open])
}
