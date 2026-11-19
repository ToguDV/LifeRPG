#!/usr/bin/env node
/*
  Documentation guard rail.

  AGENTS.md tends to grow into a file inventory that duplicates the repository
  and ages badly. This script fails `pnpm lint` if the file goes over budget,
  grows tables or piles up new sections.

  The budget is deliberately small. If more is genuinely needed, raise it here
  by hand: that second step is what stops the growth.
*/
import { readFileSync } from 'node:fs'

const FILE = new URL('../AGENTS.md', import.meta.url)
const MAX_LINES = 90
const MAX_CHARS = 8000
const MAX_SECTIONS = 6

const text = readFileSync(FILE, 'utf8')
const lines = text.split('\n')
if (lines.at(-1) === '') lines.pop()

const problems = []

if (lines.length > MAX_LINES) {
  problems.push(`${lines.length} lines (budget ${MAX_LINES})`)
}

if (text.length > MAX_CHARS) {
  problems.push(`${text.length} characters (budget ${MAX_CHARS})`)
}

const tables = lines
  .map((line, index) => ({ number: index + 1, line }))
  .filter(({ line }) => /^\s*\|/.test(line))
if (tables.length > 0) {
  problems.push(
    `${tables.length} table line(s), first on line ${tables[0].number}: ` +
      'link to the file instead of inventorying it',
  )
}

const sections = lines.filter((line) => /^## /.test(line))
if (sections.length > MAX_SECTIONS) {
  problems.push(`${sections.length} "##" sections (max ${MAX_SECTIONS})`)
}

if (problems.length > 0) {
  console.error('AGENTS.md is over budget:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nMove the detail to README.md or DESIGN.md, link instead of copying,')
  console.error('or cut what an agent would discover by exploring the repository.')
  process.exit(1)
}

console.log(
  `AGENTS.md: ${lines.length}/${MAX_LINES} lines, ${text.length}/${MAX_CHARS} characters, ` +
    `${sections.length}/${MAX_SECTIONS} sections.`,
)
