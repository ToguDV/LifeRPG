import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { formatTimeParts } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Button } from '../Button/Button'
import { Field, getFieldMessageIds } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import { Popover } from '../Popover/Popover'
import styles from './TimePicker.module.css'

interface TimeParts {
  hours: number
  minutes: number
}

function parseTime(value: string | null | undefined): TimeParts | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

const MINUTE_STEP_FALLBACK = 5

/**
 * Policy: round **down** to the previous step.
 * Rounding up is not a clock carry — at 09:58 with a 5 minute step it would
 * need to become 10:00, and the old clamp returned 09:00 instead. Rounding
 * down keeps the selected hour and always yields a valid minute.
 */
function roundToStep(minutes: number, step: number): number {
  return Math.floor(minutes / step) * step
}

/**
 * `minuteStep` is public API: `0` or a negative value never finishes the
 * minute loop, and more than an hour collapses the wheel to one option.
 * Normalise once, fall back to the default for invalid input.
 */
function normalizeMinuteStep(step: number): number {
  if (!Number.isFinite(step)) return MINUTE_STEP_FALLBACK
  const whole = Math.floor(step)
  if (whole < 1) return MINUTE_STEP_FALLBACK
  return Math.min(whole, 60)
}

interface TimeWheelProps {
  label: string
  options: number[]
  value: number
  onChange: (value: number) => void
  onSubmit?: () => void
  idPrefix: string
  autoFocus?: boolean
  format: (value: number) => string
}

function TimeWheel({
  label,
  options,
  value,
  onChange,
  onSubmit,
  idPrefix,
  autoFocus,
  format,
}: TimeWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef(0)
  const ignoreNextScrollSync = useRef(false)
  const selectedIndex = Math.max(0, options.indexOf(value))

  const getItemHeight = () => {
    const first = wheelRef.current?.querySelector<HTMLElement>('[role="option"]')
    return first?.offsetHeight ?? 1
  }

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'auto') => {
      const node = wheelRef.current
      if (!node) return
      node.scrollTo({ top: index * getItemHeight(), behavior })
    },
    [],
  )

  useLayoutEffect(() => {
    if (ignoreNextScrollSync.current) {
      ignoreNextScrollSync.current = false
      return
    }
    scrollToIndex(selectedIndex)
  }, [scrollToIndex, selectedIndex])

  useEffect(() => {
    if (!autoFocus) return
    const frame = requestAnimationFrame(() => wheelRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [autoFocus])

  useEffect(() => {
    return () => window.clearTimeout(scrollTimer.current)
  }, [])

  const handleScroll = () => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const node = wheelRef.current
      if (!node) return
      const index = Math.min(
        options.length - 1,
        Math.max(0, Math.round(node.scrollTop / getItemHeight())),
      )
      const next = options[index]
      if (next !== value) {
        ignoreNextScrollSync.current = true
        onChange(next)
      }
    }, 90)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = (delta: number) => {
      event.preventDefault()
      const index = Math.min(options.length - 1, Math.max(0, selectedIndex + delta))
      if (index !== selectedIndex) onChange(options[index])
    }

    switch (event.key) {
      case 'ArrowUp':
        move(-1)
        break
      case 'ArrowDown':
        move(1)
        break
      case 'PageUp':
        move(-5)
        break
      case 'PageDown':
        move(5)
        break
      case 'Home':
        event.preventDefault()
        if (options.length) onChange(options[0])
        break
      case 'End':
        event.preventDefault()
        if (options.length) onChange(options[options.length - 1])
        break
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault()
        onSubmit?.()
        break
      default:
        break
    }
  }

  return (
    <div className={styles.wheelBlock}>
      <span className={styles.wheelLabel}>{label}</span>
      <div className={styles.wheelFrame}>
        <div
          ref={wheelRef}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${idPrefix}-option-${selectedIndex}`}
          tabIndex={0}
          className={styles.wheel}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            // The wheel owns the focus and the keyboard: options follow the
            // aria-activedescendant pattern and are not tabbable themselves.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
            <div
              key={option}
              id={`${idPrefix}-option-${index}`}
              role="option"
              aria-selected={option === value}
              data-selected={option === value ? 'true' : undefined}
              className={styles.option}
              onClick={() => {
                if (option !== value) onChange(option)
              }}
            >
              {format(option)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface TimePickerProps {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  minuteStep?: number
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  clearable?: boolean
  name?: string
  id?: string
  className?: string
  fieldClassName?: string
}

export function TimePicker({
  value,
  defaultValue = null,
  onChange,
  minuteStep = 5,
  label,
  hint,
  error,
  optional,
  labelAside,
  placeholder = 'Pick a time',
  size = 'md',
  disabled,
  required,
  clearable = false,
  name,
  id,
  className,
  fieldClassName,
}: TimePickerProps) {
  const autoId = useId()
  const fieldId = id ?? `time-picker-${autoId}`
  const dialogId = `${fieldId}-dialog`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const step = normalizeMinuteStep(minuteStep)

  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange,
  })
  const currentParts = useMemo(() => parseTime(current), [current])
  const now = new Date()
  const fallback = {
    hours: now.getHours(),
    minutes: roundToStep(now.getMinutes(), step),
  }
  /* One draft for both wheels: the minutes used to live in a second state. */
  const [draft, setDraft] = useState<TimeParts>(currentParts ?? fallback)

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, index) => index), [])
  const minuteOptions = useMemo(() => {
    const values = new Set<number>()
    for (let minute = 0; minute < 60; minute += step) values.add(minute)
    if (currentParts) values.add(currentParts.minutes)
    return [...values].sort((a, b) => a - b)
  }, [currentParts, step])

  /*
    `aria-required` is not allowed on `role="button"` (ARIA 1.2 and the
    `aria-allowed-attr` check), so the required state is announced as a
    description. The hidden input cannot take part in native validation
    either: consumers validate on submit.
  */
  const requiredId = required ? `${fieldId}-required` : undefined
  const describedBy = cx(...getFieldMessageIds(fieldId, { hint, error }), requiredId) || undefined

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const openPicker = () => {
    if (disabled) return
    setDraft(currentParts ?? fallback)
    setOpen(true)
  }

  const apply = () => {
    setCurrent(formatTimeParts(draft.hours, draft.minutes))
    close(true)
  }

  const setNow = () => {
    setCurrent(formatTimeParts(fallback.hours, fallback.minutes))
    close(true)
  }

  const clear = () => {
    setCurrent(null)
    close(true)
  }

  const displayValue = currentParts
    ? formatTimeParts(currentParts.hours, currentParts.minutes)
    : placeholder

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
      {/*
        ARIA 1.2 dropped `aria-invalid` from the button role table, but it is
        still the only way to expose the error state on this trigger.
      */}
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        className={cx(
          styles.trigger,
          styles[size],
          open && styles.open,
          error && styles.invalid,
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close(true) : openPicker())}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name="clock" size="sm" />
        </span>
        <span className={cx(styles.value, !currentParts && styles.placeholder)}>
          {displayValue}
        </span>
        <Icon name="chevron-down" size="sm" className={styles.chevron} />
      </button>

      {requiredId ? (
        <span id={requiredId} className="visually-hidden">
          Required
        </span>
      ) : null}

      {name ? (
        <input
          type="hidden"
          name={name}
          value={currentParts ? formatTimeParts(currentParts.hours, currentParts.minutes) : ''}
        />
      ) : null}

      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        id={dialogId}
        role="dialog"
        ariaLabel="Pick a time"
        className={styles.picker}
      >
        <div className={styles.header}>
          <p className={styles.title}>Time of day</p>
          <p className={styles.subtitle}>The bells do not wait.</p>
        </div>

        <div className={styles.columns}>
          <TimeWheel
            label="Hour"
            options={hourOptions}
            value={draft.hours}
            onChange={(hours) => setDraft((previous) => ({ ...previous, hours }))}
            onSubmit={apply}
            idPrefix={`${fieldId}-hour`}
            autoFocus
            format={(hour) => String(hour).padStart(2, '0')}
          />
          <TimeWheel
            label="Minute"
            options={minuteOptions}
            value={draft.minutes}
            onChange={(minutes) => setDraft((previous) => ({ ...previous, minutes }))}
            onSubmit={apply}
            idPrefix={`${fieldId}-minute`}
            format={(minute) => String(minute).padStart(2, '0')}
          />
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={setNow}>
            Now
          </Button>
          <div className={styles.footerActions}>
            {clearable ? (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </Popover>
    </Field>
  )
}
