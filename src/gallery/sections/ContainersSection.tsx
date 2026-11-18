import { Card } from '../../components/Card/Card'
import { SECTIONS } from '../sections'
import { DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

/** Cards are sized by the width of the sheet they are meant to be. */
const SHELF = [
  { sectionId: 'acciones', size: 'sm' },
  { sectionId: 'ajustes', size: 'md' },
  { sectionId: 'contexto', size: 'lg' },
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
                ? 'Misma hoja, tres alturas: ficha, pliego y página.'
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
        Tres contenedores: ficha de 21 rem, pliego de 30 rem y página completa. Sobre
        papel, el título va en una cinta de cera que cruza el borde superior y sus colas
        son capas decorativas marcadas como <b>aria-hidden</b>. Las hojas apiladas, el
        margen de cuaderno y las manchas de borde también viven bajo el contenido.
      </DemoNote>
    </div>
  )
}
