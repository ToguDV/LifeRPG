import { useId } from 'react'
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

/* Pressed by hand: lumpy outline, one lobe squeezed out, never a circle. */
const WAX =
  'M60.21 32.00C60.28 36.79 57.43 40.77 54.80 45.16C52.16 49.56 50.02 53.63 45.84 55.97C41.66 58.31 37.09 57.90 32.00 57.92C26.91 57.94 22.32 58.40 18.10 56.08C13.87 53.77 11.44 49.71 8.97 45.30C6.49 40.88 4.47 36.80 4.60 32.00C4.72 27.20 7.17 23.48 9.67 19.11C12.17 14.73 14.14 10.59 18.23 8.15C22.32 5.71 26.99 5.75 32.00 5.81C37.01 5.87 41.45 6.07 45.57 8.50C49.68 10.93 51.76 14.73 54.45 19.04C57.13 23.35 60.15 27.21 60.21 32.00Z'
/* The wax that squirts out under the matrix. */
const SPILL =
  'M58.41 39.00C57.19 44.21 55.13 49.15 51.18 52.61C47.23 56.08 42.26 56.74 36.86 57.92C31.46 59.10 26.64 60.61 21.74 59.05C16.83 57.48 13.74 53.44 10.11 49.38C6.48 45.32 3.53 42.06 1.93 36.92C0.33 31.78 -0.35 26.36 1.39 21.36C3.13 16.37 7.27 13.35 11.42 9.69C15.57 6.04 18.95 2.64 24.02 1.45C29.08 0.25 33.79 1.58 39.03 3.16C44.27 4.73 49.15 6.16 52.60 10.02C56.05 13.88 56.77 18.89 57.83 24.21C58.90 29.52 59.63 33.79 58.41 39.00Z'
/* The ring left by the matrix. */
const RING =
  'M48.50 32.40C48.37 35.25 46.85 37.35 45.39 39.96C43.93 42.57 42.94 45.33 40.53 46.66C38.13 48.00 35.27 47.34 32.30 47.25C29.33 47.16 26.99 47.38 24.34 46.20C21.68 45.01 19.11 43.30 17.80 40.77C16.49 38.24 17.09 35.42 17.18 32.40C17.27 29.38 16.86 26.66 18.27 24.30C19.68 21.94 22.30 21.07 24.87 19.54C27.45 18.01 29.53 16.02 32.30 15.93C35.07 15.84 37.47 17.51 39.99 19.07C42.52 20.63 44.54 21.99 46.10 24.43C47.66 26.88 48.63 29.55 48.50 32.40Z'

/**
 * A pressed wax seal used to close a folio. Portrayed with the ribbon
 * (primary) tokens so it reads as the one loud mark on the sheet.
 */
export function WaxSeal({ folio, label, size = 'md', className }: WaxSealProps) {
  const gradientId = `wax-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <span
      className={cx(styles.seal, styles[size], className)}
      role="img"
      aria-label={label ?? `Folio ${folio}`}
    >
      <svg className={styles.wax} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={gradientId} cx="38%" cy="26%" r="88%">
            <stop offset="0" stopColor="var(--ui-primary-bg-hi)" />
            <stop offset="0.56" stopColor="var(--ui-primary-bg)" />
            <stop offset="1" stopColor="var(--ui-primary-bg-lo)" />
          </radialGradient>
        </defs>
        <path d={SPILL} fill="var(--ui-primary-bg-lo)" opacity="0.92" />
        <path d={WAX} fill={`url(#${gradientId})`} />
        <path
          d={RING}
          fill="none"
          stroke="var(--ui-primary-bg-lo)"
          strokeOpacity="0.5"
          strokeWidth="1.1"
        />
        <path
          d={WAX}
          fill="none"
          stroke="var(--ui-primary-edge)"
          strokeOpacity="0.34"
          strokeWidth="1.2"
        />
      </svg>
      <span className={styles.engraving} aria-hidden="true">
        {folio}
      </span>
    </span>
  )
}
