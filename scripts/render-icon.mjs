/*
  Renders `build/icon.svg` to the 512 px PNG that electron-builder derives the
  .ico and the Linux icon set from. The PNG is committed so packaging never
  needs a renderer; run `pnpm build:icon` after editing the SVG.
*/
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const svgPath = fileURLToPath(new URL('../build/icon.svg', import.meta.url))
const pngPath = fileURLToPath(new URL('../build/icon.png', import.meta.url))

const svg = await readFile(svgPath, 'utf8')
const browser = await chromium.launch()

try {
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  })

  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`,
  )
  await page.screenshot({ path: pngPath, omitBackground: true })
} finally {
  await browser.close()
}

console.log('build/icon.png rendered from build/icon.svg')
