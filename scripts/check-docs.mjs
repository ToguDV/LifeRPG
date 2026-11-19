#!/usr/bin/env node
/*
  Guardarraíl de documentación.

  AGENTS.md tiende a crecer hasta convertirse en un inventario de archivos que
  duplica el repositorio y envejece mal. Este script falla `pnpm lint` si se
  pasa del presupuesto, si le salen tablas o si acumula secciones nuevas.

  El presupuesto es deliberadamente pequeño. Si de verdad hace falta más,
  súbelo aquí a mano: ese segundo paso es el que frena el crecimiento.
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
  problems.push(`${lines.length} líneas (presupuesto ${MAX_LINES})`)
}

if (text.length > MAX_CHARS) {
  problems.push(`${text.length} caracteres (presupuesto ${MAX_CHARS})`)
}

const tables = lines
  .map((line, index) => ({ number: index + 1, line }))
  .filter(({ line }) => /^\s*\|/.test(line))
if (tables.length > 0) {
  problems.push(
    `${tables.length} línea(s) de tabla, la primera en la ${tables[0].number}: ` +
      'enlaza al archivo en vez de inventariarlo',
  )
}

const sections = lines.filter((line) => /^## /.test(line))
if (sections.length > MAX_SECTIONS) {
  problems.push(`${sections.length} secciones «##» (máximo ${MAX_SECTIONS})`)
}

if (problems.length > 0) {
  console.error('AGENTS.md fuera de presupuesto:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nMueve el detalle a README.md o DESIGN.md, enlaza en vez de copiar,')
  console.error('o recorta lo que un agente descubriría explorando el repositorio.')
  process.exit(1)
}

console.log(
  `AGENTS.md: ${lines.length}/${MAX_LINES} líneas, ${text.length}/${MAX_CHARS} caracteres, ` +
    `${sections.length}/${MAX_SECTIONS} secciones.`,
)
