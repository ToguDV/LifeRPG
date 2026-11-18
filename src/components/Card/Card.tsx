import type { ElementType, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Surface, type PaperOrnamentProps, type SurfaceProps } from '../Surface/Surface'
import { WaxSeal } from '../Ornaments/WaxSeal'
import { RibbonTitle } from './RibbonTitle'
import styles from './Card.module.css'

export type CardSize = 'sm' | 'md' | 'lg'

export interface CardProps extends PaperOrnamentProps {
  /** Container width and type scale: a filing card, a sheet, a full page. */
  size?: CardSize
  surface?: SurfaceProps['surface']
  /** Small engraved line that introduces the card (under the ribbon on paper). */
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
 *
 * On paper the title is set in the wax ribbon that hangs over the top
 * edge; on the dark panel it stays a plain heading.
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
  stains = true,
}: CardProps) {
  const paper = surface === 'paper'
  const ribbon = paper && Boolean(title)
  /* Without kicker, description or seal the header row would be empty. */
  const head = Boolean(kicker || description || folio || (!ribbon && title))

  return (
    <Surface
      as={as}
      surface={surface}
      padding={size === 'sm' ? 'md' : 'lg'}
      torn={paper}
      stack={paper ? stack : 'none'}
      margin={paper ? margin : 'none'}
      stains={paper && stains}
      className={cx(styles.card, styles[`size-${size}`], className)}
    >
      {ribbon ? <RibbonTitle size={size}>{title}</RibbonTitle> : null}
      {/*
        A `<div>`, not a `<header>`: a card dropped straight into the body
        would emit a second `banner` landmark, and a container must not create
        landmarks by accident. The heading inside — in this header or in the
        ribbon above it — still gives the card its name.
      */}
      {head ? (
        <div className={styles.head}>
          <div className={styles.titleBlock}>
            {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
            {!ribbon && title ? <h3 className={styles.title}>{title}</h3> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {folio ? <WaxSeal folio={folio} size={size === 'sm' ? 'sm' : 'md'} /> : null}
        </div>
      ) : null}
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
