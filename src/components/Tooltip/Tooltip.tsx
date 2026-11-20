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
import { useSurface } from '../Surface/surface-context'
import styles from './Tooltip.module.css'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  delay?: number
  id?: string
}

/**
 * A tooltip portaled to `body` is page content outside every landmark, so axe
 * flags it with `region`. The tooltip node keeps its role; its text lives in a
 * nameable `region` wrapper. Naming it after the trigger keeps the landmark
 * list meaningful and unique.
 */
function getTriggerLabel(children: ReactNode): string | undefined {
  if (!isValidElement(children)) return undefined
  const props = children.props as { 'aria-label'?: unknown; children?: ReactNode }
  if (typeof props['aria-label'] === 'string' && props['aria-label'].trim()) {
    return props['aria-label']
  }
  if (typeof props.children === 'string' && props.children.trim()) return props.children
  return undefined
}

export function Tooltip({ content, children, side = 'top', delay = 240, id }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const showTimer = useRef(0)
  const hideTimer = useRef(0)
  const autoId = useId()
  /*
    The tooltip is portaled to `body`, outside the visual tree, so it has to
    carry the surface it belongs to the way `Popover` does; the context is
    still React's, so it survives the portal. Its own tokens are
    surface-agnostic today, which is exactly why this must not be left to be
    discovered by the first `--ui-text` rule added here.
  */
  const surface = useSurface()
  const tooltipId = id ?? `tooltip-${autoId}`
  const [open, setOpen] = useState(false)
  const landmarkLabel =
    getTriggerLabel(children) ??
    (typeof content === 'string' && content.trim() ? content : 'Additional information')

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
            /*
              The landmark wraps the floating node instead of sitting inside
              it: the tooltip keeps only its text content, while the portaled
              subtree still belongs to a landmark (`region`).
            */
            <div role="region" aria-label={landmarkLabel}>
              <div
                ref={floatingRef}
                id={tooltipId}
                role="tooltip"
                data-side={floating.side}
                data-surface={surface}
                className={styles.tooltip}
                style={floating.style}
                onMouseEnter={show}
                onMouseLeave={hide}
              >
                {content}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
