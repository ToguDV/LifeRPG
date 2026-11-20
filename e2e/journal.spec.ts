import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../src/theme/themes'
import {
  auditPage,
  expectNoViolations,
  reportIncomplete,
  setTheme,
} from './support/gallery'

async function gotoJournal(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('main#content')).toBeVisible()
  await page.evaluate(() => document.fonts.ready.then(() => true))
}

test.describe('journal · 8 themes', () => {
  for (const theme of THEMES) {
    test(theme.key, async ({ page }, testInfo) => {
      await gotoJournal(page)
      await setTheme(page, theme)

      const results = await auditPage(page)
      await reportIncomplete(results, testInfo, `journal · ${theme.label}`)
      expectNoViolations(results.violations, `journal · ${theme.label}`)
    })
  }
})

test.describe('journal · layout and state', () => {
  test('no horizontal scroll from 320 to 1440', async ({ page }) => {
    for (const width of [320, 375, 480, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await gotoJournal(page)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })

  test('a task survives a reload and keeps its checked state', async ({ page }) => {
    await gotoJournal(page)

    const input = page.getByRole('textbox', { name: 'New task' })
    await input.fill('Sharpen the axe')
    await input.press('Enter')

    const checkbox = page.getByRole('checkbox', { name: /Sharpen the axe/ })
    await expect(checkbox).toBeVisible()

    await page.reload()
    await expect(page.locator('main#content')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Sharpen the axe/ })).toBeVisible()

    await page.getByText('Sharpen the axe', { exact: true }).click()
    await expect(page.getByRole('checkbox', { name: /Sharpen the axe/ })).toBeChecked()

    await page.reload()
    await expect(page.locator('main#content')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Sharpen the axe/ })).toBeChecked()
  })
})
