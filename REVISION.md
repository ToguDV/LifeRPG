# Technical review — LifeRPG UI layer

**Scope:** the UI layer during the planning phase. The product layer — task model, XP economy, persistence, routing and backend — is out of scope and not implemented yet; see `PRODUCT.md`.

**Status:** closed. The base review (32 findings) was implemented and verified earlier; this round closes the `Questline` findings and turns `§2` into an automated harness. The historical detail is in `git log -p REVISION.md` and the design decisions in `DESIGN.md`.

**Verification:** `pnpm typecheck`, `pnpm lint`, `pnpm test:run` (12 files, 95 tests), `pnpm build` and `pnpm test:e2e` (36 tests in Chromium), all green.

---

## 1. Questline — resolved

Every finding was reproduced before it was fixed: the new tests were run against the original code and failed (15 in the core, 14 in the panel). There were no false positives.

| # | Finding | Resolution | Tests |
| --- | --- | --- | --- |
| Q-01 | Completion was announced by position and competed with deletion | Transitions compared by `Map<id, state>`; a single writer of the `status` region composes the delete notice (queued) with the transitions of the same commit | `questline.test.tsx` (delete ahead of a completed one, delete message) |
| Q-02 | Native validation blocked our own error | `noValidate` on the form, `required` kept as semantics; `submitNode` always runs | `questline-panel.test.tsx` |
| Q-03 | Locking and unlocking in silence | Both directions are announced and the last focused element is stored so focus can be returned if a control becomes `disabled` | `questline.test.tsx` (re-lock when adding a task and when reopening) |
| Q-04 | The panel did not receive focus when opened | Focus in `requestAnimationFrame` on mount (except when it is born in edit mode: `autoFocus` wins), without stealing focus from a click already made | `questline-panel.test.tsx` |
| Q-05 | The lock note pointed at a milestone that unlocks nothing | `getBlockingNodes` returns every pending milestone ahead; with several, “…starting with “A””; comment fixed | `questline-model.test.ts`, `questline-panel.test.tsx` |
| Q-06 | “B unlocked” could be a lie | The first `locked → active/overdue` is derived; “The journey is complete” only if every state ends completed | `questline.test.tsx` |
| Q-07 | Last-milestone copy | `index === total - 1`: “Complete this milestone to finish the journey” / “The journey is complete” | `questline-panel.test.tsx` |
| Q-08 | “Close milestone” meant two things | “Close panel” for the panel; “complete / completed” for the milestone (footer, tally, badge) | `questline-panel.test.tsx` |
| Q-09 | Cancelling left a draft milestone | A freshly added milestone is discarded when the editor closes if it is still untouched; any save or task edit keeps it | `questline.test.tsx` |
| Q-10 | Copy and counts | The header does not show “0 of 0 tasks”; the deadline is shown once (kicker); the note is documented as an author note | `questline.test.tsx`, `questline-panel.test.tsx` |
| Q-11 | Adding a task was not announced | Focus goes to the new checkbox (or the row button if it is locked) and is brought on screen | `questline-panel.test.tsx` |
| Q-12 | The active state had no hidden text | `STATE_META` with a word for all four states, shared by rail and panel | `questline.test.tsx` |
| Q-13 | Locked and overdue milestone without tint | `data-overdue` on rail and panel: the overdue state is tinted without losing the lock, the dashed border or the word “Locked” | `questline.test.tsx` |
| Q-14 | Escape and task validation | Escape backs out one layer (confirmation → editor → task editor → panel) with focus returned; an empty title when adding and renaming shows “The task needs a name.” | `questline-panel.test.tsx` |
| Q-15 | Focus after renaming or deleting a task | It goes to the neighbouring row and is secured on screen with `scrollIntoView({ block: 'nearest' })`, with no `preventScroll` | `questline-panel.test.tsx` |
| Q-16 | Dynamic text without `overflow-wrap` | `overflow-wrap: anywhere` + `min-width: 0` on the note, confirmation, lock and `Checkbox` label | `e2e/overflow.spec.ts` (320–1440 px) |
| Q-17 | Dead code and inaccurate comments | Out: `triggerId`, `deadlineToKey` and `data-done`; comments in `getBlockingNode` and the stylesheet fixed | lint/build |
| Q-18 | Default `label` | Default “Milestone route”; with `label=""` the rail is named “Milestones” | `questline.test.tsx` |
| Q-19 | Deadlines going stale at midnight | `today` in state, refreshed on `visibilitychange`, `focus` and midnight; the panel recomputes on re-render | `questline.test.tsx` |
| Q-20 | DOM ids and public API | `useId` base + `domFragment` (safe for `[A-Za-z0-9_-]`); types and `formatQuestNumber` re-exported from `Questline.tsx` | `questline.test.tsx` |
| — | Duplication and size | `updateTasks`, a single `STATE_META` and the split into `QuestRail`, `QuestStop`, `QuestNodeEditor`, `QuestTaskRow`, `QuestDeleteConfirm`; `Questline.tsx` 588→449 and `QuestNodePanel.tsx` 602→456 | full suite |
| — | Trail memoisation | **Not done**: `sameTrail` already avoids the `setState` with identical geometry, and an extra cache would have to be kept in sync with wrapping and font metrics. Decision written in `useQuestTrail.ts` | — |

---

## 2. Verification — now automated

`§2` is no longer a list of manual checks: `pnpm test:e2e` starts Vite in real Chromium (Playwright 1.64.1, `chromium-1248` cached) and runs **36 tests**.

- **axe** WCAG 2 A/AA + best practices on the **8 themes × 2 surfaces** and on the open states (panel, editor, delete confirmation, `Select`, `Combobox`, `DatePicker`). Open states are audited differentially against the previous state, so a pre-existing finding does not hide what the overlay introduces.
- **Overflow** at **320, 375, 480, 768, 1024 and 1440 px** with the full gallery, the panel open and a 60-character title with no spaces.
- **Keyboard and focus**: Tab/Enter/Escape of the panel with the trigger restored, `ThemePicker`, `Select`, `Combobox` and a trail smoke test (paths with a non-empty `d` across 2 and 3 rows).

### Findings it surfaced and that are already fixed

| # | Finding | Fix |
| --- | --- | --- |
| A11Y-01 | `FileUploader`: the accessible name did not contain the visible instruction (WCAG 2.5.3) | The name includes the label plus the area instruction |
| A11Y-02 | Overdue milestone marker: 2.74:1 in Nord+Panel, 3.68 in Pergamino, 3.81 in Gruvbox | `--ui-danger-text` per surface (4.86–6.03:1) |
| A11Y-03 | Active index number in Nord: 4.42:1 | `--accent-panel-strong` at 4.66:1 |
| A11Y-04 | Panel on Pergamino paper: kicker 4.18, note/tally/labels 4.2 | `--ui-success-text` and light-paper `--ui-text-muted` (4.66–5.51:1) |
| A11Y-05 | Danger button in Pergamino+Panel: 4.02:1 | `--ui-danger-text` (5.59:1) |
| — | Known `DatePicker` issue (former §3): “01 November” versus the visible “1” | Day name without padding and **no exclusion** in axe |
| — | `form-field-multiple-labels` in `TaskRow` (`incomplete`) | A single native `<label>`; the exact name “Check/Uncheck ‘title’” kept |

### Closed decisions

- **Contrast over textures: verified by hand.** axe leaves hundreds of `color-contrast` nodes in `incomplete` because the paper and panel textures (gradients, background images, pseudo-elements) prevent the background from being composed. The project owner reviewed those nodes in the 8 themes and **accepted them as valid** (2026-11-18): it is not reopened, not reported as pending and no new tools are proposed to measure it. The harness prints them and attaches them as diagnostics.
- **No real screen reader and no Safari/Firefox**: the harness is Chromium. This is an accepted limit of the harness, not a finding.
- **The visual review of the 8 themes** (muted hierarchy, Nord red, panel accent) belongs to the owner; the ratios of the corrected texts are measured.
- **The harness has no baseline**: a new finding leaves the test red and is documented in `e2e/FINDINGS.md`; it is not silenced with `disableRules`.

---

## 3. Known traps and closed decisions

- **Harness port**: `playwright.config.ts` serves `127.0.0.1:4317` with `reuseExistingServer`. Two worktrees running `pnpm test:e2e` at the same time share a server: one would be auditing the other's code.
- **Pinned Chromium**: `@playwright/test` 1.64.1 corresponds to `chromium-1248`. Upgrading it may require `pnpm exec playwright install chromium`.
- **Font preload**: the `href`s of the two `<link rel="preload">` in `index.html` are literals; renaming a `.woff2` forces updating them.
- **ESLint**: `exhaustive-deps` is a `warn` on purpose and six justified `eslint-disable-next-line` remain (the `aria-activedescendant` and `aria-invalid` pattern on `role="button"`).
- **Decisions already made, do not reopen without a reason**: “Now” rounds down; `minuteStep` is normalised to 1–60 (fallback 5); `Surface` sheets drop to 4/9 px below 640 px; portalled popups use a named `region` and not `dialog`; `required` is announced as a description when the role does not accept `aria-required`; the state accent (`--ui-danger`, `--ui-success`, `--ui-warning`) is never used as text: that is what `--ui-*-text` is for; the `DatePicker` names the day without zero padding so that the name contains the visible text.
