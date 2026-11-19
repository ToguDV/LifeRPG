#!/usr/bin/env node
/*
  Type floor guard rail.

  The tokens cannot enforce themselves: `Card`'s description went to 13px and
  the handwritten notes to 13px while `--text-prose` existed, so `pnpm lint`
  now fails when a rule meant to be read goes under the floor.

  Two rules, both resolved against `primitives.css`:

  - a `--font-hand` rule declares its size with `--text-note-sm` or
    `--text-note` (Caveat's x-height is 0.36em; 13px reads as 10px);
  - a reading selector (`description`, `hint`, `message`, `aside`…) resolves
    to at least 15px.

  Uppercase engraved metadata (`--text-2xs`, `--text-xs`) is out of scope on
  purpose: DESIGN.md §6.2 keeps 11px for it.
*/
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url)
const TOKENS = new URL('../src/styles/tokens/primitives.css', import.meta.url)

/* floor in px for a reading selector; the hand rule uses its own check. */
const READING = /(description|hint|message|groupMessage|labelAside|confirmText|aside|shelfNote|issue)/i
const HAND_SIZES = new Set(['--text-note-sm', '--text-note'])
const MIN_PROSE_PX = 15

const primitives = readFileSync(TOKENS, 'utf8')
const pxOf = new Map()
for (const [, name, value] of primitives.matchAll(/--text-([\w-]+):\s*([\d.]+)rem/g)) {
  pxOf.set(`--text-${name}`, Number(value) * 16)
}
pxOf.set('--text-base', 15)

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (path.endsWith('.module.css')) files.push(path)
  }
}
walk(new URL('../src', import.meta.url).pathname)

const problems = []

for (const file of files) {
  const css = readFileSync(file, 'utf8')
  const where = relative(ROOT.pathname, file)
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const size = body.match(/font-size:\s*([^;]+);/)
    if (!size) continue
    const value = size[1].trim()
    const name = value.match(/^var\((--text-[\w-]+)\)$/)?.[1]

    if (/font-family:\s*var\(--font-hand\)/.test(body)) {
      if (!name || !HAND_SIZES.has(name)) {
        problems.push(`${where}: ${selector.trim()} uses ${value} on Caveat (use --text-note-sm or --text-note)`)
      }
      continue
    }

    if (READING.test(selector) && name) {
      const px = pxOf.get(name)
      if (px !== undefined && px < MIN_PROSE_PX) {
        problems.push(`${where}: ${selector.trim()} is ${name} (${px}px) but must be read (floor ${MIN_PROSE_PX}px)`)
      }
    }
  }
}

if (problems.length > 0) {
  console.error('Type floor broken:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nSee DESIGN.md §6.2: --text-prose (15px) for prose, --text-note-sm/--text-note (16/18px) for Caveat.')
  process.exit(1)
}

console.log(`type floor: ${files.length} CSS modules, ${HAND_SIZES.size} note steps, prose at ${MIN_PROSE_PX}px.`)
