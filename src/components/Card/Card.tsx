import type { ElementType, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Surface, type PaperOrnamentProps, type SurfaceProps } from '../Surface/Surface'
import { WaxSeal } from '../Ornaments/WaxSeal'
import styles from './Card.module.css'

export type CardSize = 'sm' | 'md' | 'lg'

export interface CardProps extends PaperOrnamentProps {
  /** Container width and type scale: a filing card, a sheet, a full page. */
  size?: CardSize
  surface?: SurfaceProps['surface']
  /** Small engraved line above the title. */
  kicker?: ReactNode
  title?: ReactNode
  description?: ReactNode
  /** Pressed into the wax seal in the header. */
  folio?: string
  /** Handwritten note under the body. */
  footer?: ReactNode
  as?: ElementType
  children?: ReactNode
  className?: string
}

/**
 * A paper container: the sheet that holds a list, a form or a whole
 * section. Three sizes change the width ceiling, the padding and the
 * title scale; the paper ornaments are the same `Surface` props.
 */
export function Card({
  size = 'md',
  surface = 'paper',
  kicker,
  title,
  description,
  folio,
  footer,
  as,
  children,
  className,
  stack = 'double',
  margin = 'rule',
  dogEar = false,
  tape = false,
  stains = true,
}: CardProps) {
  const paper = surface === 'paper'

  return (
    <Surface
      as={as}
      surface={surface}
      padding={size === 'sm' ? 'md' : 'lg'}
      torn={paper}
      stack={paper ? stack : 'none'}
      margin={paper ? margin : 'none'}
      dogEar={paper && dogEar}
      tape={paper && tape}
      stains={paper && stains}
      className={cx(styles.card, styles[`size-${size}`], className)}
    >
      <header className={styles.head}>
        <div className={styles.titleBlock}>
          {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {folio ? <WaxSeal folio={folio} size={size === 'sm' ? 'sm' : 'md'} /> : null}
      </header>
      {children ? (
        <>
          <div className={styles.rule} aria-hidden="true" />
          <div className={styles.body}>{children}</div>
        </>
      ) : null}
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </Surface>
  )
}
