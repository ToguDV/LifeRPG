import { useEffect } from 'react'
import { ToastProvider } from './components/Toast/Toast'
import { TornSilhouette } from './components/Ornaments/TornSilhouette'
import { GalleryPage } from './gallery/GalleryPage'
import { JournalPage } from './journal/JournalPage'
import { SettingsPage } from './settings/SettingsPage'
import { ThemeProvider } from './theme/ThemeProvider'
import { UpdaterProvider } from './updater/UpdaterProvider'

type Screen = 'journal' | 'gallery' | 'settings'

const TITLES: Record<Screen, string> = {
  journal: 'LifeRPG — The journal',
  gallery: 'LifeRPG — UI Codex',
  settings: 'LifeRPG — Settings',
}

function readScreen(): Screen {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path === '/gallery') return 'gallery'
  if (path === '/settings') return 'settings'
  return 'journal'
}

export function App() {
  const screen = readScreen()

  useEffect(() => {
    document.title = TITLES[screen]
  }, [screen])

  return (
    <ThemeProvider>
      <ToastProvider>
        {/* Last, so the update note can use the toasts and the theme. */}
        <UpdaterProvider>
          <TornSilhouette />
          {screen === 'gallery' ? (
            <GalleryPage />
          ) : screen === 'settings' ? (
            <SettingsPage />
          ) : (
            <JournalPage />
          )}
        </UpdaterProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
