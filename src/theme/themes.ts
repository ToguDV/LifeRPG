export type ThemeKey =
  | 'pergamino'
  | 'chalk'
  | 'catppuccin'
  | 'dracula'
  | 'nord'
  | 'gruvbox'
  | 'rosepine'
  | 'tokyonight'

export type PaperMode = 'light' | 'dark'

export interface ThemeDefinition {
  key: ThemeKey
  label: string
  meta: string
  paper: PaperMode
  /** [desk, paper, ink, accent] — used by the picker swatches. */
  swatches: readonly [string, string, string, string]
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    key: 'pergamino',
    label: 'Pergamino',
    meta: 'Tinta & cera',
    paper: 'light',
    swatches: ['#2c2e28', '#e6e0d0', '#34312a', '#7f3c31'],
  },
  {
    key: 'chalk',
    label: 'Tiza',
    meta: 'Cartulina negra',
    paper: 'dark',
    swatches: ['#050605', '#191a13', '#e9e6da', '#d19a86'],
  },
  {
    key: 'catppuccin',
    label: 'Catppuccin',
    meta: 'Mocha',
    paper: 'dark',
    swatches: ['#11111b', '#1e1e2e', '#cdd6f4', '#cba6f7'],
  },
  {
    key: 'dracula',
    label: 'Dracula',
    meta: 'Noche púrpura',
    paper: 'dark',
    swatches: ['#191a21', '#282a36', '#f8f8f2', '#bd93f9'],
  },
  {
    key: 'nord',
    label: 'Nord',
    meta: 'Frío polar',
    paper: 'dark',
    swatches: ['#242933', '#2e3440', '#eceff4', '#88c0d0'],
  },
  {
    key: 'gruvbox',
    label: 'Gruvbox',
    meta: 'Cuero & ámbar',
    paper: 'dark',
    swatches: ['#1d2021', '#282828', '#ebdbb2', '#fabd2f'],
  },
  {
    key: 'rosepine',
    label: 'Rosé Pine',
    meta: 'Rosa marchita',
    paper: 'dark',
    swatches: ['#191724', '#232136', '#e0def4', '#eb6f92'],
  },
  {
    key: 'tokyonight',
    label: 'Tokyo Night',
    meta: 'Neón velado',
    paper: 'dark',
    swatches: ['#16161e', '#1a1b26', '#c0caf5', '#7aa2f7'],
  },
] as const

export const DEFAULT_THEME: ThemeKey = 'pergamino'
export const THEME_STORAGE_KEY = 'liferpg-ui-theme'

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return THEMES.some((theme) => theme.key === value)
}

export function getTheme(key: ThemeKey): ThemeDefinition {
  return THEMES.find((theme) => theme.key === key) ?? THEMES[0]
}
