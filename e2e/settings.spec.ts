import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../src/theme/themes'
import {
  auditPage,
  expectNoViolations,
  reportIncomplete,
  setTheme,
} from './support/gallery'

/*
  The settings screen in the browser build. There is no preload bridge here,
  so the update controls are the disabled, honest version: the suite checks
  that states are said out loud instead of that the download works — that
  half lives in the unit suite against a fake bridge.
*/

async function gotoSettings(page: Page): Promise<void> {
  await page.goto('/settings')
  /* Every screen renders `main#content`: the heading is what proves the route. */
  await expect(
    page.getByRole('heading', { level: 1, name: 'Settings' }),
  ).toBeVisible()
  await page.evaluate(() => document.fonts.ready.then(() => true))
}

test.describe('settings · 8 themes', () => {
  for (const theme of THEMES) {
    test(theme.key, async ({ page }, testInfo) => {
      await gotoSettings(page)
      await setTheme(page, theme)

      const results = await auditPage(page)
      await reportIncomplete(results, testInfo, `settings · ${theme.label}`)
      expectNoViolations(results.violations, `settings · ${theme.label}`)
    })
  }
})

test.describe('settings · layout and state', () => {
  test('no horizontal scroll from 320 to 1440', async ({ page }) => {
    for (const width of [320, 375, 480, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await gotoSettings(page)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })

  test('a browser copy cannot update itself and says why', async ({ page }) => {
    await gotoSettings(page)

    for (const name of [
      /Check for updates automatically/,
      /Tell me about new versions/,
    ]) {
      await expect(page.getByRole('switch', { name })).toBeDisabled()
    }

    await expect(
      page.getByText('Updates are only in the desktop app.'),
    ).toBeVisible()

    /* No shell, no update trigger in the topbar. */
    await expect(page.getByRole('button', { name: 'Updates' })).toHaveCount(0)
  })

  test('the journal and the codex both reach settings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })

    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Settings' })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Codex' })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'The Winter Kit' }),
    ).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Main sections' })
      .getByRole('link', { name: 'Settings' })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeVisible()
  })
})
