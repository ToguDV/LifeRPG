import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { clamp } from '../../lib/format'
import styles from './ProgressBar.module.css'

export type ProgressVariant = 'accent' | 'xp' | 'success' | 'warning' | 'danger'

export interface ProgressBarBaseProps {
  value: number
  max?: number
  hint?: ReactNode
  showValue?: boolean
  variant?: ProgressVariant
  size?: 'sm' | 'md'
  valueText?: string
  className?: string
}

/**
 * A `progressbar` needs an accessible name. The union makes that a
 * compile-time requirement: either a visible `label` (which also names the
 * bar through `aria-labelledby`) or an explicit `aria-label`, never neither.
 * The percentage is the value text, so it cannot stand in for the name.
 */
export type ProgressBarProps = ProgressBarBaseProps &
  (
    | { label: ReactNode; 'aria-label'?: undefined }
    | { label?: undefined; 'aria-label': string }
  )

export function ProgressBar(props: ProgressBarProps) {
  const {
    value,
    max = 100,
    hint,
    showValue = true,
    variant = 'accent',
    size = 'sm',
    valueText,
    className,
  } = props
  const label = props.label
  const ariaLabel = props['aria-label']
  const id = useId()
  const safeMax = max <= 0 ? 1 : max
  const safeValue = clamp(value, 0, safeMax)
  const percent = (safeValue / safeMax) * 100

  return (
    <div className={cx(styles.wrapper, className)}>
      {label || showValue ? (
        <div className={styles.head}>
          {label ? (
            <span id={`${id}-label`} className={styles.label}>
              {label}
            </span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span className={styles.value}>
              {valueText ?? `${Math.round(percent)}%`}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cx(styles.track, styles[size])}
        role="progressbar"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={valueText ?? `${Math.round(percent)}%`}
      >
        <span
          className={cx(styles.fill, styles[variant])}
          style={{ width: `${percent}%` }}
        />
      </div>

      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}
