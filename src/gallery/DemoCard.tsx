import type { ReactNode } from 'react'
import { Badge } from '../components/Badge/Badge'
import { WaxSeal } from '../components/Ornaments/WaxSeal'
import { Surface, type SurfaceProps } from '../components/Surface/Surface'
import { cx } from '../lib/cx'
import styles from './DemoCard.module.css'

export interface DemoCardProps {
  canvas: SurfaceProps['surface']
  component: string
  title: string
  description?: ReactNode
  folio: string
  tilt?: SurfaceProps['tilt']
  children: ReactNode
  className?: string
}

/**
 * The sheet that holds a demo. Same paper ornaments as `Card`: two
 * torn sheets underneath, a notebook gutter and the folio pressed into
 * a wax seal.
 */
export function DemoCard({
  canvas,
  component,
  title,
  description,
  folio,
  tilt = 'none',
  children,
  className,
}: DemoCardProps) {
  const paper = canvas === 'paper'

  return (
    <Surface
      surface={canvas}
      padding="lg"
      torn={paper}
      tilt={paper ? tilt : 'none'}
      stack={paper ? 'double' : 'none'}
      margin={paper ? 'rule' : 'none'}
      stains={paper}
      className={cx(styles.card, className)}
    >
      {/* `<div>`, not `<header>`: the demo sheet must not emit a landmark. */}
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <Badge variant="outline" size="sm" className={styles.componentBadge}>
            {component}
          </Badge>
          <h3 className={styles.title}>{title}</h3>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        <WaxSeal folio={folio} label={`Folio ${folio}`} />
      </div>
      <div className={styles.rule} aria-hidden="true" />
      <div className={styles.body}>{children}</div>
    </Surface>
  )
}
