import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { useControllableState } from '../../lib/useControllableState'
import styles from './Radio.module.css'

interface RadioGroupContextValue {
  name: string
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'size'> {
  value: string
  label?: ReactNode
  description?: ReactNode
  wrapperClassName?: string
}

export function Radio({
  value,
  label,
  description,
  disabled,
  className,
  wrapperClassName,
  id,
  name,
  onChange,
  checked,
  ...rest
}: RadioProps) {
  const group = useContext(RadioGroupContext)
  const autoId = useId()
  const fieldId = id ?? `radio-${autoId}`
  const descriptionId = description ? `${fieldId}-description` : undefined
  const isDisabled = disabled ?? group?.disabled ?? false
  const isChecked = group ? group.value === value : checked

  return (
    <label
      className={cx(styles.wrapper, wrapperClassName)}
      data-disabled={isDisabled ? 'true' : undefined}
    >
      <input
        {...rest}
        id={fieldId}
        type="radio"
        value={value}
        name={name ?? group?.name}
        checked={isChecked}
        disabled={isDisabled}
        aria-describedby={cx(rest['aria-describedby'], descriptionId) || undefined}
        onChange={(event) => {
          onChange?.(event)
          if (event.target.checked) group?.onChange(value)
        }}
        className={cx(styles.input, className)}
      />
      <span className={styles.circle} aria-hidden="true">
        <span className={styles.dot} />
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

export interface RadioGroupProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  optional?: boolean
  orientation?: 'vertical' | 'horizontal'
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  children: ReactNode
}

export function RadioGroup({
  label,
  hint,
  error,
  required,
  optional,
  orientation = 'vertical',
  name,
  value,
  defaultValue = '',
  onChange,
  disabled,
  className,
  children,
}: RadioGroupProps) {
  const autoName = useId()
  const groupName = name ?? `radio-group-${autoName}`
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const message = error ?? hint
  const messageId = message ? `${groupName}-message` : undefined
  /*
    `aria-required` is not supported by the `group` role that a fieldset maps
    to (ARIA 1.2 and the `aria-allowed-attr` check), so the required state is
    announced as a description instead.
  */
  const requiredId = required ? `${groupName}-required` : undefined
  const describedBy = [messageId, requiredId].filter(Boolean).join(' ') || undefined

  return (
    <RadioGroupContext.Provider
      value={{ name: groupName, value: current, onChange: setCurrent, disabled }}
    >
      <fieldset
        className={cx(styles.group, className)}
        data-orientation={orientation}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
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
            Campo obligatorio
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
    </RadioGroupContext.Provider>
  )
}
