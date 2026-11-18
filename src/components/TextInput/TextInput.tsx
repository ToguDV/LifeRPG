import {
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { Field, getFieldMessageId } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import styles from './TextInput.module.css'

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  prefix?: ReactNode
  suffix?: ReactNode
  clearable?: boolean
  onClear?: () => void
  fieldClassName?: string
}

export function TextInput({
  label,
  hint,
  error,
  optional,
  labelAside,
  size = 'md',
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  clearable = false,
  onClear,
  fieldClassName,
  className,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextInputProps) {
  const autoId = useId()
  const fieldId = id ?? `text-input-${autoId}`
  const inputRef = useRef<HTMLInputElement>(null)
  const [internal, setInternal] = useState(() => String(defaultValue ?? ''))
  const isControlled = value !== undefined
  const current = isControlled ? String(value ?? '') : internal
  const hasValue = current.length > 0

  const messageId = error
    ? getFieldMessageId(fieldId, 'error')
    : hint
      ? getFieldMessageId(fieldId, 'hint')
      : undefined
  const describedBy = cx(ariaDescribedBy, messageId) || undefined

  const handleClear = () => {
    if (!isControlled) setInternal('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <div
        className={cx(
          styles.control,
          styles[size],
          error && styles.invalid,
          disabled && styles.disabled,
          className,
        )}
        data-disabled={disabled ? 'true' : undefined}
        data-invalid={error ? 'true' : undefined}
      >
        {leadingIcon ? (
          <span className={styles.affix} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
        <input
          {...rest}
          ref={inputRef}
          id={fieldId}
          value={isControlled ? value : internal}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            if (!isControlled) setInternal(event.target.value)
            onChange?.(event)
          }}
          className={styles.input}
        />
        {clearable && hasValue && !disabled ? (
          <button
            type="button"
            className={styles.clear}
            onClick={handleClear}
            aria-label="Limpiar campo"
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
        {trailingIcon ? (
          <span className={styles.affix} aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </div>
    </Field>
  )
}
