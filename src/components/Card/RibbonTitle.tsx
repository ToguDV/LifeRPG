import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './RibbonTitle.module.css'

export interface RibbonTitleProps {
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

/**
 * The title of a paper card, set in the wax ribbon that hangs over the
 * torn top edge. The tails are decorative (`aria-hidden`); the heading
 * underneath stays a real `<h3>` so the card keeps its name.
 *
 * The ribbon rises using the `Surface` padding variable, so it straddles
 * the top edge at every card size without hard-coding that padding.
 */
export function RibbonTitle({ size = 'md', children }: RibbonTitleProps) {
  return (
    <div className={cx(styles.ribbon, styles[size])}>
      <span className={styles.tail} data-side="left" aria-hidden="true" />
      <span className={styles.tail} data-side="right" aria-hidden="true" />
      <h3 className={styles.title}>{children}</h3>
    </div>
  )
}
