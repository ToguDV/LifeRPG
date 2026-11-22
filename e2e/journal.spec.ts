import { expect, test, type Page } from '@playwright/test'
import { TASKS_KEY } from '../src/journal/journal-data'
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

      /* The centred editor has to fit the same narrow viewport. */
      if (width === 320) {
        await page
          .getByRole('button', { name: 'Edit “Fill the waterskin at the stream”' })
          .click()
        const editor = page.getByRole('dialog', { name: 'Edit task' })
        await expect(editor).toBeVisible()
        const box = await editor.boundingBox()
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          ),
        ).toBeLessThanOrEqual(0)
        await page.keyboard.press('Escape')
      }
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

  test('a task can be edited, survives a reload and is announced', async ({ page }) => {
    await gotoJournal(page)

    const row = page.getByRole('list', { name: 'Tasks' }).getByRole('listitem').first()
    const before = await row.boundingBox()

    await page
      .getByRole('button', { name: 'Edit “Fill the waterskin at the stream”' })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Edit task' })
    await expect(dialog).toBeVisible()
    /* A centred editor must not move the list it belongs to. */
    expect(await row.boundingBox()).toEqual(before)

    const title = page.getByRole('textbox', { name: 'Title' })
    await expect(title).toBeFocused()
    await title.fill('Fill the waterskin at the ford')

    /* The box is clipped, so the visible label is the click target. */
    const tagList = dialog.getByRole('group', { name: 'Tags' })
    await tagList.getByText('Water', { exact: true }).click()
    await tagList.getByText('Kit', { exact: true }).click()
    await dialog.getByRole('textbox', { name: 'New tag' }).fill('Ford')
    await page.keyboard.press('Enter')
    await expect(
      tagList.getByRole('checkbox', { name: 'Ford', exact: true }),
    ).toBeChecked()

    await page
      .getByRole('textbox', { name: /description/i })
      .fill('The ice is thinner here.')

    /* The editor is a real form on the page: axe can audit the open state. */
    const results = await auditPage(page)
    expectNoViolations(results.violations, 'journal · edit form')

    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByRole('checkbox', { name: 'Check “Fill the waterskin at the ford”' }),
    ).toBeVisible()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Task updated: Fill the waterskin at the ford' }),
    ).toHaveCount(1)

    await page.reload()
    await expect(page.locator('main#content')).toBeVisible()
    await expect(
      page.getByRole('checkbox', { name: 'Check “Fill the waterskin at the ford”' }),
    ).toBeVisible()
    await expect(page.getByText('Ford', { exact: true })).toBeVisible()
    await expect(page.getByText('The ice is thinner here.')).toBeVisible()

    /* Escape closes the editor and gives the focus back to the pencil. */
    const edit = page.getByRole('button', {
      name: 'Edit “Fill the waterskin at the ford”',
    })
    await edit.click()
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(edit).toBeFocused()
  })

  test('a task can be added with the keyboard alone', async ({ page }) => {
    await gotoJournal(page)

    /*
      Tab from the top of the document until the composer has the focus; the
      count depends on the chrome (skip link, brand, nav, theme picker), so
      the loop stops on the element instead of on a fixed number of presses.
    */
    const composer = page.getByRole('textbox', { name: 'New task' })
    for (let stop = 0; stop < 12; stop += 1) {
      if (await composer.evaluate((element) => element === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    await expect(composer).toBeFocused()

    await page.keyboard.type('Sharpen the axe')
    await page.keyboard.press('Enter')

    await expect(
      page.getByRole('checkbox', { name: 'Check “Sharpen the axe”' }),
    ).toBeVisible()
    /* The composer takes the focus back, so the next task needs no tabbing. */
    await expect(composer).toBeFocused()
    await expect(
      page.getByRole('status').filter({ hasText: 'Task added: Sharpen the axe' }),
    ).toHaveCount(1)
  })

  test('deleting a task removes the row and is announced', async ({ page }) => {
    await gotoJournal(page)

    const row = page.getByRole('checkbox', {
      name: 'Check “Fill the waterskin at the stream”',
    })
    await expect(row).toBeVisible()

    await page
      .getByRole('button', { name: 'Delete “Fill the waterskin at the stream”' })
      .click()

    await expect(row).toHaveCount(0)
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Task deleted: Fill the waterskin at the stream' }),
    ).toHaveCount(1)
  })

  test('the empty state returns when the last task is deleted', async ({ page }) => {
    await gotoJournal(page)

    /* An empty array is a valid journal: the initialiser adopts it instead of seeding. */
    await page.evaluate((key) => window.localStorage.setItem(key, '[]'), TASKS_KEY)
    await page.reload()
    await expect(page.locator('main#content')).toBeVisible()
    await expect(page.getByText('No tasks yet', { exact: true })).toBeVisible()
    await expect(page.getByRole('progressbar', { name: 'Done' })).toHaveCount(0)

    const composer = page.getByRole('textbox', { name: 'New task' })
    await composer.fill('Sharpen the axe')
    await composer.press('Enter')
    await page.getByRole('button', { name: 'Delete “Sharpen the axe”' }).click()

    await expect(page.getByText('No tasks yet', { exact: true })).toBeVisible()
    await expect(page.getByRole('checkbox')).toHaveCount(0)
  })

  test('an empty title is refused with a message and keeps the focus', async ({ page }) => {
    await gotoJournal(page)

    await page.getByRole('button', { name: 'Add', exact: true }).click()

    await expect(page.getByRole('alert')).toHaveText('Write a task first.')
    await expect(page.getByRole('textbox', { name: 'New task' })).toBeFocused()
    /* The five seeded tasks are untouched. */
    await expect(page.getByRole('checkbox')).toHaveCount(5)
  })

  test('completing a milestone is announced in the status region', async ({ page }) => {
    await gotoJournal(page)

    await page.getByRole('button', { name: /The blind well/ }).click()
    const panel = page.getByRole('region', { name: 'The blind well' })
    await expect(panel).toBeVisible()

    /* Two of its three tasks are still open; the second one completes it.
       The checkbox itself is clipped, so the row text is the click target. */
    await panel.getByText('Lower the brass lantern', { exact: true }).click()
    await panel.getByText('Raise the bucket', { exact: true }).click()

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Milestone “The blind well” completed.' }),
    ).toHaveCount(1)
  })
})
