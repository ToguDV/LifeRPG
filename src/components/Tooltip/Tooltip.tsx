import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useFloating } from '../../lib/useFloating'
import styles from './Tooltip.module.css'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  delay?: number
  id?: string
}

export function Tooltip({ content, children, side = 'top', delay = 240, id }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const showTimer = useRef(0)
  const hideTimer = useRef(0)
  const autoId = useId()
  const tooltipId = id ?? `tooltip-${autoId}`
  const [open, setOpen] = useState(false)

  const floating = useFloating({
    open,
    anchorRef,
    floatingRef,
    side,
    align: 'center',
    gap: 8,
  })

  useEffect(() => {
    return () => {
      window.clearTimeout(showTimer.current)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const show = () => {
    window.clearTimeout(hideTimer.current)
    window.clearTimeout(showTimer.current)
    setOpen(true)
  }

  const showDelayed = () => {
    window.clearTimeout(hideTimer.current)
    window.clearTimeout(showTimer.current)
    showTimer.current = window.setTimeout(() => setOpen(true), delay)
  }

  const hide = () => {
    window.clearTimeout(showTimer.current)
    hideTimer.current = window.setTimeout(() => setOpen(false), 80)
  }

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby':
          [open ? tooltipId : null, (children.props as { 'aria-describedby'?: string })['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined,
      })
    : children

  return (
    <>
      <span
        ref={anchorRef}
        className={styles.anchor}
        onMouseEnter={showDelayed}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {trigger}
      </span>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={floatingRef}
              id={tooltipId}
              role="tooltip"
              data-side={floating.side}
              className={styles.tooltip}
              style={floating.style}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
