import { describe, expect, it } from 'vitest'
import { THEMES } from '../src/theme/themes'

/*
  The theme contract (RELEASE-REVIEW M-7): `vite.config.ts` serialises
  `THEMES` into the `index.html` boot script, so a renamed, added or dropped
  palette falls back to the Pergamino `:root` values and nothing fails.

  The stylesheets are read from disk, never imported: Vitest hands a `.css`
  import an empty module, so a `?raw` glob cannot see them. `@types/node` is
  not a direct dependency, so the specifier is assembled at runtime and only
  the two calls below are typed.
*/
const FS = 'node:fs'
const fs = (await import(FS)) as {
  readFileSync: (path: string, encoding: 'utf8') => string
  readdirSync: (path: string, options: { recursive: true }) => string[]
}

/** `tests/../src/`: the tree the app is built from. */
const SRC = `${import.meta.dirname}/../src/`

const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

const sources = (extension: string): string[] =>
  fs
    .readdirSync(SRC, { recursive: true })
    .filter((file) => file.endsWith(extension))
    .map((file) => fs.readFileSync(`${SRC}${file}`, 'utf8'))

const STYLESHEETS = sources('.css').map(stripComments)
const COMPONENTS = sources('.ts').concat(sources('.tsx'))
const THEMES_CSS = stripComments(fs.readFileSync(`${SRC}styles/tokens/themes.css`, 'utf8'))

/* `themes.css` has no at-rules and no nested selectors: `selector { body }` is its whole grammar. */
const RULES = [...THEMES_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].trim(),
  body: match[2],
}))

const declaredIn = (body: string) =>
  [...body.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((match) => match[1])

const valueIn = (body: string, name: string) =>
  new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(body)?.[1].trim()

/*
  A theme's palette block is the first rule carrying its attribute; later
  `[data-theme="…"]` rules patch the shared `--ui-*` bindings (Nord's lighter
  paper accent), so they are not a second palette.
*/
const palettes = new Map<string, string>()
const mentioned = new Set<string>()
for (const rule of RULES) {
  for (const match of rule.selector.matchAll(/\[data-theme="([a-z]+)"\]/g)) {
    mentioned.add(match[1])
    if (!palettes.has(match[1])) palettes.set(match[1], rule.body)
  }
}

const KEYS = THEMES.map((theme) => theme.key)

/*
  Set by React as inline styles, so no stylesheet declares them: Slider writes
  its thumb offsets and the value bubble's position. ProgressBar and the
  Questline trail use plain style and SVG attributes, so they need no entry.
*/
const RUNTIME_INLINE = ['--start', '--end', '--percent']

describe('theme contract', () => {
  it('gives every theme in themes.ts a palette block and nothing else', () => {
    expect([...mentioned].sort()).toEqual([...KEYS].sort())
    expect([...palettes.keys()].sort()).toEqual([...KEYS].sort())
  })

  it('declares exactly the same custom properties in every palette', () => {
    const sets = KEYS.map((key) => declaredIn(palettes.get(key) ?? '').sort())
    expect(sets[0]).not.toHaveLength(0)
    KEYS.forEach((key, index) => {
      expect(sets[index], `${key} vs. ${KEYS[0]}`).toEqual(sets[0])
    })
  })

  it('resolves every custom property consumed under src/', () => {
    const declared = new Set(STYLESHEETS.flatMap(declaredIn))
    const consumed = new Set(
      [...STYLESHEETS, ...COMPONENTS].flatMap((text) =>
        [...text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((match) => match[1]),
      ),
    )

    /* Component modules declare their own scoped variables (Switch, Surface, WaxSeal). */
    const unresolved = [...consumed]
      .filter((name) => !declared.has(name) && !RUNTIME_INLINE.includes(name))
      .sort()
    expect(unresolved).toEqual([])

    /* The semantic layer is the palettes' job: an undeclared `--ui-*` is a silent fallback. */
    const themeTokens = new Set(declaredIn(THEMES_CSS))
    const strayUi = [...consumed].filter(
      (name) => name.startsWith('--ui-') && !themeTokens.has(name),
    )
    expect(strayUi).toEqual([])

    /* The allow-list cannot rot: each name still has to be written by a component. */
    for (const name of RUNTIME_INLINE) {
      expect(
        COMPONENTS.some((text) => text.includes(`'${name}'`)),
        `${name} is no longer set inline`,
      ).toBe(true)
    }
  })

  it('keeps every picker swatch equal to the token it names', () => {
    const claimed = new Map<string, string[]>()
    const rows = fs
      .readFileSync(`${SRC}theme/themes.ts`, 'utf8')
      .matchAll(/key: '([a-z]+)',[\s\S]*?\/\/ ([^\n]+)\n\s*swatches: /g)
    for (const match of rows) {
      claimed.set(match[1], match[2].split('·').map((token) => token.trim()))
    }

    for (const theme of THEMES) {
      const tokens = claimed.get(theme.key) ?? []
      expect(tokens, `${theme.key} names its four tokens`).toHaveLength(4)
      const body = palettes.get(theme.key) ?? ''
      expect(
        tokens.map((token) => valueIn(body, token)),
        `${theme.key} swatches`,
      ).toEqual([...theme.swatches])
    }
  })
})
