import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import {
  addDays,
  addMonthsClamped,
  addYearsClamped,
  dateKey,
  endOfWeekSunday,
  getCalendarDays,
  isSameMonth,
  startOfMonth,
  startOfWeekMonday,
} from '../../lib/date'
import { formatDate, formatMonth, isSameDay, startOfDay } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Button } from '../Button/Button'
import { Field, getFieldMessageIds } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import { Popover } from '../Popover/Popover'
import styles from './DatePicker.module.css'

const WEEKDAYS = [
  { short: 'M', long: 'Monday' },
  { short: 'T', long: 'Tuesday' },
  { short: 'W', long: 'Wednesday' },
  { short: 'T', long: 'Thursday' },
  { short: 'F', long: 'Friday' },
  { short: 'S', long: 'Saturday' },
  { short: 'S', long: 'Sunday' },
] as const

/*
  The grid prints the day as a plain number ("1"), so the accessible name
  must not pad it ("01 November 2026" does not contain "1" under
  WCAG 2.5.3). `formatDate` keeps the two-digit day for prose and the trigger.
*/
const dayNameFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export interface DatePickerProps {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date | null) => void
  min?: Date
  max?: Date
  isDateDisabled?: (date: Date) => boolean
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  className?: string
  fieldClassName?: string
}

export function DatePicker({
  value,
  defaultValue = null,
  onChange,
  min,
  max,
  isDateDisabled,
  label,
  hint,
  error,
  optional,
  labelAside,
  placeholder = 'Pick a date',
  size = 'md',
  disabled,
  required,
  name,
  id,
  className,
  fieldClassName,
}: DatePickerProps) {
  const autoId = useId()
  const fieldId = id ?? `date-picker-${autoId}`
  const dialogId = `${fieldId}-dialog`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const shouldFocusDay = useRef(false)
  const today = startOfDay(new Date())

  const [current, setCurrent] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange,
  })
  const currentDate = current ? startOfDay(current) : null

  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => startOfMonth(currentDate ?? today))
  const [focusedDate, setFocusedDate] = useState(() => currentDate ?? today)

  /*
    `aria-required` is not allowed on `role="button"` (ARIA 1.2 and the
    `aria-allowed-attr` check), so the required state is announced as a
    description. The hidden input cannot take part in native validation
    either: consumers validate on submit.
  */
  const requiredId = required ? `${fieldId}-required` : undefined
  const describedBy = cx(...getFieldMessageIds(fieldId, { hint, error }), requiredId) || undefined

  const isDisabledDate = (date: Date) => {
    const day = startOfDay(date)
    if (min && day < startOfDay(min)) return true
    if (max && day > startOfDay(max)) return true
    return isDateDisabled?.(day) ?? false
  }

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const openCalendar = () => {
    if (disabled) return
    const base = currentDate ?? today
    setFocusedDate(base)
    setViewDate(startOfMonth(base))
    setOpen(true)
    shouldFocusDay.current = true
  }

  useEffect(() => {
    if (!open || !shouldFocusDay.current) return
    const frame = requestAnimationFrame(() => {
      const node = dayRefs.current[dateKey(focusedDate)]
      if (node) {
        node.focus()
        shouldFocusDay.current = false
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [focusedDate, open, viewDate])

  const selectDate = (date: Date) => {
    if (isDisabledDate(date)) return
    setCurrent(startOfDay(date))
    close(true)
  }

  const moveFocus = (deltaDays: number) => {
    const next = addDays(focusedDate, deltaDays)
    setFocusedDate(next)
    if (!isSameMonth(next, viewDate)) setViewDate(startOfMonth(next))
    shouldFocusDay.current = true
  }

  const changeMonth = (delta: number) => {
    const next = addMonthsClamped(focusedDate, delta)
    setFocusedDate(next)
    setViewDate(startOfMonth(next))
  }

  const changeYear = (delta: number) => {
    const next = addYearsClamped(focusedDate, delta)
    setFocusedDate(next)
    setViewDate(startOfMonth(next))
  }

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus(-1)
        break
      case 'ArrowRight':
        event.preventDefault()
        moveFocus(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(-7)
        break
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(7)
        break
      case 'Home':
        event.preventDefault()
        setFocusedDate(startOfWeekMonday(date))
        shouldFocusDay.current = true
        break
      case 'End':
        event.preventDefault()
        setFocusedDate(endOfWeekSunday(date))
        shouldFocusDay.current = true
        break
      case 'PageUp':
        event.preventDefault()
        if (event.shiftKey) changeYear(-1)
        else changeMonth(-1)
        shouldFocusDay.current = true
        break
      case 'PageDown':
        event.preventDefault()
        if (event.shiftKey) changeYear(1)
        else changeMonth(1)
        shouldFocusDay.current = true
        break
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault()
        selectDate(date)
        break
      default:
        break
    }
  }

  const days = getCalendarDays(viewDate)
  const rows = Array.from({ length: 6 }, (_, row) => days.slice(row * 7, row * 7 + 7))
  const displayValue = currentDate ? formatDate(currentDate) : placeholder

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
        onClick={() => (open ? close(true) : openCalendar())}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name="calendar" size="sm" />
        </span>
        <span className={cx(styles.value, !currentDate && styles.placeholder)}>
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
        <input type="hidden" name={name} value={currentDate ? dateKey(currentDate) : ''} />
      ) : null}

      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        id={dialogId}
        role="dialog"
        ariaLabel="Pick a date"
        className={styles.calendar}
      >
        <div className={styles.header}>
          <div className={styles.navGroup}>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Previous year"
              onClick={() => changeYear(-1)}
            >
              <Icon name="chevrons-left" size="xs" />
            </button>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <Icon name="chevron-left" size="xs" />
            </button>
          </div>
          <p className={styles.title} aria-live="polite">
            {formatMonth(viewDate)}
          </p>
          <div className={styles.navGroup}>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <Icon name="chevron-right" size="xs" />
            </button>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Next year"
              onClick={() => changeYear(1)}
            >
              <Icon name="chevrons-right" size="xs" />
            </button>
          </div>
        </div>

        <div role="grid" className={styles.grid} aria-label={formatMonth(viewDate)}>
          <div role="row" className={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <span key={day.long} role="columnheader" aria-label={day.long}>
                {day.short}
              </span>
            ))}
          </div>
          {rows.map((row, rowIndex) => (
            <div role="row" className={styles.row} key={`week-${rowIndex}`}>
              {row.map((date) => {
                const disabledDate = isDisabledDate(date)
                const selected = Boolean(currentDate && isSameDay(date, currentDate))
                const isToday = isSameDay(date, today)
                const outside = !isSameMonth(date, viewDate)
                const focused = isSameDay(date, focusedDate)

                return (
                  <div
                    role="gridcell"
                    key={dateKey(date)}
                    className={styles.cell}
                    aria-selected={selected}
                  >
                    <button
                      ref={(node) => {
                        dayRefs.current[dateKey(date)] = node
                      }}
                      type="button"
                      className={styles.day}
                      data-selected={selected ? 'true' : undefined}
                      data-today={isToday ? 'true' : undefined}
                      data-outside={outside ? 'true' : undefined}
                      data-disabled={disabledDate ? 'true' : undefined}
                      tabIndex={focused ? 0 : -1}
                      aria-label={dayNameFormatter.format(date)}
                      aria-disabled={disabledDate || undefined}
                      onClick={() => selectDate(date)}
                      onFocus={() => {
                        if (!isSameDay(date, focusedDate)) setFocusedDate(date)
                      }}
                      onKeyDown={(event) => handleDayKeyDown(event, date)}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDisabledDate(today)}
            onClick={() => selectDate(today)}
          >
            Today
          </Button>
          <Button variant="ghost" size="sm" disabled={!currentDate} onClick={() => {
            setCurrent(null)
            close(true)
          }}>
            Clear
          </Button>
        </div>
      </Popover>
    </Field>
  )
}
