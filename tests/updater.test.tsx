import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../src/components/Toast/Toast'
import { SettingsPage } from '../src/settings/SettingsPage'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import {
  UPDATER_SETTINGS_KEY,
  UpdaterProvider,
  parseUpdaterSettings,
} from '../src/updater/UpdaterProvider'
import {
  INITIAL_UPDATER_STATE,
  type LifeRpgUpdater,
  type UpdaterState,
} from '../src/updater/updater-bridge'

/*
  The desktop bridge does not exist in jsdom, so the suite builds one: a tiny
  state holder that calls the same listeners the preload would. Everything on
  this side of the IPC is exercised; `electron-updater` itself is not.
*/
function mountBridge(initial: Partial<UpdaterState> = {}) {
  let state: UpdaterState = {
    ...INITIAL_UPDATER_STATE,
    currentVersion: '1.0.0',
    ...initial,
  }

  const listeners = new Set<(next: UpdaterState) => void>()
  const requestListeners = new Set<() => void>()

  const emit = (patch: Partial<UpdaterState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener(state)
  }

  const bridge: LifeRpgUpdater = {
    getState: vi.fn(async () => state),
    check: vi.fn(async () => state),
    download: vi.fn(async () => state),
    install: vi.fn(async () => true),
    onState: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onCheckRequested: (listener) => {
      requestListeners.add(listener)
      return () => requestListeners.delete(listener)
    },
  }

  window.liferpg = { updater: bridge }

  return {
    bridge,
    emit,
    requestCheck: () => {
      for (const listener of requestListeners) listener()
    },
  }
}

function renderSettings() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <UpdaterProvider>
          <SettingsPage />
        </UpdaterProvider>
      </ToastProvider>
    </ThemeProvider>,
  )
}

/** Lets the mount-time `getState` promise settle inside `act`. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  delete window.liferpg
})

describe('parseUpdaterSettings', () => {
  it('defaults a missing key and rejects a payload that is not an object', () => {
    expect(parseUpdaterSettings({ autoCheck: false })).toEqual({
      autoCheck: false,
      notify: true,
    })
    expect(parseUpdaterSettings(null)).toBeNull()
    expect(parseUpdaterSettings([true])).toBeNull()
  })
})

describe('Settings · updates', () => {
  it('explains that a browser copy cannot update itself', () => {
    renderSettings()

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    expect(
      screen.getByRole('switch', { name: /Check for updates automatically/ }),
    ).toBeDisabled()
    expect(
      screen.getByText('Updates are only in the desktop app.'),
    ).toBeVisible()
    /* No shell, no update trigger in the topbar. */
    expect(
      screen.queryByRole('button', { name: 'Updates' }),
    ).not.toBeInTheDocument()
  })

  it('stores both preferences as the player flips them', async () => {
    const user = userEvent.setup()
    mountBridge()
    renderSettings()
    await settle()

    const auto = screen.getByRole('switch', {
      name: /Check for updates automatically/,
    })
    const notify = screen.getByRole('switch', { name: /Tell me about new versions/ })
    expect(auto).toBeChecked()
    expect(notify).toBeChecked()

    await user.click(auto)
    await user.click(notify)

    expect(JSON.parse(window.localStorage.getItem(UPDATER_SETTINGS_KEY) ?? '{}')).toEqual({
      autoCheck: false,
      notify: false,
    })
  })

  it('checks on demand and reports the result in place', async () => {
    const user = userEvent.setup()
    const { bridge, emit } = mountBridge()
    vi.mocked(bridge.check).mockImplementation(async () => {
      emit({ phase: 'current', checkedAt: 1_760_000_000_000 })
      return {
        ...INITIAL_UPDATER_STATE,
        currentVersion: '1.0.0',
        phase: 'current',
        checkedAt: 1_760_000_000_000,
      }
    })

    renderSettings()
    await settle()

    await user.click(screen.getByRole('button', { name: 'Check for updates' }))

    expect(bridge.check).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('You are up to date.')).toBeVisible()
    expect(screen.getByText(/Version 1\.0\.0 · Checked/)).toBeVisible()
  })

  it('only offers the download once a version is available', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      UPDATER_SETTINGS_KEY,
      JSON.stringify({ autoCheck: false, notify: false }),
    )
    const { bridge, emit } = mountBridge()
    renderSettings()
    await settle()

    expect(
      screen.queryByRole('button', { name: 'Download update' }),
    ).not.toBeInTheDocument()

    await act(async () => {
      emit({ phase: 'available', version: '1.1.0' })
    })

    await user.click(screen.getByRole('button', { name: 'Download update' }))
    expect(bridge.download).toHaveBeenCalledTimes(1)
  })
})

describe('Update note', () => {
  it('opens by itself when a new version arrives and downloads from the note', async () => {
    const user = userEvent.setup()
    const { bridge, emit } = mountBridge()
    renderSettings()
    await settle()

    await act(async () => {
      emit({
        phase: 'available',
        version: '1.1.0',
        releaseNotes: 'A quieter winter.',
        checkedAt: 1_760_000_000_000,
      })
    })

    const note = await screen.findByRole('dialog')
    expect(
      within(note).getByText('Version 1.1.0 is here'),
    ).toBeVisible()
    expect(within(note).getByText('A quieter winter.')).toBeVisible()

    await user.click(within(note).getByRole('button', { name: 'Download update' }))
    expect(bridge.download).toHaveBeenCalledTimes(1)
  })

  it('stays quiet when notifications are off', async () => {
    window.localStorage.setItem(
      UPDATER_SETTINGS_KEY,
      JSON.stringify({ autoCheck: true, notify: false }),
    )
    const { emit } = mountBridge()
    renderSettings()
    await settle()

    await act(async () => {
      emit({ phase: 'available', version: '1.1.0' })
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    /* The trigger still says there is something waiting. */
    expect(
      screen.getByRole('button', { name: 'Update available: version 1.1.0' }),
    ).toBeVisible()
  })

  it('Later dismisses one version but not the next', async () => {
    const user = userEvent.setup()
    /*
      Notifications on: this is the only configuration in which `Later` has
      anything to dismiss, and the assertion has to survive the auto-check
      finding the same version again (checking -> available).
    */
    const { emit } = mountBridge()
    renderSettings()
    await settle()

    await act(async () => {
      emit({ phase: 'available', version: '1.1.0' })
    })

    const note = await screen.findByRole('dialog')
    await user.click(within(note).getByRole('button', { name: 'Later' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    /* The same version comes back from a check: still dismissed. */
    await act(async () => {
      emit({ phase: 'checking' })
    })
    await act(async () => {
      emit({ phase: 'available', version: '1.1.0' })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    /* A different version is a new prompt. */
    await act(async () => {
      emit({ phase: 'available', version: '1.2.0' })
    })
    expect(await screen.findByRole('dialog')).toBeVisible()
  })

  it('treats a desktop shell without a channel as unsupported', async () => {
    mountBridge({
      phase: 'unsupported',
      message: 'This build cannot update itself.',
    })
    renderSettings()
    await settle()

    expect(
      screen.getByRole('switch', { name: /Check for updates automatically/ }),
    ).toBeDisabled()
    expect(screen.getByText('This build cannot update itself.')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Updates' }),
    ).not.toBeInTheDocument()
  })

  it('restarts from the note once the download is done', async () => {
    const user = userEvent.setup()
    const { bridge, emit } = mountBridge()
    renderSettings()
    await settle()

    await act(async () => {
      emit({ phase: 'ready', version: '1.1.0', percent: 100 })
    })

    const note = await screen.findByRole('dialog')
    await user.click(
      within(note).getByRole('button', { name: 'Restart and update' }),
    )
    expect(bridge.install).toHaveBeenCalledTimes(1)
  })

  it('keeps the restart on offer when the install fails, and says why', async () => {
    const { emit } = mountBridge()
    renderSettings()
    await settle()

    const message =
      'The package manager could not install the update. Update from a terminal, or install the new .deb by hand.'
    await act(async () => {
      emit({ phase: 'ready', version: '1.1.0', percent: 100, message })
    })

    const note = await screen.findByRole('dialog')
    expect(within(note).getByText(message)).toBeVisible()
    expect(
      within(note).getByRole('button', { name: 'Restart and update' }),
    ).toBeVisible()
  })

  it('answers the desktop menu by opening the note and checking', async () => {
    const { bridge, requestCheck } = mountBridge()
    renderSettings()
    await settle()

    await act(async () => {
      requestCheck()
    })

    expect(bridge.check).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('dialog')).toBeVisible()
  })
})
