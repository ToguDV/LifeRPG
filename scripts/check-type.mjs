#!/usr/bin/env node
/*
  Type floor guard rail.

  The tokens cannot enforce themselves: `Card`'s description went to 13px and
  the handwritten notes to 13px while `--text-prose` existed, so `pnpm lint`
  now fails when a rule meant to be read goes under the floor.

  Three rules, all resolved against `primitives.css`:

  - no `--text-*` token may be defined below 14px (the floor, DESIGN.md §6.2);
  - no `font-size` in a CSS module may resolve below 14px, and none may skip
    the scale: the token is the only way to set type;
  - an italic note (`font-style: italic` on the body face) declares its size
    with `--text-note-sm` or `--text-note`, never with the floor step;
  - a reading selector (`description`, `hint`, `message`, `aside`…) resolves
    to at least 15px, one step above the floor.
*/
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url)
const TOKENS = new URL('../src/styles/tokens/primitives.css', import.meta.url)

/* the floor in px: nothing in the kit is set below it. */
const FLOOR_PX = 14
/* floor for a reading selector; the hand rule uses its own check. */
const READING = /(description|hint|message|groupMessage|labelAside|confirmText|aside|shelfNote|issue)/i
const HAND_SIZES = new Set(['--text-note-sm', '--text-note'])
const MIN_PROSE_PX = 15

/* `--text-decoration-width` is geometry, not the scale: keep it out. */
const SCALE = /^--text-(2xs|xs|sm|base|md|lg|xl|[2-6]xl|prose|note-sm|note)$/

const primitives = readFileSync(TOKENS, 'utf8')
const pxOf = new Map()
for (const [, name, value] of primitives.matchAll(/--text-([\w-]+):\s*([\d.]+)rem/g)) {
  const token = `--text-${name}`
  if (SCALE.test(token)) pxOf.set(token, Number(value) * 16)
}

const problems = []

for (const [token, px] of pxOf) {
  if (px < FLOOR_PX) {
    problems.push(
      `primitives.css: ${token} is ${px}px, under the ${FLOOR_PX}px floor`,
    )
  }
}

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (path.endsWith('.module.css')) files.push(path)
  }
}
walk(new URL('../src', import.meta.url).pathname)

for (const file of files) {
  const css = readFileSync(file, 'utf8')
  const where = relative(ROOT.pathname, file)
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const size = body.match(/font-size:\s*([^;]+);/)
    if (!size) continue
    const value = size[1].trim()
    const tokens = [...value.matchAll(/var\((--text-[\w-]+)\)/g)].map((m) => m[1])
    const name = value.match(/^var\((--text-[\w-]+)\)$/)?.[1]

    if (tokens.length === 0) {
      problems.push(`${where}: ${selector.trim()} sets font-size: ${value} without a --text-* token`)
      continue
    }

    if (/font-style:\s*italic/.test(body) && /font-family:\s*var\(--font-body\)/.test(body)) {
      if (!name || !HAND_SIZES.has(name)) {
        problems.push(`${where}: ${selector.trim()} is an italic note at ${value} (use --text-note-sm or --text-note)`)
      }
      continue
    }

    const sizes = tokens.map((token) => pxOf.get(token)).filter((px) => px !== undefined)
    const smallest = Math.min(...sizes)
    if (smallest < FLOOR_PX) {
      problems.push(`${where}: ${selector.trim()} is ${value} (${smallest}px), under the ${FLOOR_PX}px floor`)
      continue
    }

    if (READING.test(selector) && smallest < MIN_PROSE_PX) {
      problems.push(`${where}: ${selector.trim()} is ${value} (${smallest}px) but must be read (floor ${MIN_PROSE_PX}px)`)
    }
  }
}

if (problems.length > 0) {
  console.error('Type floor broken:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error(
    `\nSee DESIGN.md §6.2: nothing below ${FLOOR_PX}px (--text-xs), ` +
      '--text-prose (15px) for anything meant to be read, ' +
      '--text-note-sm/--text-note (16/18px) for an italic note.',
  )
  process.exit(1)
}

console.log(
  `type floor: ${files.length} CSS modules, ${pxOf.size} scale steps, ` +
    `nothing under ${FLOOR_PX}px, prose at ${MIN_PROSE_PX}px.`,
)
