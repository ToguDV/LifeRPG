import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Switch.module.css'

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode
  description?: ReactNode
  size?: 'sm' | 'md'
  wrapperClassName?: string
}

export function Switch({
  label,
  description,
  size = 'md',
  wrapperClassName,
  className,
  id,
  disabled,
  ...rest
}: SwitchProps) {
  const autoId = useId()
  const fieldId = id ?? `switch-${autoId}`
  const descriptionId = description ? `${fieldId}-description` : undefined

  return (
    <label
      className={cx(styles.wrapper, size === 'sm' && styles.sm, wrapperClassName)}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        {...rest}
        id={fieldId}
        type="checkbox"
        role="switch"
        disabled={disabled}
        aria-describedby={cx(rest['aria-describedby'], descriptionId) || undefined}
        className={cx(styles.input, className)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label || description ? (
        <span className={styles.text}>
          {label ? <span className={styles.label}>{label}</span> : null}
          {description ? (
            <span id={descriptionId} className={styles.description}>
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  )
}
