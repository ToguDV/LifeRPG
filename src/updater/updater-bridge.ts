/*
  The renderer's half of the update bridge.

  `electron/preload.cjs` exposes `window.liferpg.updater` through
  `contextBridge`. The browser build has no such object, so every call site
  goes through `getUpdater()` and treats `null` as "this copy cannot update
  itself" instead of guessing.
*/

export type UpdaterPhase =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'current'
  | 'error'

/**
 * One snapshot of the main process's update state. `phase` is the only field
 * a view branches on; the rest is context for the copy.
 */
export interface UpdaterState {
  phase: UpdaterPhase
  /** The version running now, from `app.getVersion()`. */
  currentVersion: string
  /** The version the state is about: offered, downloading or downloaded. */
  version: string | null
  /** 0–100 while downloading. */
  percent: number | null
  transferred: number | null
  total: number | null
  /** A sentence for the player when something failed. Never a stack trace. */
  message: string | null
  releaseNotes: string | null
  checkedAt: number | null
}

export interface LifeRpgUpdater {
  getState: () => Promise<UpdaterState>
  check: () => Promise<UpdaterState>
  download: () => Promise<UpdaterState>
  install: () => Promise<boolean>
  /** Fires on every change in the main process. Returns an unsubscriber. */
  onState: (listener: (state: UpdaterState) => void) => () => void
  /** The desktop menu asked for a check: open the note and look again. */
  onCheckRequested: (listener: () => void) => () => void
}

declare global {
  interface Window {
    liferpg?: {
      updater: LifeRpgUpdater
    }
  }
}

/** Before the first snapshot arrives, and in every browser tab. */
export const INITIAL_UPDATER_STATE: UpdaterState = {
  phase: 'idle',
  currentVersion: '',
  version: null,
  percent: null,
  transferred: null,
  total: null,
  message: null,
  releaseNotes: null,
  checkedAt: null,
}

/**
 * Resolves the preload bridge, or `null` on the web. The shape is checked
 * once here rather than per call: a half-built global is worse than none.
 */
export function getUpdater(): LifeRpgUpdater | null {
  if (typeof window === 'undefined') return null

  const bridge = window.liferpg?.updater
  if (!bridge) return null
  if (typeof bridge.onState !== 'function') return null

  return bridge
}
