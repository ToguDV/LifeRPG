import { expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { ThemeDefinition } from '../../src/theme/themes'

export type SurfaceValue = 'paper' | 'panel'

export interface SurfaceOption {
  value: SurfaceValue
  label: 'Paper' | 'Panel'
}

export const SURFACES: readonly SurfaceOption[] = [
  { value: 'paper', label: 'Paper' },
  { value: 'panel', label: 'Panel' },
]

/*
  WCAG 2.0/2.1 A + AA plus the best-practice rules. `best-practice` is not a
  conformance tag but it catches landmark, heading and ARIA hygiene issues
  that this gallery cares about (DESIGN.md §6).
*/
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'best-practice',
]

export interface AxeNodeSummary {
  /* axe can emit frame/shadow selectors, not only plain CSS strings. */
  target: readonly unknown[]
  html: string
  failureSummary?: string
}

export interface AxeRuleSummary {
  id: string
  impact?: string | null
  help: string
  helpUrl: string
  nodes: AxeNodeSummary[]
}

/** The slice of axe-core's result the harness reads. */
export interface AxeAnalysis {
  violations: AxeRuleSummary[]
  incomplete: AxeRuleSummary[]
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Loads the gallery from a clean context and waits for fonts and layout. */
export async function gotoGallery(page: Page): Promise<void> {
  await page.goto('/gallery')
  await expect(page.locator('main#content')).toBeVisible()
  await page.evaluate(() => document.fonts.ready.then(() => true))
}

/**
 * Selects a theme through the real ThemePicker. The picker is a dialog with
 * a radiogroup; clicking an option only changes the palette, so it is closed
 * with Escape afterwards (which also returns the focus to the trigger).
 */
export async function setTheme(
  page: Page,
  theme: ThemeDefinition,
): Promise<void> {
  const trigger = page.getByRole('button', { name: /^Choose theme/ })
  await trigger.click()

  const options = page.getByRole('radiogroup', { name: 'Available themes' })
  await expect(options).toBeVisible()
  await options
    .getByRole('radio', {
      name: new RegExp(`^${escapeForRegExp(theme.label)}(?:\\s|$)`),
    })
    .click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', theme.key)
  await expect(page.locator('html')).toHaveAttribute('data-paper', theme.paper)

  await page.keyboard.press('Escape')
  await expect(options).toBeHidden()
}

/** Toggles the gallery canvas between paper and panel. */
export async function setSurface(
  page: Page,
  surface: SurfaceOption,
): Promise<void> {
  const button = page.getByRole('button', { name: surface.label, exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.locator(`main#content [data-surface="${surface.value}"]`).first(),
  ).toBeVisible()
}

export interface AuditOptions {
  /** Rules that are documented findings and must not mask the rest. */
  disableRules?: string[]
  /** Restricts the audit to a subtree, as a CSS selector. */
  include?: string
  /** Restricts the audit to a single rule (used by the known-issue probe). */
  onlyRules?: string[]
}

export async function auditPage(
  page: Page,
  options: AuditOptions = {},
): Promise<AxeAnalysis> {
  let builder = new AxeBuilder({ page })
  if (options.onlyRules?.length) builder = builder.withRules(options.onlyRules)
  else builder = builder.withTags(AXE_TAGS)
  if (options.include) builder = builder.include(options.include)
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules)
  return builder.analyze()
}

function describeViolation(rule: AxeRuleSummary): string[] {
  const lines = [
    `  [${rule.id}] impact=${rule.impact ?? 'unknown'}: ${rule.help}`,
    `    ${rule.helpUrl}`,
  ]
  for (const node of rule.nodes) {
    lines.push(`    - target: ${node.target.join(' ')}`)
    const detail = (node.failureSummary ?? '').replace(/\s+/g, ' ').trim()
    if (detail) lines.push(`      ${detail}`)
  }
  return lines
}

/** A failure message with the rule, impact, help, targets, theme and surface. */
export function formatViolations(
  violations: AxeRuleSummary[],
  context: string,
): string {
  const lines = [
    `axe found ${violations.length} violation rule(s) in ${context}:`,
  ]
  for (const rule of violations) lines.push(...describeViolation(rule))
  return lines.join('\n')
}

/**
 * Fails the test on any violation. Open findings are intentionally left red:
 * this harness must not turn an accessibility bug into a green baseline.
 */
export function expectNoViolations(
  violations: AxeRuleSummary[],
  context: string,
): void {
  if (violations.length === 0) return
  throw new Error(formatViolations(violations, context))
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

/**
 * `incomplete` is neither a pass nor a violation: axe could not decide.
 * It is reported on its own, printed and attached, because the paper and
 * panel textures leave hundreds of nodes without a measurable background.
 */
export async function reportIncomplete(
  results: AxeAnalysis,
  testInfo: TestInfo,
  context: string,
): Promise<void> {
  const summary = results.incomplete.map((rule) => ({
    id: rule.id,
    impact: rule.impact ?? 'unknown',
    help: rule.help,
    helpUrl: rule.helpUrl,
    nodes: rule.nodes.length,
    sampleTargets: rule.nodes.slice(0, 5).map((node) => node.target.join(' ')),
  }))

  const description = summary.length
    ? summary.map((rule) => `${rule.id}=${rule.nodes}`).join(', ')
    : 'none'

  testInfo.annotations.push({
    type: 'axe-incomplete',
    description: `manual review required (not a pass): ${description} — ${context}`,
  })

  await testInfo.attach(`axe-incomplete-${slug(context)}.json`, {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json',
  })

  // Playwright reports the annotation in the HTML report; the console keeps
  // the same evidence visible in a plain terminal run.
  console.log(`[axe incomplete] ${context}: ${description}`)
}
