# LifeRPG

**An RPG-style to-do list.** Real-life tasks are written as quests, grouped into milestones and completed along a route the journal remembers.

> **Status: UI planning phase.** This repository holds the UI layer of LifeRPG: design tokens, the component set and the **Component Codex** gallery used to decide and verify the interface. There is no application state, routing, persistence or backend yet. The product direction, the intended loop and the open decisions live in [`PRODUCT.md`](PRODUCT.md).

The visual starting point is the static mockup **The Long Winter — Journal of the Hollow Mark** (`design/mockup.html`): worn parchment, stone panels, ink, wax and eight colour palettes. The work so far turns that mockup into a system of reusable components, with **design tokens** for colour, typography, spacing, control geometry, shadows and motion — the foundation the app's screens will be built from.

## What the app will be

LifeRPG is a journal, not a backlog. The player writes real tasks, gives them a place on a route, completes them and watches the journal record the progress: the route inks in, milestones unlock and experience accumulates. The game is a reading layer over real work — the task stays the unit of work, and the journal has to be a good task journal before it is a good game.

The UI already contains the pieces this loop needs: `Questline` for milestones and their tasks, `TaskList` for the daily list, `ProgressBar` for meters, `Card` and `Surface` for the materials, and `Toast` for notices. The XP economy, the application state and the real screens are still to be designed; the current phase is about making the interface ready to carry them. [`PRODUCT.md`](PRODUCT.md) explains the pillars, the loop and what is still open.

## Getting started

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (by default `http://localhost:5174`).

E2E verification needs Chromium. The pinned Playwright version uses revision `chromium-1248`; if it is not in `~/.cache/ms-playwright`, install it once with `pnpm exec playwright install chromium`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload. |
| `pnpm build` | Type-checks and produces `dist/` for production. |
| `pnpm preview` | Serves the production build. |
| `pnpm typecheck` | TypeScript only (includes `tests/` and `e2e/`). |
| `pnpm lint` | ESLint: correctness and accessibility (`jsx-a11y`), no style rules. |
| `pnpm test` | Vitest in watch mode. |
| `pnpm test:run` | Vitest once, for verification. |
| `pnpm test:e2e` | Audit in real Chromium: axe on the 8 themes × 2 surfaces, open states, overflow from 320 to 1440 px, keyboard/focus and trail. |
| `pnpm test:e2e:report` | Opens the HTML report of the last E2E run. |

## Stack

- **Vite + React 19 + TypeScript**.
- **CSS Modules** per component. No UI framework and no styling library.
- **CSS custom properties** as the single source of truth for the design.
- **ESLint** (flat config: `@eslint/js` + `typescript-eslint` + `jsx-a11y` + hooks rules) with no style rules: it does not reformat the code.
- **Vitest + Testing Library** on jsdom, for the interactions that originated the review bugs.
- **Playwright + axe-core** on real Chromium for accessibility, overflow and keyboard verification (`pnpm test:e2e`).
- **Local fonts** in `public/fonts` (latin subset of IM Fell English, IM Fell English SC, Cinzel, Grenze, Grenze Gotisch and Caveat).
- Popovers, calendars, wheels and menus of our own; no date or component dependencies.

## The Component Codex

The gallery is the review surface of the UI planning phase: a single page with every piece, section navigation, a theme picker and a **Paper / Panel** switch that changes the sample surface of every card. It is not the app yet — it is where the app's interface is being decided and demonstrated.

- **8 themes**: Parchment (default), Chalk, Catppuccin, Dracula, Nord, Gruvbox, Rosé Pine and Tokyo Night.
- **13 controls**: the 12 requested ones (Button, Checkbox, Radio, Switch, TextInput, Textarea, Select, Combobox, Slider, Stepper, Date/Time Picker and FileUploader) plus `RangeSlider`.
- **Support primitives**: Surface, Card, WaxSeal, Icon, Badge, ProgressBar, Tooltip, Divider and Toast.
- **Containers**: `Card` with three heights (card, folio, page), paper ornaments (stacked, aged sheets, a ruled frame inside the edge and wax seal) and, on paper, the title on a wax ribbon that crosses the top edge.
- **Task composites**: TaskRow, TaskList, EmptyState and a closing demo “The journal at work” that uses everything together.
- **The journey**: `Questline` chains milestones with tasks and a deadline; the trail inks in when a milestone is completed and the line stays connected when the rail wraps. Milestones and tasks are created, edited and deleted in place.

Everything is interactive: type, filter, open calendars and wheels, drop files, check tasks, delete, switch themes and toggle paper/panel.

## Design system

### Tokens

```
src/styles/
  fonts.css              @font-face for the local families
  tokens/
    primitives.css       typography, scale, spacing, controls, motion, layers, textures
    themes.css           palettes, semantic tokens and surfaces
  base.css               reset, canvas, accessibility and global utilities
```

- `primitives.css` defines the invariant scale: `--space-*`, `--text-*`, `--font-*`, `--control-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--z-*`, etc.
- `themes.css` holds the eight palettes. Each theme only changes the ink: colours, paper texture and semantic accents.
- Components **never read palette colours directly**. They read semantic `--ui-*` tokens (`--ui-text`, `--ui-accent`, `--ui-field-bg`, `--ui-danger`…).
- Layout values that cannot be CSS variables —breakpoints and the geometry of the decorative SVGs— live in their modules; every other colour, spacing and typography value comes from tokens.

### Surfaces

There are two materials, and the same control adapts to both:

- **Paper** (`data-surface="paper"`): dark ink on parchment in Parchment; light ink on dark card stock in the other themes.
- **Panel** (`data-surface="panel"`): dark stone with metallic accents.

The `Surface` component propagates the context through React and sets `data-surface` in the DOM. Portalled popovers recover that context with `useSurface`, so a calendar opened inside a sheet is still paper, and one opened on a panel is still panel.

The active theme is stored in `localStorage` (`liferpg-ui-theme`) and applied before the first paint to avoid flicker. `data-theme` and `data-paper` are written on `<html>`. `src/theme/themes.ts` is the only list of themes: a plugin in `vite.config.ts` injects that list into the `index.html` boot script.

### Adding a theme

1. Add an entry in `src/theme/themes.ts` (key, label, meta, paper type and swatches).
2. Add its palette block in `src/styles/tokens/themes.css` with the `--stone-*`, `--bone-*`, `--panel-*`, `--parch`, `--ink-*`, `--ribbon-*`, etc. tokens.

No component and no `index.html` needs touching: the boot script is generated from `THEMES`.

## Accessibility

- Associated labels, ARIA roles and states (`aria-expanded`, `aria-checked`, `aria-activedescendant`, `aria-selected`, `aria-valuenow`, `aria-live`).
- Full keyboard navigation in Select, Combobox, the calendar, the time wheel, the theme menu and native controls.
- “Skip to content” is the first focusable element and moves focus to `main#content`.
- The tooltip is hoverable and is dismissed with `Escape` (WCAG 1.4.13); toasts pause on hover and on keyboard focus (WCAG 2.2.1).
- `TaskRow` priority and overdue status do not rely on colour; `ProgressBar` requires `label` or `aria-label`; `RangeSlider` is announced as a group.
- Focus is visible and returned to the trigger on closing with `Escape`.
- Closing on click outside and on loss of focus.
- `Questline` derives locking and overdue from the state of the tasks; locked milestones open so the list can be prepared, but their checkboxes are disabled. Completing a milestone is announced in a `status` region.
- `prefers-reduced-motion` disables animations and transitions.
- `pnpm test:e2e` audits the whole gallery with axe-core (WCAG 2.0/2.1 A and AA + best practices) across the **8 themes × 2 surfaces**, plus the `Questline` panel, editor and delete confirmation and the Select, Combobox and DatePicker popovers. Open states are compared against the previous state so that an inherited finding does not hide the one the overlay introduces.
- **Findings from the first hands-on run** (all fixed; the log with selectors and ratios is in [`e2e/FINDINGS.md`](e2e/FINDINGS.md)): `label-content-name-mismatch` in the three areas of `FileUploader` (the accessible name was the field label and did not contain the visible text of the area); contrast of the `Questline` overdue marker on panel in Parchment, Nord and Gruvbox; contrast of the active index number in Nord (4.42:1); `Questline` panel text on paper in Parchment (4.18–4.2:1); delete button on panel (4.02:1). The `DatePicker` kept the known finding from `REVISION.md` §3 in the day cells until the day name dropped the zero padding.
- axe leaves hundreds of `color-contrast` nodes in `incomplete` over the paper and panel textures. The project owner reviewed them by hand in the 8 themes and accepted them as valid (2026-11-18); the harness prints them and attaches them as diagnostics, not as a pending finding.

Main shortcuts:

| Control | Keys |
| --- | --- |
| Select / Combobox | `↑` `↓` `Home` `End` `Enter` `Esc`; typing filters in Combobox. |
| DatePicker | Arrows for the day, `Home`/`End` for the week, `PageUp`/`PageDown` for the month, `Shift` + `PageUp`/`PageDown` for the year, `Enter`, `Esc`. |
| TimePicker | `↑` `↓` move the focused wheel, `PageUp`/`PageDown` skip five, `Home`/`End`, `Enter`. |
| Theme menu | Arrows, `Home`/`End`, `Enter`, `Esc`. |

## Structure

```
LifeRPG/
  index.html                 Vite entry (theme before first paint)
  design/mockup.html         original static mockup, kept
  public/fonts/              local .woff2 fonts
  eslint.config.js           flat config: correctness and accessibility, no style
  vitest.config.ts           Vitest + jsdom + Testing Library setup
  playwright.config.ts       E2E: Vite on 4317, Chromium, traces on failure
  tests/                     one file per subject, written against roles and names
  e2e/                       axe (8 themes × 2 surfaces), overflow and keyboard
  e2e/FINDINGS.md            open findings from the first pass
  src/
    App.tsx
    main.tsx
    components/
      Button/ Checkbox/ Radio/ Switch/ TextInput/ Textarea/
      Select/ Combobox/ Slider/ Stepper/ DatePicker/ TimePicker/
      FileUploader/ Surface/ Card/ Icon/ Badge/ ProgressBar/ Tooltip/
      Divider/ Toast/ EmptyState/ TaskList/ Questline/ Field/ Popover/
      Ornaments/
    gallery/
      GalleryPage.tsx        single page with index, themes and surfaces
      sections/              one section per component family
      Demo.tsx               grids, groups, rows and notes for the demos
    lib/                     cx, controlled state, floating, dismiss, dates and formatting
    styles/                  fonts, tokens, themes and base
    theme/                   metadata, provider and theme picker
```

## Notes

- **DatePicker / TimePicker** are our own implementations: there is no `input type="date"` and no calendar dependency. The calendar starts on Monday and honours `min`, `max` and disabled dates. The time wheel works in configurable steps.
- **FileUploader** validates type and size, supports drag and drop, shows image thumbnails and a file list. It uploads nothing to a server: the demo is 100% local.
- **Toast** is an in-memory demo; notices stack, pause on hover and while keyboard focus is inside, and close by themselves.
- **Questline** stores no locked state: it is derived from the tasks. The deadline lives on the milestone (`deadline` as `YYYY-MM-DD`), not on the task. The trail is a decorative SVG measured in the browser; jsdom does not paint it, so its continuity is checked by hand.
- The original mockup is still in `design/mockup.html`, with `design/fonts/local.css` pointing at the local fonts in `public/fonts`.

## Design documentation

- `PRODUCT.md` — what LifeRPG is, the intended loop, the current UI planning phase and the open product decisions.
- `DESIGN.md` — design decisions, token model, themes, surfaces, typography, accessibility and limits.
- `AGENTS.md` — operating guide for agents: commands, non-obvious rules and traps. It has a closed budget (`pnpm check:docs`).
- `design/mockup.html` — original static reference.

## Credits

Original design of the journal, the palette and the themes: the `The Long Winter — Journal of the Hollow Mark` mockup. This repository builds LifeRPG's UI layer on top of it: tokens, interactive components and the codex gallery. The game and its data layer are not implemented yet. Typography: Google Fonts, distributed under the SIL Open Font License.
