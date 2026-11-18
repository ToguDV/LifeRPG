import {
  useId,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { clamp } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Field, getFieldMessageId } from '../Field/Field'
import styles from './Slider.module.css'

export interface SliderMark {
  value: number
  label?: string
}

interface SliderBaseProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  min?: number
  max?: number
  step?: number
  marks?: SliderMark[]
  disabled?: boolean
  showValue?: boolean
  formatValue?: (value: number) => string
  name?: string
  id?: string
  className?: string
  fieldClassName?: string
}

export interface SliderProps extends SliderBaseProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
}

export interface RangeSliderProps extends SliderBaseProps {
  value?: [number, number]
  defaultValue?: [number, number]
  onChange?: (value: [number, number]) => void
}

function percentOf(value: number, min: number, max: number): number {
  if (max === min) return 0
  return ((value - min) / (max - min)) * 100
}

interface RailProps {
  min: number
  max: number
  start: number
  end: number
  marks?: SliderMark[]
  formatValue?: (value: number) => string
  showBubbles?: boolean
  inputStart: ReactNode
  inputEnd?: ReactNode
}

function SliderRail({
  min,
  max,
  start,
  end,
  marks,
  formatValue = String,
  showBubbles = true,
  inputStart,
  inputEnd,
}: RailProps) {
  const startPct = clamp(percentOf(start, min, max), 0, 100)
  const endPct = clamp(percentOf(end, min, max), 0, 100)

  return (
    <div className={styles.wrapper}>
      <div className={styles.railArea}>
        <div className={styles.rail} aria-hidden="true" />
        <div
          className={styles.fill}
          style={
            {
              '--start': `${startPct}%`,
              '--end': `${endPct}%`,
            } as CSSProperties
          }
          aria-hidden="true"
        />
        {showBubbles ? (
          <>
            <span
              className={styles.bubble}
              style={{ '--percent': `${startPct}%` } as CSSProperties}
              aria-hidden="true"
            >
              {formatValue(start)}
            </span>
            {inputEnd ? (
              <span
                className={cx(styles.bubble, styles.bubbleEnd)}
                style={{ '--percent': `${endPct}%` } as CSSProperties}
                aria-hidden="true"
              >
                {formatValue(end)}
              </span>
            ) : null}
          </>
        ) : null}
        {inputStart}
        {inputEnd}
      </div>

      {marks?.length ? (
        <div className={styles.marks} aria-hidden="true">
          {marks.map((mark) => {
            const markPercent = clamp(percentOf(mark.value, min, max), 0, 100)
            const edge =
              markPercent <= 0.01 ? 'start' : markPercent >= 99.99 ? 'end' : undefined
            return (
              <span
                key={mark.value}
                className={styles.mark}
                data-edge={edge}
                style={
                  {
                    '--percent': `${markPercent}%`,
                  } as CSSProperties
                }
              >
                <i className={styles.tick} />
                {mark.label ? <span className={styles.markLabel}>{mark.label}</span> : null}
              </span>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function Slider({
  value,
  defaultValue = 50,
  onChange,
  label,
  hint,
  error,
  optional,
  labelAside,
  min = 0,
  max = 100,
  step = 1,
  marks,
  disabled,
  showValue = true,
  formatValue = String,
  name,
  id,
  className,
  fieldClassName,
}: SliderProps) {
  const autoId = useId()
  const fieldId = id ?? `slider-${autoId}`
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const safeValue = clamp(current, min, max)
  const messageId = error
    ? getFieldMessageId(fieldId, 'error')
    : hint
      ? getFieldMessageId(fieldId, 'hint')
      : undefined
  const valueLabel = formatValue(safeValue)

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={false}
      optional={optional}
      labelAside={
        labelAside ?? (showValue ? <span className={styles.value}>{valueLabel}</span> : undefined)
      }
      className={fieldClassName}
    >
      <SliderRail
        min={min}
        max={max}
        start={min}
        end={safeValue}
        marks={marks}
        formatValue={formatValue}
        showBubbles
        inputStart={
          <input
            id={fieldId}
            name={name}
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            aria-valuetext={valueLabel}
            onChange={(event) => setCurrent(event.target.valueAsNumber)}
            className={cx(styles.input, className)}
          />
        }
      />
    </Field>
  )
}

export function RangeSlider({
  value,
  defaultValue = [25, 75],
  onChange,
  label,
  hint,
  error,
  optional,
  labelAside,
  min = 0,
  max = 100,
  step = 1,
  marks,
  disabled,
  showValue = true,
  formatValue = String,
  name,
  id,
  className,
  fieldClassName,
}: RangeSliderProps) {
  const autoId = useId()
  const fieldId = id ?? `range-slider-${autoId}`
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })

  const low = clamp(Math.min(current[0], current[1]), min, max)
  const high = clamp(Math.max(current[0], current[1]), min, max)
  const lowLabel = formatValue(low)
  const highLabel = formatValue(high)

  const messageId = error
    ? getFieldMessageId(fieldId, 'error')
    : hint
      ? getFieldMessageId(fieldId, 'hint')
      : undefined

  const updateLow = (next: number) => {
    setCurrent([clamp(Math.min(next, high), min, max), high])
  }

  const updateHigh = (next: number) => {
    setCurrent([low, clamp(Math.max(next, low), min, max)])
  }

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={false}
      optional={optional}
      labelAside={
        labelAside ?? (
          showValue ? (
            <span className={styles.value}>
              {lowLabel} — {highLabel}
            </span>
          ) : undefined
        )
      }
      className={fieldClassName}
    >
      <SliderRail
        min={min}
        max={max}
        start={low}
        end={high}
        marks={marks}
        formatValue={formatValue}
        showBubbles
        inputStart={
          <input
            id={fieldId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={low}
            disabled={disabled}
            aria-label="Valor mínimo"
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            aria-valuetext={lowLabel}
            onChange={(event) => updateLow(event.target.valueAsNumber)}
            className={cx(styles.input, styles.rangeInput, className)}
            style={{ zIndex: low >= high ? 3 : 2 }}
          />
        }
        inputEnd={
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={high}
            disabled={disabled}
            aria-label="Valor máximo"
            aria-describedby={messageId}
            aria-valuetext={highLabel}
            onChange={(event) => updateHigh(event.target.valueAsNumber)}
            className={cx(styles.input, styles.rangeInput, className)}
            style={{ zIndex: 2 }}
          />
        }
      />
      {name ? (
        <>
          <input type="hidden" name={`${name}-min`} value={low} />
          <input type="hidden" name={`${name}-max`} value={high} />
        </>
      ) : null}
    </Field>
  )
}
