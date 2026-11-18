import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { useDismiss } from '../../lib/useDismiss'
import { useFloating, type FloatingAlign } from '../../lib/useFloating'
import { useSurface } from '../Surface/surface-context'
import styles from './Popover.module.css'

export interface PopoverProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  onClose: (restoreFocus?: boolean) => void
  children: ReactNode
  className?: string
  align?: FloatingAlign
  matchWidth?: boolean
  minWidth?: number
  maxWidth?: number
  id?: string
  role?: string
  ariaLabel?: string
  ariaLabelledby?: string
  style?: CSSProperties
}

/**
 * A portaled floating surface. Portals keep menus out of clipped or
 * filtered paper containers, and `data-surface` carries the parchment /
 * panel token context across the portal boundary.
 */
export function Popover({
  open,
  anchorRef,
  onClose,
  children,
  className,
  align = 'start',
  matchWidth = false,
  minWidth,
  maxWidth,
  id,
  role,
  ariaLabel,
  ariaLabelledby,
  style,
}: PopoverProps) {
  const floatingRef = useRef<HTMLDivElement>(null)
  const surface = useSurface()
  const floating = useFloating({
    open,
    anchorRef,
    floatingRef,
    align,
    matchWidth,
    minWidth,
    maxWidth,
  })

  useDismiss({ open, onClose, refs: [anchorRef, floatingRef] })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={floatingRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      data-surface={surface}
      className={cx(styles.popover, className)}
      style={{ ...floating.style, ...style }}
    >
      {children}
    </div>,
    document.body,
  )
}
