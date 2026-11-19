import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import type { GallerySectionMeta } from './sections'
import styles from './Demo.module.css'

export function DemoGrid({
  children,
  className,
  columns = 2,
}: {
  children: ReactNode
  className?: string
  columns?: 2 | 3
}) {
  return (
    <div className={cx(styles.grid, columns === 3 ? styles.cols3 : styles.cols2, className)}>
      {children}
    </div>
  )
}

export function DemoGroup({
  label,
  hint,
  span = false,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  span?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx(styles.group, span && styles.span, className)}>
      <p className={styles.groupLabel}>{label}</p>
      {hint ? <p className={styles.groupHint}>{hint}</p> : null}
      <div className={styles.groupBody}>{children}</div>
    </section>
  )
}

export function DemoRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx(styles.row, className)}>{children}</div>
}

export function DemoStack({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx(styles.stack, className)}>{children}</div>
}

export function DemoNote({
  children,
  live = false,
  className,
}: {
  children: ReactNode
  live?: boolean
  className?: string
}) {
  return (
    <p className={cx(styles.note, className)} aria-live={live ? 'polite' : undefined}>
      {children}
    </p>
  )
}

export function SectionHeading({ meta }: { meta: GallerySectionMeta }) {
  return (
    <header className={styles.sectionHead}>
      <h2 className={styles.sectionLabel}>
        <span className={styles.sectionNum}>{meta.number}</span>
        <span>{meta.title}</span>
        <span className={styles.sectionLine} aria-hidden="true" />
      </h2>
      <div className={styles.sectionMeta}>
        <p className={styles.sectionNote}>{meta.note}</p>
        <p className={styles.sectionComponents}>{meta.components.join(' · ')}</p>
      </div>
    </header>
  )
}
