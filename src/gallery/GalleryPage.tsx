import { useState, type ComponentType } from 'react'
import { Icon } from '../components/Icon/Icon'
import { ThemePicker } from '../theme/ThemePicker'
import type { SurfaceValue } from '../components/Surface/surface-context'
import { Atmosphere } from './Atmosphere'
import { cx } from '../lib/cx'
import { SECTIONS, type SectionId } from './sections'
import { SectionHeading } from './Demo'
import { ActionsSection } from './sections/ActionsSection'
import { SelectionSection } from './sections/SelectionSection'
import { FieldsSection } from './sections/FieldsSection'
import { ListsSection } from './sections/ListsSection'
import { NumbersSection } from './sections/NumbersSection'
import { DateTimeSection } from './sections/DateTimeSection'
import { FilesSection } from './sections/FilesSection'
import { ExtrasSection } from './sections/ExtrasSection'
import { ContextSection } from './sections/ContextSection'
import { QuestlineSection } from './sections/QuestlineSection'
import { ContainersSection } from './sections/ContainersSection'
import type { SectionProps } from './SectionProps'
import { useActiveSection } from './useActiveSection'
import styles from './GalleryPage.module.css'

const SECTION_COMPONENTS: Record<SectionId, ComponentType<SectionProps>> = {
  acciones: ActionsSection,
  seleccion: SelectionSection,
  campos: FieldsSection,
  listas: ListsSection,
  ajustes: NumbersSection,
  'fecha-hora': DateTimeSection,
  archivos: FilesSection,
  complementos: ExtrasSection,
  contexto: ContextSection,
  travesia: QuestlineSection,
  contenedores: ContainersSection,
}

const SECTION_IDS: readonly SectionId[] = SECTIONS.map((section) => section.id)

const TOP_LINKS = [
  { id: 'acciones', label: 'Acciones' },
  { id: 'campos', label: 'Campos' },
  { id: 'fecha-hora', label: 'Fechas' },
  { id: 'contexto', label: 'Contexto' },
]

function SurfaceToggle({
  value,
  onChange,
}: {
  value: SurfaceValue
  onChange: (value: SurfaceValue) => void
}) {
  return (
    <div className={styles.surfaceToggle} role="group" aria-label="Superficie de muestra">
      <button
        type="button"
        className={styles.surfaceOption}
        aria-pressed={value === 'paper'}
        aria-label="Papel"
        onClick={() => onChange('paper')}
        title="Ver los controles sobre papel"
      >
        <Icon name="scroll" size="xs" />
        <span className={styles.surfaceLabel}>Papel</span>
      </button>
      <button
        type="button"
        className={styles.surfaceOption}
        aria-pressed={value === 'panel'}
        aria-label="Panel"
        onClick={() => onChange('panel')}
        title="Ver los controles sobre panel oscuro"
      >
        <Icon name="shield" size="xs" />
        <span className={styles.surfaceLabel}>Panel</span>
      </button>
    </div>
  )
}

export function GalleryPage() {
  const [canvas, setCanvas] = useState<SurfaceValue>('paper')
  const activeSection = useActiveSection(SECTION_IDS, SECTIONS[0].id)

  return (
    <div className={styles.page} id="top">
      <a className={styles.skipLink} href="#contenido">
        Saltar al contenido
      </a>

      <Atmosphere />

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <a className={styles.brand} href="#top" aria-label="Códice de Componentes, volver arriba">
              <span className={styles.brandMark} aria-hidden="true">
                <span className={styles.diamond} />
              </span>
              <span className={styles.brandFull}>Códice de Componentes</span>
              <span className={styles.brandShort}>Códice</span>
            </a>

            <nav className={styles.topLinks} aria-label="Secciones principales">
              {TOP_LINKS.map((link) => (
                <a key={link.id} href={`#${link.id}`}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className={styles.topTools}>
              <SurfaceToggle value={canvas} onChange={setCanvas} />
              <ThemePicker />
            </div>
          </div>
        </header>

        <div className={styles.mastheadWrap}>
          <section className={styles.masthead} aria-labelledby="page-title">
            <div className={styles.crest} aria-hidden="true">
              <Icon name="compass" size="2xl" />
            </div>
            <div className={styles.mastheadTitle}>
              <p className={styles.kicker}>LifeRPG UI · Cuaderno de invierno</p>
              <h1 id="page-title">El Kit del Invierno</h1>
              <p className={styles.sub}>
                Componentes para un diario de tareas, forjados en papel gastado, tinta vieja y
                ocho paletas que cambian el clima sin tocar la estructura.
              </p>
            </div>
            <div className={styles.mastheadMeta}>
              <p className={styles.volume}>Vol. I</p>
              <p className={styles.quote}>«La herramienta también narra.»</p>
            </div>
          </section>

          <div className={styles.ornament} aria-hidden="true">
            <span />
            <b />
            <b />
            <span />
          </div>

          <section className={styles.intro} aria-label="Cómo leer esta galería">
            <div className={styles.introText}>
              <p className={styles.introKicker}>Cómo leer este códice</p>
              <p>
                Cada control está vivo: escribe, arrastra, abre calendarios y ruedas. Cambia la
                tinta con el selector de temas y alterna el lienzo entre <b>Papel</b> y{' '}
                <b>Panel</b> para comprobar cómo responden los tokens de superficie.
              </p>
              <p className={styles.introHand}>
                Ningún color, espacio o tipo está escrito a mano: todo sale del mismo códice de
                tokens.
              </p>
            </div>
            <ul className={styles.stats}>
              <li>
                <b>08</b>
                <span>Temas</span>
              </li>
              <li>
                <b>13</b>
                <span>Controles</span>
              </li>
              <li>
                <b>{String(SECTIONS.length).padStart(2, '0')}</b>
                <span>Secciones</span>
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.layout}>
          <aside className={styles.index}>
            <p className={styles.indexKicker}>Índice del códice</p>
            <nav className={styles.indexNav} aria-label="Índice de componentes">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={cx(
                    styles.indexLink,
                    activeSection === section.id && styles.indexLinkActive,
                  )}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                >
                  <span className={styles.indexNum}>{section.number}</span>
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
            <div className={styles.indexFoot}>
              <span className={styles.diamond} aria-hidden="true" />
              <p>«Cada control responde a los ocho temas.»</p>
            </div>
          </aside>

          <main className={styles.main} id="contenido" tabIndex={-1}>
            {SECTIONS.map((meta) => {
              const Section = SECTION_COMPONENTS[meta.id]
              return (
                <section key={meta.id} id={meta.id} className={styles.section}>
                  <SectionHeading meta={meta} />
                  <div className={styles.sectionBody}>
                    <Section canvas={canvas} />
                  </div>
                </section>
              )
            })}
          </main>
        </div>

        <footer className={styles.footer}>
          <span className={styles.diamond} aria-hidden="true" />
          <span>Compilado en la Marca Hueca</span>
          <span className={styles.footerLine} aria-hidden="true" />
          <b>Año 812</b>
          <span className={styles.footerLine} aria-hidden="true" />
          <span>tinta, ceniza y cera</span>
          <span className={styles.diamond} aria-hidden="true" />
          <p className={styles.footerTech}>
            React 19 · TypeScript · CSS Modules · design tokens · fuentes locales
          </p>
        </footer>
      </div>
    </div>
  )
}
