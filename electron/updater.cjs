/*
  The update channel of the packaged app.

  `electron-builder` writes `app-update.yml` next to the renderer when a
  `publish` provider is configured, and `electron-updater` reads it to find
  `latest.yml` / `latest-linux.yml` on GitHub Releases. The renderer never
  touches the network: it asks this module through the preload bridge, and
  the module pushes one state object back on the `liferpg:updater:state`
  channel every time something changes.

  Nothing is downloaded or installed without the player asking: the app is
  not a background service, and a quest journal that reloads itself mid-edit
  is a bug, not an update.
*/
const { existsSync } = require('node:fs')
const path = require('node:path')
const { app, BrowserWindow } = require('electron')
const { autoUpdater } = require('electron-updater')

const STATE_CHANNEL = 'liferpg:updater:state'
/* The menu cannot open its own popover: it asks the renderer to. */
const CHECK_REQUEST_CHANNEL = 'liferpg:updater:request-check'
const UPDATE_CONFIG = 'app-update.yml'

/*
  Release notes arrive from the GitHub release body. They are shown as plain
  text (never as HTML), without tags and without a wall of text: the popover
  is a note, not a changelog page.
*/
function cleanNotes(releaseNotes) {
  const raw = Array.isArray(releaseNotes)
    ? releaseNotes
        .map((entry) => (entry && typeof entry.note === 'string' ? entry.note : ''))
        .join('\n\n')
    : releaseNotes

  if (typeof raw !== 'string') return null

  const notes = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return notes ? notes.slice(0, 1200) : null
}

/*
  The player gets a sentence, the console gets the error. A checksum mismatch
  and a dead connection are not the same problem and must not read alike.
*/
function messageFor(error) {
  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|net::|socket hang up/i.test(raw)) {
    return 'No road to the archive. Check the connection and try again.'
  }
  if (/sha512|checksum|integrity/i.test(raw)) {
    return 'The downloaded file does not match its seal. Try again.'
  }
  /*
    A .deb install goes through pkexec/sudo and `dpkg -i`; without a polkit
    agent, a wrong password or a locked dpkg, the failure must not read like
    a dead connection (the download already succeeded).
  */
  if (/dpkg|pkexec|polkit|apt-get|apt |sudo|permission denied|not authorized|exited with code/i.test(raw)) {
    return 'The package manager could not install the update. Update from a terminal, or install the new .deb by hand.'
  }
  if (/404|Cannot find latest|release/i.test(raw)) {
    return 'The archive holds no note for this version yet.'
  }
  if (/app-update\.yml|ENOENT/i.test(raw)) {
    return 'This build carries no update channel.'
  }

  return 'The archive did not answer. Try again later.'
}

/**
 * Creates the update state machine for the main process.
 *
 * `phase` is the single field the renderer branches on:
 *
 *   unsupported · idle · checking · available · downloading · ready
 *   current · error
 */
function createUpdater() {
  const currentVersion = app.getVersion()
  const supported =
    app.isPackaged && existsSync(path.join(process.resourcesPath, UPDATE_CONFIG))

  /*
    The version whose installer is already on disk. It lives outside `state`
    because a re-check rewrites the phase while it looks for a newer one.
  */
  let downloadedVersion = null
  /* One installer spawn per state: a double click must not run it twice. */
  let installing = false

  let state = {
    phase: supported ? 'idle' : 'unsupported',
    currentVersion,
    version: null,
    percent: null,
    transferred: null,
    total: null,
    message: supported
      ? null
      : app.isPackaged
        ? 'This build carries no update channel.'
        : 'This build cannot update itself.',
    releaseNotes: null,
    checkedAt: null,
  }

  const snapshot = () => ({ ...state })

  const broadcast = () => {
    const next = snapshot()
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) continue
      window.webContents.send(STATE_CHANNEL, next)
    }
  }

  const setState = (patch) => {
    state = { ...state, ...patch }
    broadcast()
  }

  const fail = (error) => {
    console.error('[updater]', error)
    /* A failed install must not leave the button latched. */
    installing = false

    /*
      A failed check does not undo a download that already finished: the
      restart stays on offer, and the sentence says what went wrong (a
      package-manager error, not a lost connection).
    */
    if (downloadedVersion !== null) {
      setState({
        phase: 'ready',
        percent: 100,
        message: messageFor(error),
        checkedAt: Date.now(),
      })
      return
    }

    setState({
      phase: 'error',
      message: messageFor(error),
      percent: null,
      checkedAt: Date.now(),
    })
  }

  /*
    electron-updater only emits; the listeners below translate its events
    into the one state object. `autoDownload` stays off: `available` is a
    question, not a download.
  */
  const listen = () => {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.logger = {
      info: (...args) => console.log('[updater]', ...args),
      warn: (...args) => console.warn('[updater]', ...args),
      error: (...args) => console.error('[updater]', ...args),
      debug: () => {},
    }

    autoUpdater.on('checking-for-update', () => {
      setState({ phase: 'checking', message: null })
    })

    autoUpdater.on('update-available', (info) => {
      /*
        A check run after the download already finished offers the same
        version again. The file is on disk, so the state stays `ready`: the
        player must not be asked to download it twice.
      */
      const downloaded = info.version === downloadedVersion

      setState({
        phase: downloaded ? 'ready' : 'available',
        version: info.version,
        releaseNotes: cleanNotes(info.releaseNotes),
        message: null,
        percent: downloaded ? 100 : null,
        transferred: null,
        total: null,
        checkedAt: Date.now(),
      })
    })

    autoUpdater.on('update-not-available', () => {
      /* Nothing newer than the installer already downloaded: it stays ready. */
      if (downloadedVersion !== null) {
        setState({
          phase: 'ready',
          version: downloadedVersion,
          percent: 100,
          message: null,
          checkedAt: Date.now(),
        })
        return
      }

      setState({
        phase: 'current',
        version: null,
        releaseNotes: null,
        message: null,
        percent: null,
        checkedAt: Date.now(),
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      setState({
        phase: 'downloading',
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      downloadedVersion = info.version
      setState({
        phase: 'ready',
        version: info.version,
        percent: 100,
        message: null,
      })
    })

    autoUpdater.on('error', fail)
  }

  const check = async () => {
    if (state.phase === 'unsupported') return snapshot()
    if (state.phase === 'checking' || state.phase === 'downloading') return snapshot()

    /*
      A finished download keeps its `ready` state while the archive is asked
      again: the installer is still on disk, so the restart must not vanish
      behind a spinner. A newer version found by this check replaces it.
    */
    const keepReady = downloadedVersion !== null
    if (!keepReady) setState({ phase: 'checking', message: null, percent: null })

    try {
      /*
        The events above run synchronously while this promise settles, so the
        snapshot the renderer receives already carries the result.
      */
      await autoUpdater.checkForUpdates()
    } catch (error) {
      fail(error)
    }

    /*
      electron-updater resolves `null` without emitting anything when it is
      not active on this build, which would leave the screen saying
      “checking” for the rest of the session: settle the phase here.
    */
    if (!keepReady && state.phase === 'checking') {
      setState({
        phase: 'error',
        message: 'This build cannot check for updates.',
        percent: null,
        checkedAt: Date.now(),
      })
    }

    return snapshot()
  }

  const download = async () => {
    if (state.phase !== 'available') return snapshot()

    /* A new download replaces whatever an older one left on disk. */
    downloadedVersion = null
    setState({ phase: 'downloading', percent: 0, transferred: 0, total: null })

    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      fail(error)
    }

    return snapshot()
  }

  const install = () => {
    if (installing || state.phase !== 'ready') return false

    installing = true

    /*
      The IPC reply has to leave before Electron tears the window down, or
      the renderer sees a rejected promise while the installer runs. The
      installer restarts the app on its own (`autoRunAppAfterInstall`).
    */
    setImmediate(() => {
      try {
        autoUpdater.quitAndInstall(false, true)
      } catch (error) {
        fail(error)
      } finally {
        /*
          `install` is synchronous: on success Electron quits on the next
          tick, and on failure electron-updater dispatches an error (handled
          above), so the latch is only needed to collapse a double click.
        */
        installing = false
      }
    })

    return true
  }

  /*
    Menu entry. The renderer owns the popover, so the menu asks it to open
    the note and run a check instead of duplicating that state here.
  */
  const requestCheck = () => {
    const window = BrowserWindow.getAllWindows()[0]
    if (!window || window.isDestroyed()) return

    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
    window.webContents.send(CHECK_REQUEST_CHANNEL)
  }

  return {
    supported,
    snapshot,
    check,
    download,
    install,
    requestCheck,
    listen,
  }
}

module.exports = { createUpdater, STATE_CHANNEL, CHECK_REQUEST_CHANNEL }
