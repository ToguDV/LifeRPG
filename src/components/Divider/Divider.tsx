import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Divider.module.css'

export interface DividerProps {
  variant?: 'line' | 'ornament'
  label?: ReactNode
  className?: string
}

export function Divider({ variant = 'ornament', label, className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={typeof label === 'string' ? label : undefined}
      className={cx(styles.divider, styles[variant], className)}
    >
      {variant === 'ornament' ? <span className={styles.line} aria-hidden="true" /> : null}
      {variant === 'ornament' ? <span className={styles.diamond} aria-hidden="true" /> : null}
      {label ? <span className={styles.label}>{label}</span> : null}
      {variant === 'ornament' ? <span className={styles.diamond} aria-hidden="true" /> : null}
      {variant === 'ornament' ? <span className={styles.line} aria-hidden="true" /> : null}
    </div>
  )
}
