import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Badge.module.css'

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  dot?: boolean
  children: ReactNode
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  icon,
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cx(styles.badge, styles[variant], styles[size], className)}
    >
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </span>
  )
}
