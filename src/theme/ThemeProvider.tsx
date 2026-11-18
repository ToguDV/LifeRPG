import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  getTheme,
  isThemeKey,
  type ThemeDefinition,
  type ThemeKey,
} from './themes'

interface ThemeContextValue {
  theme: ThemeKey
  definition: ThemeDefinition
  themes: readonly ThemeDefinition[]
  setTheme: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeKey {
  if (typeof document === 'undefined') return DEFAULT_THEME

  const fromDom = document.documentElement.getAttribute('data-theme')
  if (isThemeKey(fromDom)) return fromDom

  try {
    const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeKey(fromStorage)) return fromStorage
  } catch {
    /* storage can be unavailable in private contexts */
  }

  return DEFAULT_THEME
}

function writeThemeAttributes(key: ThemeKey) {
  const definition = getTheme(key)
  const root = document.documentElement
  root.setAttribute('data-theme', definition.key)
  root.setAttribute('data-paper', definition.paper)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(readStoredTheme)

  useEffect(() => {
    writeThemeAttributes(theme)
  }, [theme])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isThemeKey(event.newValue)) {
        setThemeState(event.newValue)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((key: ThemeKey) => {
    if (!isThemeKey(key)) return

    const root = document.documentElement
    root.classList.add('theme-switching')
    setThemeState(key)
    writeThemeAttributes(key)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, key)
    } catch {
      /* noop */
    }

    const unlock = () => root.classList.remove('theme-switching')
    requestAnimationFrame(() => requestAnimationFrame(unlock))
    window.setTimeout(unlock, 400)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      definition: getTheme(theme),
      themes: THEMES,
      setTheme,
    }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}
