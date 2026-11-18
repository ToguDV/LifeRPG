import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  icon?: ReactNode | IconName
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

function isIconName(value: ReactNode | IconName): value is IconName {
  return typeof value === 'string'
}

export function EmptyState({ icon = 'scroll', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      <span className={styles.icon} aria-hidden="true">
        {isIconName(icon) ? <Icon name={icon} size="xl" /> : icon}
      </span>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
