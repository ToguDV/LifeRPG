import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './Toast.module.css'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  variant?: ToastVariant
  duration?: number
}

interface ToastRecord extends ToastOptions {
  id: number
}

type ToastFn = (options: ToastOptions) => number

const ToastContext = createContext<ToastFn | null>(null)

const ICONS: Record<ToastVariant, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  danger: 'alert',
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord
  onDismiss: (id: number) => void
}) {
  /*
    Hover and keyboard focus are tracked separately and ORed together: the
    pointer can leave while the close button keeps the focus, and neither
    reason may cancel the other. One state feeds one timer, so there is no
    double count. Resuming deliberately grants the full duration again; a
    toast that pauses must not expire on the frame the pointer or the focus
    leaves (WCAG 2.2.1).
  */
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused
  const variant = toast.variant ?? 'info'
  const duration = toast.duration ?? 4200

  useEffect(() => {
    if (paused || duration <= 0) return
    const timer = window.setTimeout(() => onDismiss(toast.id), duration)
    return () => window.clearTimeout(timer)
  }, [duration, onDismiss, paused, toast.id])

  return (
    <div
      className={cx(styles.toast, styles[variant])}
      data-surface="panel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next)) return
        setFocused(false)
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon name={ICONS[variant]} size="sm" />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        {toast.description ? (
          <p className={styles.description}>{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(toast.id)}
      >
        <Icon name="close" size="xs" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback<ToastFn>((options) => {
    counter.current += 1
    const id = counter.current
    setToasts((previous) => [...previous.slice(-3), { ...options, id }])
    return id
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div
              className={styles.viewport}
              role="region"
              aria-live="polite"
              aria-label="Notificaciones"
            >
              {toasts.map((item) => (
                <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
