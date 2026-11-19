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
  /** [desk, paper, ink, accent] — mirrors raw tokens of `themes.css`; see below. */
  swatches: readonly [string, string, string, string]
}

/*
  `swatches` is the one sanctioned copy of the raw palette, which otherwise
  lives only in `src/styles/tokens/themes.css` (DESIGN.md §3.5). The picker
  previews themes that are not applied, so it cannot read the live custom
  properties; the hexes are the contract. Slots, in order:

    desk   — the board behind the page (--stone-0, --panel-1 in Parchment)
    paper  — --parch
    ink    — --ink
    accent — the theme's headline accent (--crimson, --chalk-rouge, --bronze)

  The comment above each row names the exact tokens. Retouching a palette
  means updating both files in the same change.
*/
export const THEMES: readonly ThemeDefinition[] = [
  {
    key: 'pergamino',
    label: 'Parchment',
    meta: 'Ink & wax',
    paper: 'light',
    // --panel-1 · --parch · --ink · --crimson
    swatches: ['#2c2e28', '#e6e0d0', '#34312a', '#7f3c31'],
  },
  {
    key: 'chalk',
    label: 'Chalk',
    meta: 'Black card stock',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --chalk-rouge
    swatches: ['#050605', '#191a13', '#e9e6da', '#d19a86'],
  },
  {
    key: 'catppuccin',
    label: 'Catppuccin',
    meta: 'Mocha',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --bronze
    swatches: ['#11111b', '#1e1e2e', '#cdd6f4', '#cba6f7'],
  },
  {
    key: 'dracula',
    label: 'Dracula',
    meta: 'Purple night',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --bronze
    swatches: ['#191a21', '#282a36', '#f8f8f2', '#bd93f9'],
  },
  {
    key: 'nord',
    label: 'Nord',
    meta: 'Polar cold',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --bronze
    swatches: ['#242933', '#2e3440', '#eceff4', '#88c0d0'],
  },
  {
    key: 'gruvbox',
    label: 'Gruvbox',
    meta: 'Leather & amber',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --bronze-soft
    swatches: ['#1d2021', '#282828', '#ebdbb2', '#fabd2f'],
  },
  {
    key: 'rosepine',
    label: 'Rosé Pine',
    meta: 'Faded rose',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --crimson
    swatches: ['#191724', '#232136', '#e0def4', '#eb6f92'],
  },
  {
    key: 'tokyonight',
    label: 'Tokyo Night',
    meta: 'Veiled neon',
    paper: 'dark',
    // --stone-0 · --parch · --ink · --bronze
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
