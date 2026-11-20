import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { THEMES } from '../src/theme/themes'
import {
  auditPage,
  expectNoViolations,
  gotoGallery,
  reportIncomplete,
  setSurface,
  setTheme,
  SURFACES,
  type AuditOptions,
  type AxeAnalysis,
  type AxeRuleSummary,
  type SurfaceOption,
} from './support/gallery'
import {
  openMilestone,
  panelEditor,
  panelEditorToggle,
  settle,
} from './support/questline'

/*
  Accessibility audit of the whole gallery with axe-core in a real browser.

  Every test is intentionally strict: a violation keeps the test red. The
  harness is not a baseline file; fixing a bug is what turns the suite green.
  `incomplete` is reported separately because axe cannot decide it (the paper
  and panel textures leave many nodes without a measurable background).
*/

test.describe('gallery · 8 themes × 2 surfaces', () => {
  for (const theme of THEMES) {
    for (const surface of SURFACES) {
      test(`${theme.key} · ${surface.label}`, async ({ page }, testInfo) => {
        await gotoGallery(page)
        await setTheme(page, theme)
        await setSurface(page, surface)

        const context = `${theme.label} (${theme.key}) · ${surface.label}`
        const results = await auditPage(page)
        await reportIncomplete(results, testInfo, context)
        expectNoViolations(results.violations, context)
      })
    }
  }
})

/*
  Open states. The overlays are portaled and the Questline panel changes the
  ARIA graph, so auditing only the closed page would miss them. These run on
  the default theme and both surfaces; the palette matrix above covers the
  closed state of all eight themes.

  The closed-state matrix is strict and green: nothing is skipped, baselined
  or disabled there. The audits below are differential for a different
  reason — an overlay is drawn over the page it opens on, and that page keeps
  its own DOM: the baseline is the same instance, so only the nodes the
  overlay contributes can be new, and a finding that already sits on the page
  cannot mask the one the overlay adds. Editor and confirmation are compared
  against the already-open panel, so their baseline includes the panel's own
  nodes; that keeps the signal on what the editor or confirmation adds.
*/
async function auditOpenState<Prepared>(
  page: Page,
  testInfo: TestInfo,
  surface: SurfaceOption,
  state: string,
  prepare: (() => Promise<Prepared>) | null,
  enter: (prepared: Prepared) => Promise<void>,
  options: AuditOptions = {},
): Promise<void> {
  await gotoGallery(page)
  await setSurface(page, surface)

  const prepared = prepare ? await prepare() : (undefined as Prepared)
  const baseline = await auditPage(page)
  await enter(prepared)
  await settle(page)

  const context = `${state} · ${surface.label}`
  const results = await auditPage(page, options)
  const { violations: newViolations, inherited } = newViolationsOnly(
    results,
    baseline,
  )

  await reportIncomplete(results, testInfo, context)
  console.log(
    `[axe open state] ${context}: ${inherited} inherited node(s) from the preceding state, ${newViolations.length} new rule(s).`,
  )
  expectNoViolations(
    newViolations,
    `${context} (new violations vs. the preceding state)`,
  )
}

/*
  Matching by rule id, selector and markup is enough here: the baseline is
  the same DOM instance, so React ids and CSS-module hashes do not change.
*/
function nodeKey(ruleId: string, node: AxeRuleSummary['nodes'][number]): string {
  return `${ruleId}::${node.target.join(' ')}::${node.html}`
}

function newViolationsOnly(
  results: AxeAnalysis,
  baseline: AxeAnalysis,
): { violations: AxeRuleSummary[]; inherited: number } {
  const known = new Set(
    baseline.violations.flatMap((rule) =>
      rule.nodes.map((node) => nodeKey(rule.id, node)),
    ),
  )

  let inherited = 0
  const violations = results.violations.flatMap((rule) => {
    const nodes = rule.nodes.filter((node) => {
      if (!known.has(nodeKey(rule.id, node))) return true
      inherited += 1
      return false
    })
    return nodes.length ? [{ ...rule, nodes }] : []
  })

  return { violations, inherited }
}

test.describe('open states', () => {
  for (const surface of SURFACES) {
    test(`Questline panel · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'Questline panel',
        null,
        async () => {
          await openMilestone(page)
        },
      )
    })

    test(`milestone editor · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'Questline editor',
        async () => (await openMilestone(page)).panel,
        async (panel) => {
          await panelEditorToggle(panel).click()
          await expect(panelEditor(panel)).toBeVisible()
        },
      )
    })

    test(`delete confirmation · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'Questline delete confirmation',
        async () => (await openMilestone(page)).panel,
        async (panel) => {
          /* The task rows also have “Delete …” buttons; the milestone one is last. */
          await panel.getByRole('button', { name: /Delete/i }).last().click()
          await expect(panel.locator('[role="group"]')).toBeVisible()
        },
      )
    })

    test(`open Select · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'Select open',
        null,
        async () => {
          const select = page.getByRole('combobox', {
            name: 'Wanderer class',
          })
          await select.scrollIntoViewIfNeeded()
          await select.click()
          await expect(page.getByRole('listbox')).toBeVisible()
        },
      )
    })

    test(`open Combobox · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'Combobox open',
        null,
        async () => {
          const combobox = page.getByRole('combobox', { name: 'Task of the day' })
          await combobox.scrollIntoViewIfNeeded()
          await combobox.click()
          await expect(page.getByRole('listbox')).toBeVisible()
        },
      )
    })

    test(`open DatePicker · ${surface.label}`, async ({ page }, testInfo) => {
      await auditOpenState(
        page,
        testInfo,
        surface,
        'DatePicker open',
        null,
        async () => {
          const trigger = page.getByRole('button', { name: /^Departure date/ })
          await trigger.scrollIntoViewIfNeeded()
          await trigger.click()
          await expect(
            page.getByRole('dialog', { name: 'Pick a date' }),
          ).toBeVisible()
        },
      )
    })
  }
})
