import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Icon } from '../Icon/Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  iconOnly?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  iconOnly = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.iconOnly,
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Icon name="loader" size="sm" className={styles.spinner} />
      ) : iconLeft ? (
        <span className={styles.icon} aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}
      {children ? <span className={styles.label}>{children}</span> : null}
      {iconRight && !loading ? (
        <span className={styles.icon} aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  )
}
