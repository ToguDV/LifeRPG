import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useToast } from '../components/Toast/Toast'
import { usePersistentState } from '../lib/usePersistentState'
import {
  INITIAL_UPDATER_STATE,
  getUpdater,
  type UpdaterState,
} from './updater-bridge'

export const UPDATER_SETTINGS_KEY = 'liferpg-updater-settings-v1'
/** A few seconds after the journal opens, so first paint is never delayed. */
export const AUTO_CHECK_DELAY = 4_000
/** Four hours: a day's work has at most a couple of checks in it. */
export const AUTO_CHECK_INTERVAL = 4 * 60 * 60 * 1000

export interface UpdaterSettings {
  /** Look for a new version when the journal opens, and every few hours. */
  autoCheck: boolean
  /** Open the update note as soon as a version is found. */
  notify: boolean
}

export const DEFAULT_UPDATER_SETTINGS: UpdaterSettings = {
  autoCheck: true,
  notify: true,
}

/**
 * A settings payload that was written by an older build still parses: a
 * missing key falls back to its default, and only a non-object is rejected.
 */
export function parseUpdaterSettings(value: unknown): UpdaterSettings | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  return {
    autoCheck:
      typeof record.autoCheck === 'boolean'
        ? record.autoCheck
        : DEFAULT_UPDATER_SETTINGS.autoCheck,
    notify:
      typeof record.notify === 'boolean'
        ? record.notify
        : DEFAULT_UPDATER_SETTINGS.notify,
  }
}

interface UpdaterContextValue {
  /** `false` on the web and in a dev shell: there is nothing to update. */
  supported: boolean
  state: UpdaterState
  settings: UpdaterSettings
  setAutoCheck: (value: boolean) => void
  setNotify: (value: boolean) => void
  checking: boolean
  /** The update note: opened by the trigger, by a notification or by the menu. */
  open: boolean
  openPrompt: () => void
  closePrompt: () => void
  check: (options?: { announce?: boolean }) => Promise<void>
  download: () => Promise<void>
  install: () => void
}

const UpdaterContext = createContext<UpdaterContextValue | null>(null)

function describeAnnouncement(state: UpdaterState): string {
  if (state.phase === 'available' && state.version) {
    return `Version ${state.version} is available to download.`
  }
  if (state.phase === 'ready' && state.version) {
    return `Version ${state.version} is downloaded and ready to install.`
  }
  if (state.phase === 'error') {
    return `The update check failed. ${state.message ?? ''}`.trim()
  }
  return ''
}

/**
 * Update state for the whole app.
 *
 * The shell owns *what* is available; this provider owns *when to ask* and
 * the two preferences the player sets in Settings. The notification is a
 * popover anchored to the topbar trigger, so the note never covers the page
 * and Escape always has somewhere to return the focus to.
 */
export function UpdaterProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const bridge = useMemo(() => getUpdater(), [])
  const [settings, setSettings] = usePersistentState<UpdaterSettings>(
    UPDATER_SETTINGS_KEY,
    () => DEFAULT_UPDATER_SETTINGS,
    parseUpdaterSettings,
  )
  const [state, setState] = useState<UpdaterState>(INITIAL_UPDATER_STATE)
  const [checking, setChecking] = useState(false)
  const [open, setOpen] = useState(false)
  /* Dismissed prompt keys ("phase:version"), for this session only. */
  const [dismissed, setDismissed] = useState<string | null>(null)
  /* A second click while a check is in flight is not a second check. */
  const inFlight = useRef(false)

  const supported = Boolean(bridge) && state.phase !== 'unsupported'
  const promptKey =
    state.version === null ? null : `${state.phase}:${state.version}`

  /* Follow the main process: one snapshot on mount, then every event. */
  useEffect(() => {
    if (!bridge) return

    let alive = true
    bridge
      .getState()
      .then((next) => {
        if (alive && next) setState(next)
      })
      .catch(() => {
        /* A shell that cannot describe itself is reported as unsupported. */
      })

    const unsubscribe = bridge.onState((next) => {
      if (next) setState(next)
    })

    return () => {
      alive = false
      unsubscribe()
    }
  }, [bridge])

  const check = useCallback(
    async (options?: { announce?: boolean }) => {
      if (!bridge || inFlight.current) return

      inFlight.current = true
      setChecking(true)
      try {
        const next = await bridge.check()
        if (next) setState(next)

        if (!options?.announce) return

        /*
          The provider's status region already speaks a found version or a
          failure when notifications are on; a toast for the same event would
          be the same fact twice. Without it, the toast is the only voice.
        */
        const speaks = settings.notify
        if (next.phase === 'current') {
          toast({
            title: 'You are up to date',
            description: `Version ${next.currentVersion} is the newest chapter.`,
            variant: 'success',
          })
        } else if (next.phase === 'available' && !speaks) {
          toast({
            title: 'A new chapter is here',
            description: `Version ${next.version} can be downloaded when you are ready.`,
          })
        } else if (next.phase === 'error' && !speaks) {
          toast({
            title: 'The archive did not answer',
            description: next.message ?? 'The update could not be checked.',
            variant: 'danger',
          })
        } else if (next.phase === 'unsupported') {
          toast({
            title: 'Updates live in the desktop app',
            description:
              next.message ?? 'Install LifeRPG to receive new versions.',
          })
        }
      } catch {
        toast({
          title: 'The archive did not answer',
          description: 'The update could not be checked.',
          variant: 'danger',
        })
      } finally {
        inFlight.current = false
        setChecking(false)
      }
    },
    [bridge, toast, settings.notify],
  )

  /* One check a few seconds in, then on a slow interval. */
  useEffect(() => {
    if (!bridge || !settings.autoCheck) return

    const first = window.setTimeout(() => {
      void check()
    }, AUTO_CHECK_DELAY)
    const repeat = window.setInterval(() => {
      void check()
    }, AUTO_CHECK_INTERVAL)

    return () => {
      window.clearTimeout(first)
      window.clearInterval(repeat)
    }
  }, [bridge, settings.autoCheck, check])

  /* The desktop menu asks for a check and a note, in that order. */
  useEffect(() => {
    if (!bridge) return

    return bridge.onCheckRequested(() => {
      setOpen(true)
      void check({ announce: true })
    })
  }, [bridge, check])

  /*
    The notification. It opens once per version and phase, never over an
    editor (a modal owns the layer while it is open), and never when the
    player turned notifications off. Closing it by any route dismisses that
    prompt until the next phase or the next launch.
  */
  useEffect(() => {
    if (!bridge || !settings.notify || promptKey === null) return
    if (state.phase !== 'available' && state.phase !== 'ready') return
    if (promptKey === dismissed) return
    if (document.querySelector('[aria-modal="true"]')) return

    setOpen(true)
  }, [bridge, settings.notify, promptKey, state.phase, dismissed])

  const openPrompt = useCallback(() => setOpen(true), [])

  const closePrompt = useCallback(() => {
    setOpen(false)
    if (promptKey) setDismissed(promptKey)
  }, [promptKey])

  const download = useCallback(async () => {
    if (!bridge) return

    try {
      const next = await bridge.download()
      if (next) setState(next)
    } catch {
      /* The error arrives through the state channel, with a reading message. */
    }
  }, [bridge])

  const install = useCallback(() => {
    void bridge?.install()
  }, [bridge])

  const setAutoCheck = useCallback(
    (value: boolean) => setSettings((current) => ({ ...current, autoCheck: value })),
    [setSettings],
  )

  const setNotify = useCallback(
    (value: boolean) => setSettings((current) => ({ ...current, notify: value })),
    [setSettings],
  )

  const value = useMemo<UpdaterContextValue>(
    () => ({
      supported,
      state,
      settings,
      setAutoCheck,
      setNotify,
      checking,
      open,
      openPrompt,
      closePrompt,
      check,
      download,
      install,
    }),
    [
      supported,
      state,
      settings,
      setAutoCheck,
      setNotify,
      checking,
      open,
      openPrompt,
      closePrompt,
      check,
      download,
      install,
    ],
  )

  return (
    <UpdaterContext.Provider value={value}>
      {children}
      {/*
        The note is portaled and nobody is moved into it, so the state has to
        be spoken from the page: a polite status that changes when the shell
        reports a new version.
      */}
      <p className="visually-hidden" role="status">
        {settings.notify ? describeAnnouncement(state) : ''}
      </p>
    </UpdaterContext.Provider>
  )
}

export function useUpdater(): UpdaterContextValue {
  const context = useContext(UpdaterContext)
  if (!context) {
    throw new Error('useUpdater must be used inside <UpdaterProvider>')
  }
  return context
}
