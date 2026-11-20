import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { SurfaceContext, type SurfaceValue } from './surface-context'
import styles from './Surface.module.css'

/** Sheets of paper peeking out under the card. */
export type PaperStack = 'none' | 'single' | 'double'
/** Ruled frame drawn inside the torn paper edge. */
export type PaperMargin = 'none' | 'rule'

/**
 * Physical cues that turn the parchment surface into a sheet of paper.
 * They only apply to `surface="paper"`; the dark panel has its own material.
 */
export interface PaperOrnamentProps {
  stack?: PaperStack
  margin?: PaperMargin
  stains?: boolean
}

export interface SurfaceProps extends HTMLAttributes<HTMLElement>, PaperOrnamentProps {
  surface?: SurfaceValue
  variant?: 'base' | 'raised' | 'sunken'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  torn?: boolean
  tilt?: 'none' | 'left' | 'right'
  as?: ElementType
  children?: ReactNode
}

/**
 * The two materials of the journal: a torn sheet of parchment or a
 * riveted dark panel. Sets `data-surface` so every nested control
 * re-binds its text, border and accent tokens to the right material.
 *
 * Paper ornaments are decorative layers (`aria-hidden`), painted behind
 * the content and never over the text column.
 */
export function Surface({
  surface = 'paper',
  variant = 'base',
  padding = 'md',
  torn = true,
  tilt = 'none',
  stack = 'none',
  margin = 'none',
  stains = false,
  as,
  className,
  children,
  ...rest
}: SurfaceProps) {
  const Tag = (as ?? 'div') as ElementType
  const paper = surface === 'paper'

  return (
    <SurfaceContext.Provider value={surface}>
      <Tag
        {...rest}
        data-surface={surface}
        data-variant={variant}
        data-torn={torn ? 'true' : 'false'}
        className={cx(
          styles.surface,
          styles[surface],
          styles[variant],
          styles[`pad-${padding}`],
          paper && stack !== 'none' && styles[`stack-${stack}`],
          paper && margin === 'rule' && styles.ruleFrame,
          tilt !== 'none' && styles[`tilt-${tilt}`],
          className,
        )}
      >
        {paper && stack !== 'none' ? (
          <span className={styles.sheets} aria-hidden="true" />
        ) : null}
        {/* The torn silhouette comes from `[data-torn]` on the sheet, not a class. */}
        <span className={styles.texture} aria-hidden="true" />
        {paper && stains ? <span className={styles.stains} aria-hidden="true" /> : null}
        <div className={styles.content}>{children}</div>
      </Tag>
    </SurfaceContext.Provider>
  )
}
