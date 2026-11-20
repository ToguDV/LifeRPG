# Release review — LifeRPG 0.1.0

**Date:** 2026-11-20 · **Commit:** `439e773` · **Scope:** everything that ships in the first public release — web bundle and Electron desktop app.
**Method:** three independent review lenses run in parallel (runtime correctness and state · design-system and CSS contract · release, packaging and tooling), each reading whole files rather than diffs, then cross-checked against the code by a fourth pass. Findings are labelled with the lens that raised them and whether the claim was **reproduced** or only **traced** through the code.
**Verdict at review:** no-ship until the four blockers in §1 were fixed.
**Status after the resolution pass (same day):** every blocker, high and medium is closed, plus the §4 items that were pure defects. The gate is green at **124 unit / 51 e2e** tests. `v0.1.0` is shippable once §6 is re-run on the release commit. The fix, its proof and what deliberately remains open are in **§0.2** and **§4**; the tables in §1–§4 keep the original wording as the record of what was found.

---

## 0. Baseline — measured, not assumed

| Gate | Result |
| --- | --- |
| `pnpm lint` | green. `AGENTS.md` 74/90 lines, 7 185/8 000 chars, 6/6 sections. Type floor: 37 CSS modules, 13 scale steps, nothing under 14 px, prose at 15 px. |
| `pnpm test:run` | green. **124 tests in 16 files** (99 in 13 before the resolution pass; the +25 are the tests the findings asked for). |
| `pnpm build` | green. 141 modules → `index-*.js` 372.68 kB (117.30 gzip), `index-*.css` 149.66 kB (22.47 gzip). |
| `pnpm test:e2e` | green. **51 tests, 1.2 min** (46 before the resolution pass), 3 workers, no skips, no baseline file, no `disableRules`. |
| Git | no tags yet; `dist/` and `release/` untracked and gitignored; no `TODO`/`FIXME`/`@ts-ignore`/`console.*`/secrets in `src/`. |

The one thing the green run *does* contradict is a comment — see **M-9**.

---

## 0.2 Resolution log

Every item below was implemented in this checkout and re-verified here, not by the agent that wrote it: `pnpm typecheck`, `pnpm lint`, `pnpm test:run` (124), `pnpm build` and `pnpm test:e2e` (51) are green together, and the unit tests that close a bug were shown red against the previous code first.

| # | Fix | Proof |
| --- | --- | --- |
| BLK-1 | `LICENSE` (MIT, ToguDV, 2026) + `"license": "MIT"` in `package.json` | electron-builder reads the field; the deb metadata is no longer blank |
| BLK-2 | `electron/**`, `electron-builder.yml`, `build/**`, `.nvmrc` added to the shared `&paths` anchor (`ci.yml:29-37`), comment updated to say why | YAML re-parsed; the same anchor still feeds `push` and `pull_request` |
| BLK-3 | `storage` listener in `usePersistentState` (`:125-146`): adopts only its own key, only a payload `parse` accepts, ignores the echo through `lastWritten`, never adopts what it cannot read | `tests/use-persistent-state.test.tsx` — adopt, ignore echo, ignore junk and foreign keys |
| BLK-4 | Both parsers reject only a non-array and skip bad records; the first commit after a failed parse stashes the raw string under `${key}-corrupt` and does not write | `tests/journal-data.test.ts` (salvage) and `tests/use-persistent-state.test.tsx` (`[]` valid, stash once, write on first real change) |
| H-1 | `addNode` prunes the previous draft when it is still untouched (`Questline.tsx:213-239`), inside the same `setNodes` | `tests/questline.test.tsx:320` — red before the fix (two milestones), green after |
| H-2 | **Not fixed** — see §4 | — |
| H-3 | `QUESTS_KEY` and both parsers are covered by `tests/journal-data.test.ts`; the persistence guards by the two files above | 6 new tests |
| M-1 | `src/lib/useToday.ts` extracted from `Questline` (logic verbatim) and used by `JournalPage` | `tests/journal.test.tsx` — the headline turns over on `visibilitychange`, red against `formatDate(new Date())` |
| M-2 | **Not fixed** — see §4 | — |
| M-3 | Six literals translated (`Options`, `Notifications`, `Clear field`, `Today`, `Clear`); the DESIGN §10.5 vocabulary follows the code (`Now`, `Clear`, `Apply`) | `rg` finds no Spanish literal left; e2e and jsdom query English names |
| M-4 | `Tooltip` calls `useSurface()` and sets `data-surface` on the portalled node | `tests/tooltip.test.tsx` green; no CSS change, so no pixels move |
| M-5 | `Toast` reads the context instead of hard-coding `"panel"`. `ToastProvider` sits above every `Surface`, so a toast today still resolves the provider's surface; the hard-coded material is gone and the attribute is derived | Same rendering, contract now satisfied; `Toast.module.css` reads only surface-aware tokens |
| M-6 | CSP installed in `electron/main.cjs:105-155` via `onHeadersReceived`, gated on the `app://liferpg/` origin (custom schemes are rejected by `webRequest` filters, electron#23413); `'unsafe-inline'` for the generated boot script is documented with the hash alternative | `node --check` passes; **not yet seen in a running packaged window** (§4) |
| M-7 | `tests/theme-contract.test.ts`: 8 palettes and no stray key, identical 59-token sets, all 334 consumed properties resolve (allow-list of three inline slider variables that the test also proves still exist), swatches equal their tokens | 4 tests, no snapshot, reads the stylesheet from disk |
| M-8 | `--ui-desk-0/1/2`, `--ui-desk`, `--ui-desk-halo`, `--ui-desk-lamp` in the `:root` semantic block, bound 1:1 to the primitives; `base.css`, both page modules and `Atmosphere` read them | No primitive reaches `src/components`/`src/journal`/`src/gallery` any more (`rg` clean); every substitution is the same value, so the 16-pair axe matrix still passes |
| M-9 | The stale paragraph in `e2e/a11y.spec.ts` now describes the real rule: closed-state matrix strict and green, open states differential because they share the page instance | The sentence matches the 51-test run |
| L-1 | `isComposing`/`keyCode === 229` guards in the panel keydown, `useDismiss` and the task editor (which reads `nativeEvent`, since React's synthetic event does not carry the flag) | Two jsdom tests with a composing KeyboardEvent; both red without the guard |
| L-2 | Duplicate node and task ids dropped by the parsers (first wins) | Covered in `tests/journal-data.test.ts` |
| L-3 | `Select`'s typeahead timer is cleared on unmount | Code-only (not observable through roles) |
| L-5 | Dead `styles.torn` / `styles.label` / `styles.hint` references removed after confirming no rule exists | `typecheck`, `lint`, 124 tests |
| L-9 | Focus ring reads `--focus-ring-width` in all nine modules (token is exactly `1px`, so no visual change); the `900ms` spinner stays literal because no duration token holds 900 ms | Same computed value |
| L-11 | `reload`/`forceReload`/`toggleDevTools` only when `!app.isPackaged`; `openExternal` parses the URL and opens `https:` only | `node --check`; window-state persistence still open (§4) |
| L-12 | `engines.node >= 20.19.0` (Vite 7 floor; `.nvmrc` is 24) | `pnpm lint`/`typecheck` unaffected |
| L-13 | `electron` added to `onlyBuiltDependencies` and `allowBuilds`; `electron-winstaller: false` kept | The postinstall that fetches the binary is allowed again |
| L-14 | README: the data layer ships (`:189`), the e2e description lists `journal.spec.ts`, the `v0.1.0` line no longer implies a tag exists | Read against `git tag -l` (empty) |
| L-15 | `e2e/journal.spec.ts` gains five tests: keyboard-only add, delete + announcement, empty state and return to it, empty-title error, milestone completion announcement | 51 e2e green |
| L-16 | AppImage on Ubuntu 24.04+ (`sandbox: true` + AppArmor `unprivileged_userns`) documented in the README | Docs |

The resolution did not touch `electron-builder.yml`, the theme palettes, `AGENTS.md` or the e2e harness rules: no exclusion, no baseline and no skip was added to make anything pass.

---

## 1. Blockers — fix before tagging `v0.1.0`

| # | Lens | Finding | Fix |
| --- | --- | --- | --- |
| **BLK-1** | Release | **No licence.** No `LICENSE` file at the root and no `license` field in `package.json`. A first public release ships `.AppImage`, `.deb` and NSIS installers with no terms at all, and the deb control metadata is blank. | Add `LICENSE` + `"license": "MIT"` (or the chosen one). One line each; electron-builder picks it up from `package.json`. |
| **BLK-2** | Release | **CI ignores the riskiest paths.** The `paths` filter in `.github/workflows/ci.yml:15-32` lists `src/ tests/ e2e/ scripts/ index.html package.json *config* AGENTS.md .github/**` but **not** `electron/**`, `electron-builder.yml`, `build/**` or `.nvmrc`. A change to the main process, the packaging config, the icon or the Node version runs no lint, no unit test, no build and no e2e. The desktop release workflow is the only thing that would notice, and only after a tag. | Add the four globs to the shared `&paths` anchor. |
| **BLK-3** | Logic | **Two tabs silently destroy each other's journal.** `src/lib/usePersistentState.ts:23-42`: the value is read once on mount and written back after every change, with **no `storage` listener**. Tab A adds a task; tab B adds another from its mount-time snapshot; A's task is gone on disk while A's UI still shows it — and A's next write resurrects A's list and drops B's. Nothing errors, and the footer still claims “Saved in this browser”. `ThemeProvider.tsx:60-72` already implements exactly the missing pattern for the theme key, so this is an omission, not a design decision. | Adopt the same `storage` listener in `usePersistentState`, ignoring the echo by comparing against the current serialisation. |
| **BLK-4** | Logic | **One bad record destroys the whole journal.** `parseTasks`/`parseNodes` reject the entire array on the first invalid item (`src/journal/journal-data.ts:25,28,51,54,58,61`); the initialiser falls back to the seed (`usePersistentState.ts:33`) and the write effect then persists the seed over the stored journal (`:36-42`). Five real tasks plus one task whose `done` is `"true"` → five seed tasks, unrecoverably. The trigger is external today (devtools, an extension, a downgraded build, or a future shape reusing the `-v1` key), but the destructive half is a live bug. | Salvage instead of rejecting: `continue` on an invalid record (reject only a non-array payload), skip the mount write when parsing failed, and copy the raw string to `${key}-corrupt` before the first write. |

---

## 2. High

| # | Lens | Finding | Fix |
| --- | --- | --- | --- |
| **H-1** | Logic | **Pressing “Add milestone” twice strands a draft and locks the route forever.** `Questline.tsx:207-215` overwrites `draftRef.current` with the new id, and the cleanup effect (`:273-291`) early-returns while `editingId === draft.id` — so milestone 1 is never seen again. You get `[…, "New milestone", "New milestone"]`, and since an empty milestone is never complete (`questline-model.ts:113-118`, `chainClosed && complete`), **every** later milestone stays locked. The add button has no `disabled` guard while an editor is open. Q-09 fixed the single-draft case; this is the hole it left. | Prune the previous untouched draft inside `addNode` (or keep a `Set` of pending drafts) and add a double-click test. |
| **H-2** | Release | **The packaged app is never executed.** `.github/workflows/desktop.yml` builds and uploads artifacts but no step launches the binary, and `electron/main.cjs` has no automated coverage at all. A broken `serveAppRequest`, a wrong `files` glob or a protocol regression ships silently and is discovered by the first user. | `xvfb-run` smoke step asserting the window title, or export the pure `resolveRequest` and unit-test it in `tests/`. |
| **H-3** | Release | **The persistence guards are untested.** `QUESTS_KEY` (`journal-data.ts:7`) is written by `QuestJournal` but referenced by no test, and `parseTasks`/`parseNodes` — the only defence against malformed storage — have zero coverage (`tests/journal.test.tsx:48` only reads `TASKS_KEY`). Bad JSON and a partially invalid array are precisely the first-release data-loss paths, and they are the two behaviours BLK-4 changes. | Three jsdom cases: bad JSON → seed, partially invalid array → salvaged, duplicate ids rejected. |

---

## 3. Medium

| # | Lens | Finding | Fix |
| --- | --- | --- | --- |
| **M-1** | Logic | **The journal headline date goes stale at midnight.** `JournalPage.tsx:39` evaluates `formatDate(new Date())` once, while `Questline` deliberately refreshes `today` on midnight, `visibilitychange` and `focus`. Leave the tab open overnight and the milestones flip under a header that still reads yesterday. | Extract the existing refresh as `useToday()` and use it in both places. |
| **M-2** | Logic | **A failed write is invisible.** `usePersistentState.ts:36-41` swallows quota and private-mode failures, so the user keeps editing a journal that will not survive a reload — directly contradicting “Saved in this browser” (`JournalPage.tsx:60`). | Expose `saved: boolean` (or push the existing `Toast`) and reflect it in the footer. |
| **M-3** | Logic / i18n | **Six Spanish strings in an `lang="en"` document** (`index.html:2`): `Toast.tsx:124` `aria-label="Notificaciones"`, `TextInput.tsx:144` `"Limpiar campo"`, `Select.tsx:99` and `Combobox.tsx:101` `'Opciones'` fallback popup names, `DatePicker.tsx:398` “Hoy” and `:404` “Limpiar”. Five of the six are in the accessibility tree, announced in an English voice — WCAG 3.1.2 Language of Parts. `playwright.config.ts:54` sets `locale: 'es-ES'`, which is why the harness never notices. | Translate the six literals, or commit to i18n; do not leave half of it. |
| **M-4** | Design system | **`Tooltip` breaks the portal contract.** `Tooltip.tsx:115-137` portals to `body` without `useSurface()` and without `data-surface`, which `AGENTS.md` and DESIGN §5.3 require. Nothing looks broken today only because the tooltip's own tokens are surface-agnostic; the first `--ui-text`/`--ui-border` rule inside it would silently resolve the wrong binding. `Popover.tsx:48,70` is the reference. | `const surface = useSurface()` + `data-surface={surface}`. Two lines. |
| **M-5** | Design system | **`Toast` hard-codes the surface.** `Toast.tsx:69` sets `data-surface="panel"` instead of reading the context, and `Toast.module.css:22-26` paints `--ui-surface-raised`/`--ui-text`: a toast raised over a paper page is made of panel material. | `useSurface()` + `data-surface={surface}`. |
| **M-6** | Release | **No Content-Security-Policy anywhere** — not in `index.html`, not in `electron/main.cjs`, not in `src/`. With `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` and no remote content this is not exploitable today, but Electron logs its insecure-CSP warning on every launch and the renderer has no defence in depth if an XSS ever lands. | `session.defaultSession.webRequest.onHeadersReceived` CSP in the main process. A `<meta>` variant needs a hash for the inline theme boot script (`index.html:34-49`). |
| **M-7** | Design system | **The theme contract is untested.** `vite.config.ts:11-33` serialises `THEMES` into `index.html`, but nothing asserts that every key has a `[data-theme="…"]` block, that the block defines every consumed token, or that the hand-synced 4-hex `swatches` equal their named tokens. A renamed or added theme ships a palette that silently falls back to the Pergamino `:root` values, and the boot script cannot catch it because it reads the same source. (All 8 agree today — verified.) | `tests/theme-contract.test.ts`, ~20 lines parsing `themes.css`. |
| **M-8** | Design system | **The primitive palette escapes the semantic layer** in four places: `base.css:47`, `JournalPage.module.css:46` and `GalleryPage.module.css:53` (`color-mix(… var(--stone-1) …)` for the topbar/desk), and `Atmosphere.module.css:17-30,53-55,63,78-79` (`--bone`, `--bronze`, `--stone-0/1/2`). `AGENTS.md` allows only `--ui-*` in component CSS. No theme can retint the chrome independently of `--stone-1`, and the same one-line colour is copied three times. | Add `--ui-desk*` / `--ui-desk-halo` bound to the primitives, or write the desk canvas down as a documented exception in DESIGN §3.5. |
| **M-9** | Release / docs | **A stale comment says the release gate is red.** `e2e/a11y.spec.ts:56-61` still claims “the page before opening already carries the FileUploader and overdue-marker findings and the base matrix above keeps them red”. The suite is green (46/46, this run) and both findings are recorded as fixed in `e2e/FINDINGS.md`. Anyone auditing the release reads that and stops. | Delete or refresh the sentence. |

---

## 4. Still open — post-release backlog

Fixed in the resolution pass: L-1, L-2, L-3, L-5, L-9 (except the spinner duration), L-11 (except window state), L-12, L-13, L-14, L-15, L-16. What is left, with the reason it is not in this release:

| # | Lens | Finding | Why it waits |
| --- | --- | --- | --- |
| **H-2** | Release | The packaged app is still never launched in CI, and `electron/main.cjs` has no automated test. | It needs a display server in the runner (`xvfb-run`) and a decision on what the smoke test asserts. This machine has no X server either, so the CSP could not be seen in a real window here. Next step: export the pure `resolveRequest` and unit-test it, then add the launch step. |
| **M-2** | Logic | A failed `setItem` is still silent while the footer claims “Saved in this browser”. | The failure path is no longer destructive, only invisible; surfacing it needs a UX decision (footer wording vs. toast) that the review left to the owner. |
| L-4 | Design system | `Slider.tsx:109` references `styles.bubbleEnd`, which has no rule: the end bubble inherits the start rule and `--slider-value-bubble-min` is unused. | Moving the bubble when low ≈ high is a visual decision, not a mechanical one. |
| L-6 | Design system | Dead tokens: `--ui-required`, `--ui-paper-ring`, `--ui-overlay`, `--ui-scrim`, `--ui-surface-overlay`, `--ui-skeleton`, `--demo-gap`, `--demo-column-min`, `--z-dropdown` and twelve palette entries. | A purge across 8 palettes is a refactor. The new theme contract test pins the live set, so deleting the dead one is safe whenever it is scheduled. |
| L-7 | Design system | The page chrome is duplicated between `GalleryPage.module.css` and `JournalPage.module.css` (~55 identical rule bodies). | One `page-chrome.module.css` or `AppBar` extraction is structural and the browser matrix would have to re-cover it: not in the release commit. |
| L-8 | Design system | Portalled overlays read `--texture-grain-light` + `soft-light` directly instead of `--ui-paper-grain*`. | It changes the material of every sheet on light paper: needs the owner's eye on the 8 themes. |
| L-10 | Design system | The journal page title floors at 36 px while DESIGN §6.2 asks for a 44–72 px clamp. | Visual decision on the journal masthead. |
| L-11 | Release | No window-state persistence. | Feature, not a defect. |
| — | Tooling | `tests/theme-contract.test.ts` assembles the `node:fs` specifier at runtime to avoid adding `@types/node`, which is not in the tree. | Documented in the file and typechecked; add the dev-only types the next time the test is touched. |

---

## 5. What held up

Recorded because a first release should know what was actually probed, not only what broke.

**Electron security and protocol.** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, no preload, no remote origin (`main.cjs:162-167`). The `app://` scheme is registered before `whenReady` with `standard/secure/supportFetchAPI/corsEnabled/stream`, served through `net.fetch` only after ready, and traversal-guarded (`:33-44,59-65,204`). `/gallery` resolves through the extensionless SPA fallback and through the menu route. `will-navigate` and `setWindowOpenHandler` both deny and hand off to the shell; permission request/check handlers deny everything; single-instance lock and `setAppUserModelId` are in place.

**Packaging.** `appId` matches `APP_ID`, `files` carries `dist/**` + `electron/**` + `package.json` with `!node_modules/**`, `asar: true`, `npmRebuild: false`; both icons exist (`build/icon.png`, 512×512), `category: Utility`, `syncDesktopName: true` backed by `desktopName`, `--publish never` on both paths, `release/` gitignored.

**CI plumbing.** Every action major referenced by both workflows exists — checked against the GitHub API: `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `actions/cache@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v7`. `ci.yml` does gate lint + unit + build + e2e, installs Chromium with deps and uploads the report on failure; `desktop.yml` triggers on `v[0-9]*`, verifies before packaging, builds both OSes and creates the release with checksums. The release pipeline itself should run.

**Design-system invariants.** No raw colour in any `src/**/*.module.css` (only the documented `--xp-*`); every `font-size` is a scale token and nothing resolves below 14 px. The 8 theme blocks define an identical 59-token set, all 334 consumed custom properties resolve, `themes.ts` ≡ `themes.css` blocks ≡ the injected manifest, and all eight swatch quads match their named tokens. No `overflow: hidden` clips a popover; no `overflow-x: hidden`; no `100vw` outside `min()`; `min-width: 0` on Surface/Card/Field/TaskRow; `DemoGrid` always `columns={2|3}`. No `mix-blend-mode`, no `backdrop-filter`; the grain is one shared tile and the torn edge one shared `clip-path`; reduced motion is covered by zeroed duration tokens plus local guards. `!important` appears only in `.visually-hidden` and the reduced-motion reset, and every `outline: none` has a real replacement.

**Date and state correctness.** DST arithmetic holds in both directions (`Math.round` on a 23/25-hour gap, verified in New York and Lord Howe); `addDays`/`startOfMonth`/`addMonthsClamped` are local-date based; deadline keys round-trip and reject `2026-02-31` and non-leap `02-29`; no UTC/local mixing. An empty journal survives (`[]` is adopted, not treated as corrupt). Nothing is written per keystroke — drafts are component state and only committed mutations reach `setItem`. Every `rAF`, `setTimeout`, `ResizeObserver`, `visualViewport` and document listener has a matching teardown; no React 19 ref-return errors; focus restoration across delete/disable paths holds.

---

## 6. Release checklist

Done in the resolution pass:

- [x] `LICENSE` + `"license"` field (BLK-1).
- [x] `electron/**`, `electron-builder.yml`, `build/**`, `.nvmrc` in the CI path filter (BLK-2).
- [x] `storage` listener in `usePersistentState` (BLK-3).
- [x] Salvage on parse failure, `${key}-corrupt` stash, no seed-write over a corrupt payload (BLK-4).
- [x] `addNode` guarded against a second draft (H-1).
- [x] Tests for `QUESTS_KEY` and both parsers (H-3), which cover the new persistence contract.
- [x] Six Spanish literals translated; DESIGN vocabulary follows the code (M-3).
- [x] `useSurface()` in `Tooltip` and `Toast` (M-4, M-5).
- [x] CSP in the Electron main process (M-6).
- [x] Theme contract test (M-7); desk tokens (M-8).
- [x] Stale comment in `e2e/a11y.spec.ts` rewritten and README reconciled (M-9, L-14).
- [x] Full gate re-run on this tree: `pnpm typecheck && pnpm lint && pnpm test:run && pnpm build && pnpm test:e2e` → 124 unit, 51 e2e.

Still to do by the owner, on the release commit:

- [ ] `pnpm build:desktop` and launch the packaged app once by hand — the CSP header and the packaging have not been seen in a real window (§4, H-2).
- [ ] `git tag -a v0.1.0 && git push origin v0.1.0`; the desktop workflow overrides the version from the tag.
- [ ] Queue §4; H-2 and M-2 first, then the visual decisions (L-4, L-8, L-10) and the structural ones (L-6, L-7).

---

## 7. Method and confidence

- The three lenses were deliberately disjoint — state/persistence/React semantics, tokens/surfaces/responsive CSS, packaging/CI/security — and each was told what the others owned and what `REVISION.md` and `e2e/FINDINGS.md` had already closed, so nothing was re-litigated. The accepted `color-contrast: incomplete` nodes were excluded by instruction, not by oversight.
- Every blocker and high finding in §1–§2 was re-read in the source by the coordinating pass before being written here, and the line numbers are from that pass. Agents estimated BLK-1/BLK-2 as conditional; both were confirmed (no `LICENSE`, no `license` key; the `paths` anchor genuinely lacks the four globs), and the action-tag blocker one agent raised was **disproved** against the GitHub API.
- Not reproduced in a browser: BLK-3 (needs two real tabs), H-1 (needs a double click), L-1 (needs a real IME). They are traced end to end through five to ten lines each, and H-1 additionally through `chainClosed` in the model. Treat them as high-confidence, not as observed.
- Not measured again: contrast ratios (the harness does it in Chromium), the Electron app on a real desktop, Safari and Firefox, and screen-reader output. `DESIGN.md` §"Manual verification" still owns those.
- Out of scope: product and copy review beyond the language defect, the XP economy (not implemented per `PRODUCT.md`), and anything the `.drawio`-free mockup implies.

### Second pass — the resolution

- The fixes were split across three agents with disjoint file ownership (persistence and questline · surfaces, tokens and CSS · release plumbing, docs and tests) and then reviewed here, file by file, before the gate was run. Two agents reported deviations from the plan and both were the correct call: `webRequest` refuses custom-scheme URL patterns, so the CSP is gated on the origin inside the handler, and React's synthetic `KeyboardEvent` drops `isComposing`, so the task editor reads `nativeEvent`.
- Every unit test that closes a defect (BLK-3, BLK-4, H-1, M-1, L-1) was run against the old code first and failed there. No test was weakened, skipped or baselined to make the gate green, and no `disableRules` was added to axe.
- The fixes are visual-neutral by construction where that was the constraint: the desk tokens bind 1:1 to the primitives they replace, the focus-ring token is exactly `1px`, and the 16-pair axe matrix plus the 320–1440 px overflow matrix still pass unchanged.
- Still unverified here: the packaged window (no X server on this machine), two real browser tabs, a real IME and a screen reader. Those remain in `DESIGN.md` §"Manual verification".
