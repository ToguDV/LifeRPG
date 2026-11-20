import { useEffect, useRef, type RefObject } from 'react'

interface UseDismissOptions {
  open: boolean
  onClose: (restoreFocus?: boolean) => void
  refs: Array<RefObject<HTMLElement | null>>
}

/**
 * Closes a floating surface on outside pointer, Escape or focus leaving
 * both the trigger and the surface. Escape restores focus to the trigger.
 */
export function useDismiss({ open, onClose, refs }: UseDismissOptions) {
  const refsRef = useRef(refs)
  const onCloseRef = useRef(onClose)
  refsRef.current = refs
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const contains = (target: Node | null) => {
      if (!target) return false
      return refsRef.current.some((ref) => ref.current?.contains(target))
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!contains(event.target as Node)) onCloseRef.current(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        /* An IME owns Escape while it composes: let it cancel the candidate. */
        if (event.isComposing || event.keyCode === 229) return
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current(true)
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!contains(event.target as Node)) onCloseRef.current(false)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocusIn, true)
    }
  }, [open])
}
