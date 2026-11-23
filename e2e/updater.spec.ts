import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { THEMES } from '../src/theme/themes'
import {
  auditPage,
  expectNoViolations,
  reportIncomplete,
  setTheme,
} from './support/gallery'

/*
  The update note only exists behind the preload bridge, so the browser suite
  never sees it: `UpdateBadge` returns null without `window.liferpg`. These
  tests install a stub bridge before the page boots, which is enough for the
  real note to mount, and then judge it in Chromium the way AGENTS.md asks:
  axe in every theme, no overflow, and a keyboard route in and out.

  The stub is not the app: it never checks GitHub and never installs
  anything. It only holds one snapshot and hands it to `getState`/`onState`.
*/

const NOTE = {
  phase: 'available',
  currentVersion: '0.1.0',
  version: '0.2.0',
  percent: null as number | null,
  transferred: null as number | null,
  total: null as number | null,
  message: null as string | null,
  releaseNotes:
    'The route keeps its place when the window narrows.\nNew wax seals for finished milestones.\nSmaller fixes for the date picker.',
  checkedAt: 1_795_392_000_000,
}

function stubBridge(state: Record<string, unknown>): string {
  return `
    (() => {
      let state = ${JSON.stringify(state)};
      window.liferpg = {
        updater: {
          getState: async () => state,
          check: async () => state,
          download: async () => state,
          install: async () => true,
          onState: () => () => {},
          onCheckRequested: () => () => {},
        },
      };
    })();
  `
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => true))
}

test.describe('update note · 8 themes', () => {
  for (const theme of THEMES) {
    test(theme.key, async ({ page }, testInfo: TestInfo) => {
      await page.addInitScript(stubBridge(NOTE))
      await page.goto('/settings')

      /* Choosing a theme closes the note (outside click), so reload to reopen it. */
      await setTheme(page, theme)
      await page.reload()

      const note = page.getByRole('dialog')
      await expect(note).toBeVisible()
      await settle(page)

      const results = await auditPage(page)
      await reportIncomplete(results, testInfo, `update note · ${theme.label}`)
      expectNoViolations(results.violations, `update note · ${theme.label}`)
    })
  }
})

test.describe('update note · layout and keyboard', () => {
  test('no horizontal scroll with the note open from 320 to 1440', async ({
    page,
  }) => {
    await page.addInitScript(stubBridge(NOTE))

    for (const width of [320, 375, 480, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/settings')
      await expect(page.getByRole('dialog')).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })

  test('Enter on the trigger focuses the action and Escape returns the focus', async ({
    page,
  }) => {
    await page.addInitScript(stubBridge({ ...NOTE, phase: 'idle', version: null, releaseNotes: null }))
    await page.goto('/settings')

    const trigger = page.getByRole('button', { name: 'Updates', exact: true })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const note = page.getByRole('dialog')
    await expect(note).toBeVisible()
    await expect(
      note.getByRole('button', { name: 'Check for updates' }),
    ).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(note).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('a note with no primary action opens on its close button', async ({
    page,
  }) => {
    await page.addInitScript(
      stubBridge({
        ...NOTE,
        phase: 'downloading',
        percent: 42,
        transferred: 41_943_040,
        total: 65_536_000,
        releaseNotes: null,
      }),
    )
    await page.goto('/settings')

    /* A download does not open the note by itself; the trigger is offered. */
    await page.getByRole('button', { name: /^Update downloading/ }).click()

    const note = page.getByRole('dialog')
    await expect(note).toBeVisible()
    await expect(
      note.getByRole('button', { name: 'Close update note' }),
    ).toBeFocused()
    await expect(
      note.getByRole('progressbar', { name: 'Update download progress' }),
    ).toBeVisible()
    await expect(note.getByText(/of 62\.5 MB/)).toBeVisible()
  })

  test('the gallery topbar fits once the update trigger is in it', async ({
    page,
  }) => {
    await page.addInitScript(
      stubBridge({ ...NOTE, phase: 'idle', version: null, releaseNotes: null }),
    )

    for (const width of [1181, 1200, 1241, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/gallery')
      await expect(
        page.getByRole('button', { name: 'Updates', exact: true }),
      ).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `gallery overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
})
