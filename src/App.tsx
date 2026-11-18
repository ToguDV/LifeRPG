import { ToastProvider } from './components/Toast/Toast'
import { TornSilhouette } from './components/Ornaments/TornSilhouette'
import { GalleryPage } from './gallery/GalleryPage'
import { ThemeProvider } from './theme/ThemeProvider'

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TornSilhouette />
        <GalleryPage />
      </ToastProvider>
    </ThemeProvider>
  )
}
