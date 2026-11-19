import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './Checkbox.module.css'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode
  description?: ReactNode
  indeterminate?: boolean
  invalid?: boolean
  strikeWhenChecked?: boolean
  wrapperClassName?: string
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  invalid = false,
  strikeWhenChecked = false,
  wrapperClassName,
  className,
  id,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: CheckboxProps) {
  const autoId = useId()
  const fieldId = id ?? `checkbox-${autoId}`
  const descriptionId = description ? `${fieldId}-description` : undefined
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <label
      className={cx(
        styles.wrapper,
        strikeWhenChecked && styles.strike,
        wrapperClassName,
      )}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        {...rest}
        ref={inputRef}
        id={fieldId}
        type="checkbox"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={cx(ariaDescribedBy, descriptionId) || undefined}
        className={cx(styles.input, className)}
      />
      <span className={styles.box} aria-hidden="true">
        <Icon name="check" size="xs" className={styles.check} />
        <Icon name="minus" size="xs" className={styles.dash} />
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

export interface CheckboxGroupProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  optional?: boolean
  orientation?: 'vertical' | 'horizontal'
  className?: string
  children: ReactNode
}

export function CheckboxGroup({
  label,
  hint,
  error,
  required,
  optional,
  orientation = 'vertical',
  className,
  children,
}: CheckboxGroupProps) {
  const id = useId()
  const message = error ?? hint
  const messageId = message ? `checkbox-group-${id}-message` : undefined
  /*
    `aria-required` is not supported by the `group` role that a fieldset maps
    to (ARIA 1.2 and the `aria-allowed-attr` check), so the required state is
    announced as a description instead.
  */
  const requiredId = required ? `checkbox-group-${id}-required` : undefined
  const describedBy = [messageId, requiredId].filter(Boolean).join(' ') || undefined

  return (
    <fieldset
      className={cx(styles.group, className)}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      data-orientation={orientation}
    >
      {label ? (
        <legend className={styles.groupLabel}>
          <span>{label}</span>
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
          {optional ? <span className={styles.optional}>opcional</span> : null}
        </legend>
      ) : null}
      {requiredId ? (
        <span id={requiredId} className="visually-hidden">
          Required
        </span>
      ) : null}
      <div className={styles.items}>{children}</div>
      {message ? (
        <p
          id={messageId}
          className={cx(styles.groupMessage, error && styles.groupError)}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      ) : null}
    </fieldset>
  )
}
