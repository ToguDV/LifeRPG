import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../../lib/cx'
import { Field, getFieldMessageIds } from '../Field/Field'
import styles from './Textarea.module.css'

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  showCount?: boolean
  autoGrow?: boolean
  resize?: 'none' | 'vertical'
  fieldClassName?: string
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  labelAside,
  showCount = false,
  autoGrow = false,
  resize = 'vertical',
  fieldClassName,
  className,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  maxLength,
  rows = 4,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? `textarea-${autoId}`
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [internal, setInternal] = useState(() => String(defaultValue ?? ''))
  const isControlled = value !== undefined
  const current = isControlled ? String(value ?? '') : internal
  const count = current.length

  const messageIds = getFieldMessageIds(fieldId, { hint, error })
  const describedBy = cx(ariaDescribedBy, ...messageIds) || undefined

  useLayoutEffect(() => {
    if (!autoGrow || !textareaRef.current) return
    const node = textareaRef.current
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [autoGrow, current])

  const countLabel =
    showCount && maxLength ? (
      <span className={styles.count} aria-hidden="true">
        {count} / {maxLength}
      </span>
    ) : undefined

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      labelAside={labelAside ?? countLabel}
      className={fieldClassName}
    >
      <div
        className={cx(
          styles.control,
          error && styles.invalid,
          disabled && styles.disabled,
          className,
        )}
        data-resize={resize}
        data-auto-grow={autoGrow ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-invalid={error ? 'true' : undefined}
      >
        <textarea
          {...rest}
          ref={textareaRef}
          id={fieldId}
          rows={autoGrow ? 1 : rows}
          value={isControlled ? value : internal}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            if (!isControlled) setInternal(event.target.value)
            onChange?.(event)
          }}
          className={styles.textarea}
        />
      </div>
    </Field>
  )
}
