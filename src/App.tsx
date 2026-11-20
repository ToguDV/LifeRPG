import { useEffect } from 'react'
import { ToastProvider } from './components/Toast/Toast'
import { TornSilhouette } from './components/Ornaments/TornSilhouette'
import { GalleryPage } from './gallery/GalleryPage'
import { JournalPage } from './journal/JournalPage'
import { ThemeProvider } from './theme/ThemeProvider'

function isGallery(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path === '/gallery'
}

export function App() {
  const gallery = isGallery()

  useEffect(() => {
    document.title = gallery ? 'LifeRPG — UI Codex' : 'LifeRPG — The journal'
  }, [gallery])

  return (
    <ThemeProvider>
      <ToastProvider>
        <TornSilhouette />
        {gallery ? <GalleryPage /> : <JournalPage />}
      </ToastProvider>
    </ThemeProvider>
  )
}
