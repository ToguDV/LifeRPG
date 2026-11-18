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

/**
 * Stable id for the `<label>` node. Controls that portal a popup need it to
 * name the popup: an `aria-labelledby` pointing at the control itself yields
 * no name (combobox and button are not name-from-content roles).
 */
export function getFieldLabelId(id: string): string {
  return `${id}-label`
}

/**
 * Ids of the messages `Field` renders for a control, in reading order: the
 * error first, then the hint. Both messages are rendered and both are
 * referenced by `aria-describedby`; an error never hides the hint.
 */
export function getFieldMessageIds(
  id: string,
  message: { hint?: ReactNode; error?: ReactNode },
): string[] {
  const ids: string[] = []
  if (message.error) ids.push(getFieldMessageId(id, 'error'))
  if (message.hint) ids.push(getFieldMessageId(id, 'hint'))
  return ids
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
  const labelId = getFieldLabelId(id)
  const errorId = error ? getFieldMessageId(id, 'error') : undefined
  const hintId = hint ? getFieldMessageId(id, 'hint') : undefined

  return (
    <div className={cx(styles.field, className)} data-invalid={error ? 'true' : undefined}>
      {hasLabel || labelAside ? (
        <div className={styles.labelRow}>
          {hasLabel ? (
            <label
              htmlFor={id}
              id={labelId}
              className={cx(styles.label, hideLabel && 'visually-hidden')}
            >
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

      {error ? (
        <p id={errorId} className={cx(styles.message, styles.error)} role="alert">
          {error}
        </p>
      ) : null}

      {hint ? (
        <p id={hintId} className={cx(styles.message, styles.hint)}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
