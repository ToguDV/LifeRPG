import { useEffect, useId, useRef } from 'react'
import { Button } from '../components/Button/Button'
import { Icon } from '../components/Icon/Icon'
import { Popover } from '../components/Popover/Popover'
import { ProgressBar } from '../components/ProgressBar/ProgressBar'
import { cx } from '../lib/cx'
import { formatFileSize, formatMoment } from '../lib/format'
import { useUpdater } from './UpdaterProvider'
import styles from './UpdateBadge.module.css'

const KICKERS = {
  idle: 'The archive',
  checking: 'The archive',
  available: 'A new chapter',
  downloading: 'A new chapter',
  ready: 'A new chapter',
  current: 'The archive',
  error: 'The archive',
  unsupported: 'The archive',
} as const

/**
 * The update trigger in the topbar and the note it opens.
 *
 * It is a trigger, not a banner: the note appears where the player is
 * looking (anchored to the topbar) and never takes the page over. Opening it
 * by hand moves the focus to the action; a notification opens it without
 * touching the focus, and the page announces the version through a live
 * region instead (see `UpdaterProvider`).
 */
export function UpdateBadge() {
  const {
    supported,
    state,
    open,
    openPrompt,
    closePrompt,
    check,
    download,
    install,
  } = useUpdater()

  const triggerRef = useRef<HTMLButtonElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  /* Only a hand-opened note takes the focus. */
  const focusOnOpen = useRef(false)
  /* An action that ends in another phase keeps the focus on the note. */
  const keepFocus = useRef(false)
  const titleId = useId()

  useEffect(() => {
    if (!open || !focusOnOpen.current) return
    focusOnOpen.current = false

    const frame = requestAnimationFrame(() => {
      /*
        A note with no primary action (checking, downloading) opens on its
        close button: a portaled surface with nothing focused is unreachable
        from the keyboard, and the first Tab would dismiss it.
      */
      const target = primaryRef.current ?? closeRef.current
      target?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !keepFocus.current) return
    if (state.phase === 'available') return
    keepFocus.current = false

    const frame = requestAnimationFrame(() => {
      closeRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, state.phase])

  if (!supported) return null

  const phase = state.phase
  const news = phase === 'available' || phase === 'ready'
  const version = state.version

  const triggerLabel =
    phase === 'available' && version
      ? `Update available: version ${version}`
      : phase === 'ready' && version
        ? `Update ready to install: version ${version}`
        : phase === 'downloading'
          ? `Update downloading: ${state.percent ?? 0}%`
          : 'Updates'

  /*
    Closing always dismisses the current prompt. The focus only returns to
    the trigger when the note (or the trigger) had it: Escape while the
    player was writing elsewhere must not steal the caret.
  */
  const close = (restoreFocus = true) => {
    const note = document.querySelector('[data-update-note="true"]')
    const focusedInside =
      Boolean(note?.contains(document.activeElement)) ||
      document.activeElement === triggerRef.current

    closePrompt()
    if (restoreFocus && focusedInside) triggerRef.current?.focus()
  }

  const title =
    phase === 'available' && version
      ? `Version ${version} is here`
      : phase === 'downloading' && version
        ? `Bringing version ${version}`
        : phase === 'ready' && version
          ? `Version ${version} is ready`
          : phase === 'checking'
            ? 'Reading the archive'
            : phase === 'current'
              ? 'You are up to date'
              : phase === 'error'
                ? 'The archive did not answer'
                : phase === 'unsupported'
                  ? 'Updates live in the desktop app'
                  : 'The road ahead'

  const body =
    phase === 'checking'
      ? 'Looking for a new version…'
      : phase === 'error'
        ? (state.message ?? 'The update could not be checked.')
        : phase === 'unsupported'
          ? (state.message ?? 'Updates are only in the desktop app.')
          : phase === 'ready' && state.message
            ? state.message
            : phase === 'idle'
              ? 'Not checked yet.'
              : null

  const primary =
    phase === 'checking' || phase === 'downloading' || phase === 'unsupported'
      ? null
      : phase === 'available'
        ? {
            label: 'Download update',
            run: () => {
              keepFocus.current = true
              void download()
            },
          }
        : phase === 'ready'
          ? { label: 'Restart and update', run: install }
          : {
              label:
                phase === 'current'
                  ? 'Check again'
                  : phase === 'error'
                    ? 'Try again'
                    : 'Check for updates',
              run: () => {
                keepFocus.current = true
                void check({ announce: true })
              },
            }

  const secondary =
    phase === 'available' || phase === 'ready'
      ? 'Later'
      : phase === 'downloading'
        ? 'Keep writing'
        : 'Close'

  const checkedAt = state.checkedAt ? formatMoment(new Date(state.checkedAt)) : null
  const percent = state.percent ?? 0

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cx(styles.trigger, news && styles.triggerNews)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => {
          if (open) {
            close(false)
            return
          }
          focusOnOpen.current = true
          openPrompt()
        }}
      >
        <Icon name="spark" size="xs" className={styles.icon} />
        <span className={styles.label}>Update</span>
        {news ? <span className={styles.dot} aria-hidden="true" /> : null}
      </button>

      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        align="end"
        role="dialog"
        ariaLabelledby={titleId}
        className={styles.popover}
        maxWidth={420}
      >
        <div className={styles.note} data-update-note="true">
          <div className={styles.header}>
            <div className={styles.heading}>
              <p className={styles.kicker}>{KICKERS[phase]}</p>
              <p className={styles.title} id={titleId}>
                {title}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              aria-label="Close update note"
              onClick={() => close(true)}
            >
              <Icon name="close" size="sm" />
            </button>
          </div>

          {body ? <p className={styles.body}>{body}</p> : null}

          {/*
            The notes grow and the popover scrolls: it already caps its height
            to the viewport and owns the buttons, so no nested scroll region
            needs a tab stop of its own.
          */}
          {state.releaseNotes && phase === 'available' ? (
            <p className={styles.notes}>{state.releaseNotes}</p>
          ) : null}

          {phase === 'downloading' ? (
            <ProgressBar
              className={styles.progress}
              aria-label="Update download progress"
              value={percent}
              hint={
                state.total
                  ? `${formatFileSize(state.transferred ?? 0)} of ${formatFileSize(state.total)}`
                  : 'The archive is sending the next chapter.'
              }
            />
          ) : null}

          {checkedAt ? (
            <p className={styles.meta}>Last checked {checkedAt}</p>
          ) : null}

          <div className={styles.actions}>
            {primary ? (
              <Button
                ref={primaryRef}
                variant="primary"
                size="sm"
                onClick={primary.run}
              >
                {primary.label}
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => close(true)}>
              {secondary}
            </Button>
          </div>
        </div>
      </Popover>
    </>
  )
}
