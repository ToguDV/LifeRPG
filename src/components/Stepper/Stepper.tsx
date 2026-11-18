import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { clamp } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Field, getFieldMessageIds } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import styles from './Stepper.module.css'

export interface StepperProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  suffix?: ReactNode
  size?: 'sm' | 'md'
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  fieldClassName?: string
}

export function Stepper({
  value,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  hint,
  error,
  optional,
  labelAside,
  suffix,
  size = 'md',
  disabled,
  name,
  id,
  className,
  fieldClassName,
}: StepperProps) {
  const autoId = useId()
  const fieldId = id ?? `stepper-${autoId}`
  const [raw, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const current = clamp(raw, min, max)
  const canDecrease = !disabled && current > min
  const canIncrease = !disabled && current < max

  const messageId = getFieldMessageIds(fieldId, { hint, error }).join(' ') || undefined

  const setValue = (next: number) => setCurrent(clamp(next, min, max))
  const decrement = () => setValue(current - step)
  const increment = () => setValue(current + step)

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={false}
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
      >
        <button
          type="button"
          className={cx(styles.button, styles.decrease)}
          aria-label="Disminuir"
          disabled={!canDecrease}
          onClick={decrement}
        >
          <Icon name="minus" size="sm" />
        </button>
        <input
          id={fieldId}
          type="number"
          inputMode="numeric"
          name={name}
          value={current}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            if (Number.isNaN(next)) return
            setValue(next)
          }}
          className={styles.input}
        />
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
        <button
          type="button"
          className={cx(styles.button, styles.increase)}
          aria-label="Aumentar"
          disabled={!canIncrease}
          onClick={increment}
        >
          <Icon name="plus" size="sm" />
        </button>
      </div>
    </Field>
  )
}
