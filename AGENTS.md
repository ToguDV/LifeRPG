# AGENTS.md — Operating guide

> **LifeRPG**: an RPG-style to-do app where tasks are quests. This repository is its UI layer — design system, components, the journal screen and the Component Codex gallery. The journal is local-only: `localStorage`, no backend.
> This file is short on purpose: commands, rules you cannot infer from the code, and traps.
> Before touching styles, tokens, themes or surfaces, read **`DESIGN.md`**; for the product direction read **`PRODUCT.md`**.

## Commands

```bash
pnpm dev          # http://localhost:5174
pnpm typecheck    # TypeScript, no emit
pnpm lint         # ESLint + check:docs (this file) + check:type (reading floors)
pnpm test:run     # Vitest on jsdom
pnpm test:e2e     # Playwright: axe, overflow and keyboard in real Chromium
pnpm build        # typecheck + production build
pnpm dev:desktop   # Electron on the Vite server (hot reload)
pnpm build:desktop # NSIS (Windows) or AppImage + deb (Linux) into release/
```

- Before handing off: `pnpm typecheck && pnpm build && pnpm lint && pnpm test:run && pnpm test:e2e`.
- If the harness Chromium is missing: `pnpm exec playwright install chromium`.

## Where to look

- `src/components/<Name>/` — one component per folder (`<Name>.tsx` + `.module.css`).
- `src/styles/tokens/` — `primitives.css` (invariants) and `themes.css` (8 palettes + `--ui-*`).
- `src/theme/` — `themes.ts` (the only theme list), provider and picker.
- `src/lib/` — `useControllableState`, `useFloating`, `useDismiss`, `cx`, dates and formatting.
- `src/gallery/` — the gallery is the review surface at `/gallery`. Every demo sheet is a `Card size="lg"` with the component name in the `Badge` of the `kicker`.
- `src/journal/` — the first official screen at `/`: task list and questline, stored in `localStorage`.
- `electron/` — Electron main process: `app://liferpg` protocol for `dist/`, window and menu. `electron-builder.yml` packages it; `.github/workflows/desktop.yml` releases tags.
- `tests/` (jsdom, one subject per file) and `e2e/` (real Chromium).
- `DESIGN.md` — the visual why · `README.md` — usage and structure · `design/mockup.html` — original reference.

## Rules

**Tokens.** In `src/components/**/*.module.css` there are no raw colours, font sizes or main spacings: only `--ui-*`, `--space-*`, `--text-*`, `--control-*`. The raw palette lives in `themes.css` (documented exception: `--xp-*`). A value that repeats becomes a token. Every theme defines `--accent-panel`, `--accent-paper` and `--danger/success/warning-*`.

**Type.** Nothing is set below 14 px: `--text-xs` is the floor and `pnpm lint` fails on a smaller step or a raw size. Anything meant to be read stays at `--text-prose` (15 px), a note on `--text-note-sm` (16 px). A label recedes through tracking, weight or contrast, never through size; density comes from padding.

**Surfaces and portals.** `Surface` gives material; `Card` when there is also a header, a wax seal and a list. Anything portalled (`Popover`, `Dialog`, tooltips, toasts, menus) calls `useSurface()` and sets `data-surface` on the floating node or loses the material. The paper shadow is `--ui-paper-drop`. Do not put `overflow: hidden` on a card that may host a popover.

**Editors.** Forms that edit a row use the centred `Dialog` (scrim, blur, focus trap, scroll lock), never an inline form or an anchored `Popover`: opening one must not reflow the container. `Popover` stays for menus and pickers.

**Forms.** `Field` for label, hint, error and required; `getFieldMessageId` for the ids; `useControllableState` for `value`/`onChange`/`defaultValue`. Errors with `role="alert"` and `aria-invalid`. Keep the native semantics of checkbox, radio, switch and range.

**Overlays.** `Popover` + `useFloating` + `useDismiss`. Initial focus in `requestAnimationFrame`; Escape returns focus to the trigger; a click outside closes. Select and Combobox do not move focus: `aria-activedescendant` on the trigger/input. In Combobox, `anchorRef` is the whole container, not just the input.

**Accessibility.** Accessible name, full keyboard traversal, visible and restored focus, states with text or aria in addition to colour, `prefers-reduced-motion`. `pnpm lint` is the quick check; `pnpm test:e2e` (axe WCAG 2 A/AA, 8 themes × 2 surfaces, no baseline) is the one that rules.

**Responsive.** No horizontal scroll from 320 to 1440 px, and you fix the element: never with `overflow-x: hidden`. `min-width: 0` on cards and fields. Demos use `DemoGrid` with `columns={2}` or `{3}`, not `auto-fit` with spans.

**Themes.** Adding one touches only `src/theme/themes.ts` and `themes.css`. The list for the `index.html` boot script is injected by the `liferpg-theme-manifest` plugin in `vite.config.ts`: do not hand-write it. `themes.ts` imports nothing from the browser (Vite reads it).

**Tests.** One file per subject, no globals (import from `vitest`) and written against roles, accessible names and visible text; no full snapshots, no asserts on classes. Fixed clock only with `vi.useFakeTimers({ toFake: ['Date'] })`. jsdom has no layout: rects, overflow and painted contrast are judged in `e2e/`.

## Traps

- **Contrast `incomplete`: closed.** axe cannot compose textured backgrounds. The owner reviewed those nodes by hand in the 8 themes and accepted them on 2026-11-18. It is not pending: do not report it and do not propose measuring it again.
- **Shared port 4317.** `playwright.config.ts` uses `reuseExistingServer`: two worktrees at once share a server and one audits the other's code. Change `PORT` or stop the other server.
- **Font preload.** `index.html` preloads `alegreya-400-700` and `cinzel-400-700`; if you change the body font or rename the file, update the `href` or it will be downloaded twice.
- **Accent contrast.** The primary button text sits on the dark band of the gradient; light paper does not use `--ink-3` directly for muted. Measure before lightening.
- **Art performance.** The torn edge is a shared `clip-path` (`#ui-torn-clip`), not a per-card filter; the paper shadow is `box-shadow`. No `mix-blend-mode` on fixed layers, no `backdrop-filter` on the topbar. The grain is a shared background tile, not a per-element filter.
- **`design/mockup.html`** is the original reference: adjust it only to keep it working, not to mirror the app.
- **No Storybook** and no UI, Tailwind or date library; local fonts, no CDN. Do not add dependencies without justifying it.
- **Desktop protocol.** The packaged renderer is served from `dist/` over `app://liferpg`, not `file://`: Chromium refuses ES modules from a file origin. Extensionless paths fall back to `index.html`, so `/gallery` works in-app, and `release/` is gitignored.

## Manual verification

The harness does not cover everything: check the 8 themes on paper and panel (especially the Nord/Gruvbox reds), test with a screen reader, Safari and Firefox, and leave the console clean.

## Maintaining this file

Budget: **90 lines, 8,000 characters, 6 sections and no tables**. `pnpm lint` enforces it with `scripts/check-docs.mjs` and fails if you go over; raising the budget means editing the script by hand.

This is not an inventory: files are discovered with `ls` and `rg`. Before adding something, ask yourself whether an agent would work it out in a minute by reading the code; if the answer is yes, it does not belong here. Usage goes to `README.md`, the visual why to `DESIGN.md` and findings to `e2e/FINDINGS.md`.
