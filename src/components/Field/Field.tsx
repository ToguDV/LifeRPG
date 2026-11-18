import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Field.module.css'

export interface FieldProps {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  optional?: boolean
  optionalLabel?: string
  labelAside?: ReactNode
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

export function getFieldMessageId(
  id: string,
  kind: 'hint' | 'error',
): string {
  return `${id}-${kind}`
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  optionalLabel = 'opcional',
  labelAside,
  hideLabel,
  className,
  children,
}: FieldProps) {
  const hasLabel = Boolean(label)
  const message = error ?? hint
  const messageId = error
    ? getFieldMessageId(id, 'error')
    : hint
      ? getFieldMessageId(id, 'hint')
      : undefined

  return (
    <div className={cx(styles.field, className)} data-invalid={error ? 'true' : undefined}>
      {hasLabel || labelAside ? (
        <div className={styles.labelRow}>
          {hasLabel && !hideLabel ? (
            <label htmlFor={id} className={styles.label}>
              <span>{label}</span>
              {required ? (
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              ) : null}
              {optional ? <span className={styles.optional}>{optionalLabel}</span> : null}
            </label>
          ) : (
            <span />
          )}
          {labelAside ? <span className={styles.labelAside}>{labelAside}</span> : null}
        </div>
      ) : null}

      {children}

      {message ? (
        <p
          id={messageId}
          className={cx(styles.message, error ? styles.error : styles.hint)}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
