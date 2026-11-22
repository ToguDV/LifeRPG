import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { useSurface } from '../Surface/surface-context'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  /** `true` when Escape closes it; the caller returns the focus to the trigger. */
  onClose: (restoreFocus?: boolean) => void
  children: ReactNode
  id?: string
  ariaLabel?: string
  ariaLabelledby?: string
  className?: string
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * A centred dialog over a blurred scrim. Editors live here instead of inside
 * their card, so opening one never reflows the journal; the page behind is
 * dimmed, inert to the pointer and closed on Escape or on a click on the
 * scrim. The focus is trapped while it is open and the caller owns its
 * return, because the trigger may live in either surface.
 */
export function Dialog({
  open,
  onClose,
  children,
  id,
  ariaLabel,
  ariaLabelledby,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const surface = useSurface()

  /*
    Escape closes the topmost dialog. A nested picker owns the first press:
    its `useDismiss` runs in the capture phase and stops propagation.
  */
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Esc') return
      if (event.isComposing || event.keyCode === 229) return
      event.preventDefault()
      onClose(true)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  /* The focus starts on the first control (the title) and never leaves. */
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const frame = requestAnimationFrame(() => {
      if (panel.contains(document.activeElement)) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!panel.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /* Only the scrim closes: a click inside the panel bubbles to it too. */
  useEffect(() => {
    if (!open) return
    const scrim = scrimRef.current
    if (!scrim) return
    const onClick = (event: MouseEvent) => {
      if (event.target === scrim) onClose(false)
    }
    scrim.addEventListener('click', onClick)
    return () => scrim.removeEventListener('click', onClick)
  }, [open, onClose])

  /* No scroll behind the scrim; the lost scrollbar width is given back. */
  useEffect(() => {
    if (!open) return
    const body = document.body
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) {
      const current = Number.parseFloat(getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${current + gap}px`
    }
    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div ref={scrimRef} className={styles.scrim} data-surface={surface}>
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        className={cx(styles.panel, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
