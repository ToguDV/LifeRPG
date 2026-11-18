import { ToastProvider } from './components/Toast/Toast'
import { TornFilters } from './components/Ornaments/TornFilters'
import { GalleryPage } from './gallery/GalleryPage'
import { ThemeProvider } from './theme/ThemeProvider'

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TornFilters />
        <GalleryPage />
      </ToastProvider>
    </ThemeProvider>
  )
}
