import { expect, test, type Page } from '@playwright/test'
import { gotoGallery } from './support/gallery'
import {
  openMilestone,
  panelEditor,
  panelEditorToggle,
  panelHeading,
  settle,
} from './support/questline'

const WIDTHS = [320, 375, 480, 768, 1024, 1440] as const
const VIEWPORT_HEIGHT = 900

/*
  A 60-character milestone title with no spaces. It is typed through the
  real editor, so the test covers the same path a user would take. The note
  is read-only on purpose (REVISION.md Q-10); the title is the editable
  long-text field.
*/
const NO_SPACE_TITLE = 'ArchivoSinEspacios'.repeat(4).slice(0, 60)

interface OverflowOffender {
  selector: string
  left: number
  right: number
  width: number
}

interface OverflowReport {
  scrollWidth: number
  innerWidth: number
  offenders: OverflowOffender[]
}

/**
 * Measures the document and every visible element. Elements clipped by an
 * ancestor with `overflow-x: hidden|clip|auto|scroll` are ignored: the
 * atmosphere layers deliberately clip their own decoration, and a scroll
 * container that fits the viewport does not make the page overflow.
 */
async function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    const describe = (element: Element): string => {
      const tag = element.tagName.toLowerCase()
      const id = element.id ? `#${element.id}` : ''
      const classes =
        typeof element.className === 'string'
          ? element.className
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((name) => `.${name}`)
              .join('')
          : ''
      const label = element.getAttribute('aria-label')
      const suffix = label ? `[aria-label="${label}"]` : ''
      return `${tag}${id}${classes}${suffix}`
    }

    const clippedByAncestor = (element: Element): boolean => {
      let ancestor = element.parentElement
      while (ancestor && ancestor !== document.documentElement) {
        const style = getComputedStyle(ancestor)
        const overflowX = style.overflowX
        if (
          overflowX === 'hidden' ||
          overflowX === 'clip' ||
          overflowX === 'auto' ||
          overflowX === 'scroll'
        ) {
          const rect = ancestor.getBoundingClientRect()
          if (rect.left >= -1 && rect.right <= window.innerWidth + 1) {
            return true
          }
        }
        ancestor = ancestor.parentElement
      }
      return false
    }

    const offenders: OverflowOffender[] = []
    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element)
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0
      ) {
        continue
      }

      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      if (rect.right <= window.innerWidth + 1 && rect.left >= -1) continue
      if (clippedByAncestor(element)) continue

      offenders.push({
        selector: describe(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      })
    }

    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      offenders,
    }
  })
}

async function expectNoOverflow(
  page: Page,
  width: number,
  label: string,
): Promise<void> {
  const metrics = await measureOverflow(page)
  const detail = JSON.stringify(metrics.offenders, null, 2)

  expect
    .soft(
      metrics.scrollWidth,
      `${label} @ ${width}px: documentElement.scrollWidth ${metrics.scrollWidth} > innerWidth ${metrics.innerWidth}.\nElements outside the viewport:\n${detail}`,
    )
    .toBeLessThanOrEqual(metrics.innerWidth + 1)

  expect
    .soft(
      metrics.offenders,
      `${label} @ ${width}px: ${metrics.offenders.length} visible element(s) exceed the viewport.\n${detail}`,
    )
    .toEqual([])
}

async function measureAt(
  page: Page,
  label: string,
): Promise<void> {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
    await settle(page)
    await expectNoOverflow(page, width, label)
  }
}

test.describe('horizontal overflow', () => {
  test('full gallery', async ({ page }) => {
    await gotoGallery(page)
    await measureAt(page, 'full gallery')
  })

  test('Questline with the panel open', async ({ page }) => {
    await gotoGallery(page)
    await openMilestone(page)
    await measureAt(page, 'Questline · panel open')
  })

  test('milestone with an unbroken title', async ({ page }) => {
    await gotoGallery(page)
    const { panel } = await openMilestone(page)

    await panelEditorToggle(panel).click()
    const editor = panelEditor(panel)
    await editor.locator('input').first().fill(NO_SPACE_TITLE)
    await editor.locator('button[type="submit"]').click()
    await expect(editor).toBeHidden()
    await expect(panelHeading(panel)).toHaveText(NO_SPACE_TITLE)
    await settle(page)

    await measureAt(page, 'Questline · unbroken title')
  })
})
