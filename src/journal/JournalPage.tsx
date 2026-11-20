import { Atmosphere } from '../components/Atmosphere/Atmosphere'
import { formatDate } from '../lib/format'
import { useToday } from '../lib/useToday'
import { ThemePicker } from '../theme/ThemePicker'
import { QuestJournal } from './QuestJournal'
import { TaskJournal } from './TaskJournal'
import styles from './JournalPage.module.css'

export function JournalPage() {
  /* The heading is a date: it has to turn over with the day, not with a reload. */
  const today = useToday()

  return (
    <div className={styles.page} id="top">
      <a className={styles.skipLink} href="#content">
        Skip to content
      </a>

      <Atmosphere />

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <a className={styles.brand} href="/" aria-label="LifeRPG, journal">
              <span className={styles.brandMark} aria-hidden="true">
                <span className={styles.diamond} />
              </span>
              <span className={styles.brandName}>LifeRPG</span>
            </a>

            <div className={styles.topTools}>
              <nav className={styles.nav} aria-label="Main">
                <a href="/gallery">Codex</a>
              </nav>
              <ThemePicker />
            </div>
          </div>
        </header>

        <main className={styles.main} id="content" tabIndex={-1}>
          <div className={styles.heading}>
            <h1>The journal</h1>
            <p className={styles.date}>{formatDate(today)}</p>
          </div>

          <div className={styles.sections}>
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="visually-hidden">
                Tasks
              </h2>
              <TaskJournal />
            </section>

            <section aria-labelledby="route-heading">
              <h2 id="route-heading" className="visually-hidden">
                Questline
              </h2>
              <QuestJournal />
            </section>
          </div>
        </main>

        <footer className={styles.footer}>
          <span>Saved in this browser</span>
          <a href="/gallery">Codex</a>
        </footer>
      </div>
    </div>
  )
}
