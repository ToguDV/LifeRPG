import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { clamp } from '../../lib/format'
import styles from './ProgressBar.module.css'

export type ProgressVariant = 'accent' | 'xp' | 'success' | 'warning' | 'danger'

export interface ProgressBarProps {
  value: number
  max?: number
  label?: ReactNode
  hint?: ReactNode
  showValue?: boolean
  variant?: ProgressVariant
  size?: 'sm' | 'md'
  valueText?: string
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  hint,
  showValue = true,
  variant = 'accent',
  size = 'sm',
  valueText,
  className,
}: ProgressBarProps) {
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
