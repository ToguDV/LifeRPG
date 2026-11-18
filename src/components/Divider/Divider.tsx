import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Divider.module.css'

export interface DividerProps {
  variant?: 'line' | 'ornament'
  label?: ReactNode
  className?: string
}

/*
  The separator is named from the rendered label node, not from the prop: a
  `ReactNode` label may carry text and markup, and only the DOM knows the
  text. A decorative label (an icon with no copy) contributes no text, so the
  separator stays unnamed instead of inventing a name.
*/
export function Divider({ variant = 'ornament', label, className }: DividerProps) {
  const autoId = useId()
  const labelId = label ? `divider-${autoId}-label` : undefined

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-labelledby={labelId}
      className={cx(styles.divider, styles[variant], className)}
    >
      {variant === 'ornament' ? <span className={styles.line} aria-hidden="true" /> : null}
      {variant === 'ornament' ? <span className={styles.diamond} aria-hidden="true" /> : null}
      {label ? (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      ) : null}
      {variant === 'ornament' ? <span className={styles.diamond} aria-hidden="true" /> : null}
      {variant === 'ornament' ? <span className={styles.line} aria-hidden="true" /> : null}
    </div>
  )
}
