import { Card } from '../../components/Card/Card'
import { SECTIONS } from '../sections'
import { DemoNote } from '../Demo'
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
            description={meta.note}
            folio={meta.number}
            footer={
              size === 'lg'
                ? 'Same sheet, three heights: card, folio, and page.'
                : undefined
            }
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

      <DemoNote muted className={styles.shelfNote}>
        Three containers: a 21 rem card, a 30 rem folio, and a full page. On paper, the
        title sits in a wax ribbon that crosses the top edge and its tails are decorative
        layers marked <b>aria-hidden</b>. The stacked sheets, the notebook margin, and the
        edge stains also live under the content.
      </DemoNote>
    </div>
  )
}
