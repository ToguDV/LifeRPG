import { expect, type Locator, type Page } from '@playwright/test'

/*
  Stable hooks into the Questline demo. The selectors use the gallery's
  section id, the rail's structure and ARIA state, not the visible copy that
  the component refactor may retouch.
*/

export function questlineSection(page: Page): Locator {
  return page.locator('#questline')
}

export function questlineTriggers(page: Page): Locator {
  return questlineSection(page).locator('ol > li > button')
}

export function questlinePanel(page: Page): Locator {
  return questlineSection(page).locator('section[tabindex="-1"]')
}

/** Two frames: floating geometry and the trail's ResizeObserver settle. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}

export interface OpenMilestone {
  section: Locator
  trigger: Locator
  panel: Locator
}

export async function openMilestone(
  page: Page,
  index = 0,
): Promise<OpenMilestone> {
  const section = questlineSection(page)
  const trigger = questlineTriggers(page).nth(index)
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const panel = questlinePanel(page)
  await expect(panel).toBeVisible()
  await settle(page)
  return { section, trigger, panel }
}

/** The panel's editor form: its id is the panel id plus `-editor`. */
export function panelEditor(panel: Locator): Locator {
  return panel.locator('form[id$="-editor"]')
}

/** The pencil/close button in the panel header is the only `aria-expanded` one. */
export function panelEditorToggle(panel: Locator): Locator {
  return panel.locator('button[aria-expanded]').first()
}

export function panelHeading(panel: Locator): Locator {
  return panel.getByRole('heading').first()
}
