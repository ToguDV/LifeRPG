import { Atmosphere } from '../components/Atmosphere/Atmosphere'
import { Badge } from '../components/Badge/Badge'
import { Button } from '../components/Button/Button'
import { Card } from '../components/Card/Card'
import { Icon, type IconName } from '../components/Icon/Icon'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { Switch } from '../components/Switch/Switch'
import { formatMoment } from '../lib/format'
import { ThemePicker } from '../theme/ThemePicker'
import { UpdateBadge } from '../updater/UpdateBadge'
import { useUpdater } from '../updater/UpdaterProvider'
import type { UpdaterPhase, UpdaterState } from '../updater/updater-bridge'
import styles from './SettingsPage.module.css'

const PHASE_ICONS: Record<UpdaterPhase, IconName> = {
  idle: 'info',
  checking: 'hourglass',
  available: 'spark',
  downloading: 'hourglass',
  ready: 'check',
  current: 'check',
  error: 'alert',
  unsupported: 'info',
}

function describeStatus(state: UpdaterState): string {
  switch (state.phase) {
    case 'checking':
      return 'Checking…'
    case 'current':
      return 'You are up to date.'
    case 'available':
      return `Version ${state.version} is ready to download.`
    case 'downloading':
      return `Downloading ${state.percent ?? 0}%…`
    case 'ready':
      return state.message ?? `Version ${state.version} is downloaded.`
    case 'error':
      return state.message ?? 'The update could not be checked.'
    case 'unsupported':
      return 'Off in this build.'
    default:
      return 'Not checked yet.'
  }
}

export function SettingsPage() {
  const {
    supported,
    state,
    settings,
    setAutoCheck,
    setNotify,
    checking,
    check,
    download,
    install,
  } = useUpdater()

  const checkedAt = state.checkedAt
    ? formatMoment(new Date(state.checkedAt))
    : null
  const version = state.currentVersion
    ? `Version ${state.currentVersion}`
    : 'Web preview'

  /*
    The card offers the one action that moves the update forward: look,
    download, or restart.
  */
  const action =
    state.phase === 'downloading'
      ? null
      : state.phase === 'available'
        ? { label: 'Download update', run: () => void download(), loading: false }
        : state.phase === 'ready'
          ? { label: 'Restart and update', run: install, loading: false }
          : {
              label: 'Check for updates',
              run: () => void check({ announce: true }),
              loading: checking,
            }

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
                <a href="/">Journal</a>
                <a href="/gallery">Codex</a>
              </nav>
              <UpdateBadge />
              <ThemePicker />
            </div>
          </div>
        </header>

        <main className={styles.main} id="content" tabIndex={-1}>
          <div className={styles.heading}>
            <h1>Settings</h1>
          </div>

          <section aria-labelledby="updates-heading">
            <h2 id="updates-heading" className="visually-hidden">
              Updates
            </h2>

            <Card
              size="lg"
              kicker={
                <Badge variant="accent" size="sm">
                  Updates
                </Badge>
              }
              title="The road ahead"
              folio="I"
            >
              {!supported ? (
                <p className={styles.unsupported}>
                  <Icon name="info" size="sm" className={styles.noteIcon} />
                  <span>
                    {state.message ?? 'Updates are only in the desktop app.'}
                  </span>
                </p>
              ) : null}

              <div className={styles.updates}>
                <div className={styles.rows}>
                  <Switch
                    label="Check for updates automatically"
                    checked={settings.autoCheck}
                    disabled={!supported}
                    onChange={(event) => setAutoCheck(event.target.checked)}
                  />
                  <Switch
                    label="Tell me about new versions"
                    checked={settings.notify}
                    disabled={!supported}
                    onChange={(event) => setNotify(event.target.checked)}
                  />
                </div>

                <div className={styles.side}>
                  <div className={styles.status} data-phase={state.phase}>
                    <p className={styles.statusLine}>
                      <Icon
                        name={PHASE_ICONS[state.phase]}
                        size="sm"
                        className={styles.noteIcon}
                      />
                      <span>{describeStatus(state)}</span>
                    </p>
                    <p className={styles.statusMeta}>
                      {checkedAt ? `${version} · Checked ${checkedAt}` : version}
                    </p>
                    {state.phase === 'downloading' ? (
                      <ProgressBar
                        className={styles.progress}
                        aria-label="Update download progress"
                        value={state.percent ?? 0}
                      />
                    ) : null}
                  </div>

                  {supported && action ? (
                    <div className={styles.actions}>
                      {/*
                        No `loading` here: it disables the button, and a
                        disabled element drops the focus to <body> in the
                        middle of a check. The label and aria-busy carry the
                        state, and the provider ignores a second click.
                      */}
                      <Button
                        variant="primary"
                        size="md"
                        onClick={action.run}
                        aria-busy={action.loading || undefined}
                      >
                        {action.loading ? 'Checking…' : action.label}
                      </Button>
                      {state.phase === 'available' ? (
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() => void check({ announce: true })}
                        >
                          Check again
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </section>
        </main>

        <footer className={styles.footer}>
          <span>Saved in this browser</span>
          <span className={styles.footerLinks}>
            <a href="/">Journal</a>
            <a href="/gallery">Codex</a>
          </span>
        </footer>
      </div>
    </div>
  )
}
