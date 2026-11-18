import { cx } from '../../lib/cx'
import styles from './WaxSeal.module.css'

export interface WaxSealProps {
  /** Folio or section number pressed into the wax, e.g. "03". */
  folio: string
  /** Accessible name. The wax disc itself is decorative. */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * A pressed wax seal used to close a folio. Portrayed with the ribbon
 * (primary) tokens so it reads as the one loud mark on the sheet.
 */
export function WaxSeal({ folio, label, size = 'md', className }: WaxSealProps) {
  return (
    <span
      className={cx(styles.seal, styles[size], className)}
      role="img"
      aria-label={label ?? `Folio ${folio}`}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.engraving} aria-hidden="true">
        {folio}
      </span>
    </span>
  )
}
