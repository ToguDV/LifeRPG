import { expect, test, type Locator, type Page } from '@playwright/test'
import { gotoGallery } from './support/gallery'
import {
  openMilestone,
  questlinePanel,
  questlineTriggers,
  settle,
} from './support/questline'

/*
  Keyboard and focus smoke tests. They assert roles, ARIA state and focus
  ownership instead of visible copy, so a wording pass does not break them.
*/

async function tabUntilFocused(
  page: Page,
  target: Locator,
  maxTabs = 250,
): Promise<void> {
  for (let press = 1; press <= maxTabs; press += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((element) => element === document.activeElement)) {
      return
    }
  }
  throw new Error(
    `The target did not receive the focus after ${maxTabs} Tab presses.`,
  )
}

test.describe('keyboard and focus', () => {
  test('Questline: Tab to the first milestone, Enter opens and Escape returns to the trigger', async ({
    page,
  }) => {
    await gotoGallery(page)

    const trigger = questlineTriggers(page).first()
    await tabUntilFocused(page, trigger)
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('Enter')
    const panel = questlinePanel(page)
    await expect(panel).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    /* The sheet is the content of a centred, modal dialog. */
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toContainText('Milestone')

    const panelId = await panel.getAttribute('id')
    expect(panelId, 'the open panel needs an id for aria-controls').toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', panelId ?? '')

    /* Opening the panel moves the focus inside it (QuestNodePanel effect). */
    await expect(panel).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('ThemePicker: Enter opens, arrows change the theme and Escape returns focus', async ({
    page,
  }) => {
    await gotoGallery(page)

    const trigger = page.getByRole('button', { name: /^Choose theme/ })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const options = page.getByRole('radiogroup', { name: 'Available themes' })
    await expect(options).toBeVisible()
    await expect(options.getByRole('radio', { checked: true })).toBeFocused()

    const before = await page.locator('html').getAttribute('data-theme')
    expect(before).toBeTruthy()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? '')
    await expect(options.getByRole('radio', { checked: true })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(options).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('Select: arrows, Enter, Escape and focus return', async ({ page }) => {
    await gotoGallery(page)

    const select = page.getByRole('combobox', {
      name: 'Wanderer class',
    })
    await select.focus()
    const before = (await select.textContent())?.trim()

    await page.keyboard.press('Enter')
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    await expect(select).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('ArrowDown')
    const activeId = await select.getAttribute('aria-activedescendant')
    expect(activeId, 'ArrowDown must move aria-activedescendant').toBeTruthy()
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute(
      'role',
      'option',
    )

    await page.keyboard.press('Enter')
    await expect(listbox).toBeHidden()
    await expect(select).toHaveAttribute('aria-expanded', 'false')
    await expect(select).toBeFocused()
    expect((await select.textContent())?.trim()).not.toBe(before)

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(select).toHaveAttribute('aria-expanded', 'false')
    await expect(select).toBeFocused()
  })

  test('Combobox: arrows, Enter, Escape and focus return', async ({ page }) => {
    await gotoGallery(page)

    const combobox = page.getByRole('combobox', { name: 'Task of the day' })
    await combobox.focus()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()

    await page.keyboard.press('ArrowDown')
    const activeId = await combobox.getAttribute('aria-activedescendant')
    expect(activeId, 'ArrowDown must move aria-activedescendant').toBeTruthy()
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute(
      'role',
      'option',
    )

    await page.keyboard.press('Enter')
    await expect(listbox).toBeHidden()
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(combobox).toBeFocused()
    expect(await combobox.inputValue()).not.toBe('')

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(combobox).toBeFocused()
  })

  test('trail: 6–8 milestones, panel open and every path has a d', async ({ page }) => {
    await gotoGallery(page)

    const triggers = questlineTriggers(page)
    const count = await triggers.count()
    expect(count).toBeGreaterThanOrEqual(6)
    expect(count).toBeLessThanOrEqual(8)

    await openMilestone(page)

    /*
      The trail is a decorative SVG measured by ResizeObserver. It has width
      and height attributes; the icons do not, so the selector is unambiguous.
    */
    const trail = page.locator('#questline svg[width][height]')
    await expect(trail).toBeVisible()
    const paths = trail.locator('path')
    await expect(paths).toHaveCount(count - 1)

    const assertPathsHaveGeometry = async (label: string) => {
      const geometry = await paths.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('d') ?? ''),
      )
      expect(geometry, `${label}: path count`).toHaveLength(count - 1)
      geometry.forEach((d, index) => {
        expect(
          d.trim().length,
          `${label}: path ${index} has an empty d attribute`,
        ).toBeGreaterThan(0)
      })
    }

    await assertPathsHaveGeometry('1440px')

    /*
      On a 320 px viewport the rail wraps into several rows. The trail is
      still rendered (no display:none), so it is asserted instead of skipped;
      this is the wrapping case that jsdom cannot cover.
    */
    await page.setViewportSize({ width: 320, height: 900 })
    await settle(page)
    await expect(trail).toBeVisible()
    await assertPathsHaveGeometry('320px')
  })
})
