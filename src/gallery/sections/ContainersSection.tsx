import { Card } from '../../components/Card/Card'
import { SECTIONS } from '../sections'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

/** Cards are sized by the width of the sheet they are meant to be. */
const SHELF = [
  { sectionId: 'actions', size: 'sm' },
  { sectionId: 'settings', size: 'md' },
  { sectionId: 'context', size: 'lg' },
] as const

export function ContainersSection({ canvas }: SectionProps) {
  return (
    <div className={styles.containerShelf}>
      {SHELF.map(({ sectionId, size }) => {
        const meta = SECTIONS.find((section) => section.id === sectionId)
        if (!meta) return null

        return (
          <Card
            key={meta.id}
            as="article"
            size={size}
            surface={canvas}
            kicker={meta.kicker}
            title={meta.title}
            folio={meta.number}
          >
            <ul className={styles.cardList}>
              {meta.components.map((name, index) => (
                <li key={name} className={styles.cardRow}>
                  <span className={styles.cardRowNum} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.cardRowName}>{name}</span>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
