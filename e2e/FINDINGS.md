# E2E harness log

**Command:** `pnpm test:e2e` · report: `pnpm test:e2e:report`
**Tools:** Playwright 1.64.1 (Chromium `chromium-1248`, already cached in `~/.cache/ms-playwright`) and axe-core 4.14 via `@axe-core/playwright`.

Current state: **36 tests green**. This file keeps the first pass and the harness rules; it is not a list of exceptions.

---

## First pass (2026-11-18): 19 of 37 green

The 18 failures were five real findings, not infrastructure noise:

| # | Finding | Status |
| --- | --- | --- |
| A11Y-01 | `FileUploader`: `label-content-name-mismatch` in all 16 theme × surface pairs | Fixed: the accessible name includes the visible instruction of the area |
| A11Y-02 | `color-contrast` of the overdue milestone marker: 2.74:1 Nord+Panel, 3.68 Pergamino, 3.81 Gruvbox (and 2.46–4.04 on paper, which axe left in `incomplete`) | Fixed: `--ui-danger-text` per surface |
| A11Y-03 | `color-contrast` of the active index number in Nord: 4.42:1 | Fixed: Nord's strong panel accent at 4.66:1 |
| A11Y-04 | `color-contrast` of the Questline panel on Pergamino paper: 4.18 kicker, 4.20 note/tally/labels | Fixed: `--ui-success-text` and light-paper `--ui-text-muted` |
| A11Y-05 | `color-contrast` of the “Yes, delete the milestone” button in Pergamino+Panel: 4.02:1 | Fixed: `--ui-danger-text` |
| — | Known `DatePicker` finding (`REVISION.md` §3): visible cell “1”, name “01 November 2026” | Fixed: day name without padding. The `disableRules` exclusion was removed and the probe deleted |
| — | `incomplete` `form-field-multiple-labels` in `TaskRow` (5 nodes) | Fixed: a single native `<label>` |

Details of the original pass and of the measured ratios: `git log -p e2e/FINDINGS.md`.

---

## Harness rules

- **No baseline.** There is no file of accepted violations: an open finding leaves the test red. If a new one appears, it is fixed or documented here while it stays red.
- **No exclusions.** `e2e/a11y.spec.ts` does not use `disableRules`. When an exclusion was necessary (the known `DatePicker`), it came with a probe that kept it honest; that probe no longer exists.
- **`incomplete` is diagnostic, not a finding.** Every pass prints and attaches the nodes axe cannot decide: the textures leave hundreds of `color-contrast` nodes unresolved (gradients, background images, pseudo-elements). The project owner reviewed them by hand in the 8 themes and **accepted them as valid**; they are not documented as pending and no tools are proposed to measure them. The four texts that were actually fixed were measured against the resolved tokens.
- **Open states differentially.** Panel, editor, confirmation, `Select`, `Combobox` and `DatePicker` are compared with the previous state so that a pre-existing finding does not hide what the overlay adds. The 8 themes × 2 surfaces matrix of the closed state is strict.
- **Port 4317 with `reuseExistingServer`.** Two worktrees running `pnpm test:e2e` at once share a server and one audits the other's code: change `PORT` or stop the other server before trusting the result.

## Limits

- Chromium only: no real screen reader, Safari or Firefox.
- The keyboard pass is a smoke test of the key patterns (Questline panel, `ThemePicker`, `Select`, `Combobox`), not an exhaustive sweep of the 13 controls.
- The overflow meter ignores elements clipped by an ancestor with `overflow-x`; the document `scrollWidth` still catches real page overflow.

## Reproducing

```bash
pnpm install
pnpm exec playwright install chromium   # only if chromium-1248 is missing
pnpm test:e2e
pnpm test:e2e:report
```
