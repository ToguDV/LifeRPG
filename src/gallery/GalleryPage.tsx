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
  actions: ActionsSection,
  selection: SelectionSection,
  fields: FieldsSection,
  lists: ListsSection,
  settings: NumbersSection,
  'date-time': DateTimeSection,
  files: FilesSection,
  extras: ExtrasSection,
  context: ContextSection,
  questline: QuestlineSection,
  containers: ContainersSection,
}

const SECTION_IDS: readonly SectionId[] = SECTIONS.map((section) => section.id)

const TOP_LINKS = [
  { id: 'actions', label: 'Actions' },
  { id: 'fields', label: 'Fields' },
  { id: 'date-time', label: 'Dates' },
  { id: 'context', label: 'Context' },
]

function SurfaceToggle({
  value,
  onChange,
}: {
  value: SurfaceValue
  onChange: (value: SurfaceValue) => void
}) {
  return (
    <div className={styles.surfaceToggle} role="group" aria-label="Sample surface">
      <button
        type="button"
        className={styles.surfaceOption}
        aria-pressed={value === 'paper'}
        aria-label="Paper"
        onClick={() => onChange('paper')}
        title="View the controls on paper"
      >
        <Icon name="scroll" size="xs" />
        <span className={styles.surfaceLabel}>Paper</span>
      </button>
      <button
        type="button"
        className={styles.surfaceOption}
        aria-pressed={value === 'panel'}
        aria-label="Panel"
        onClick={() => onChange('panel')}
        title="View the controls on the dark panel"
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
      <a className={styles.skipLink} href="#content">
        Skip to content
      </a>

      <Atmosphere />

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <a className={styles.brand} href="#top" aria-label="Component Codex, back to top">
              <span className={styles.brandMark} aria-hidden="true">
                <span className={styles.diamond} />
              </span>
              <span className={styles.brandFull}>Component Codex</span>
              <span className={styles.brandShort}>Codex</span>
            </a>

            <nav className={styles.topLinks} aria-label="Main sections">
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
              <p className={styles.kicker}>LifeRPG UI · Winter notebook</p>
              <h1 id="page-title">The Winter Kit</h1>
              <p className={styles.sub}>
                Components for a task journal, forged in worn paper, old ink, and eight
                palettes that change the weather without touching the structure.
              </p>
            </div>
            <div className={styles.mastheadMeta}>
              <p className={styles.volume}>Vol. I</p>
              <p className={styles.quote}>“The tool narrates too.”</p>
            </div>
          </section>

          <div className={styles.ornament} aria-hidden="true">
            <span />
            <b />
            <b />
            <span />
          </div>

          <section className={styles.intro} aria-label="How to read this gallery">
            <div className={styles.introText}>
              <p className={styles.introKicker}>How to read this codex</p>
              <p>
                Every control is live: type, drag, open calendars and wheels. Change the ink
                with the theme picker and switch the canvas between <b>Paper</b> and{' '}
                <b>Panel</b> to see how the surface tokens respond.
              </p>
              <p className={styles.introHand}>
                No color, spacing, or type is hardcoded: everything comes from the same
                token codex.
              </p>
            </div>
            <ul className={styles.stats}>
              <li>
                <b>08</b>
                <span>Themes</span>
              </li>
              <li>
                <b>13</b>
                <span>Controls</span>
              </li>
              <li>
                <b>{String(SECTIONS.length).padStart(2, '0')}</b>
                <span>Sections</span>
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.layout}>
          <aside className={styles.index}>
            <p className={styles.indexKicker}>Codex index</p>
            <nav className={styles.indexNav} aria-label="Component index">
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
              <p>“Every control answers to all eight themes.”</p>
            </div>
          </aside>

          <main className={styles.main} id="content" tabIndex={-1}>
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
          <span>Compiled in the Hollow Mark</span>
          <span className={styles.footerLine} aria-hidden="true" />
          <b>Year 812</b>
          <span className={styles.footerLine} aria-hidden="true" />
          <span>ink, ash, and wax</span>
          <span className={styles.diamond} aria-hidden="true" />
          <p className={styles.footerTech}>
            React 19 · TypeScript · CSS Modules · design tokens · local fonts
          </p>
        </footer>
      </div>
    </div>
  )
}
