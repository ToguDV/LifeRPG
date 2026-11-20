# DESIGN.md — Design decisions

> Reference document for **LifeRPG — UI layer**.
> LifeRPG is an RPG-style to-do app: real tasks are written as quests, grouped into milestones and completed along a route the journal remembers. This document covers the UI layer, which is the phase under construction.
> It explains what was decided, why, and where each decision lives in the code.
> If you change a visual or interaction rule, update this file.

---

## 1. Concept

LifeRPG is a to-do list played as a role-playing game. Real commitments are written as quests, grouped into milestones and completed along a route the journal remembers. The interface is the traveller's winter notebook: a task journal that is also an object, and the home of the game's reading layer.

The product is in the **UI planning phase**. This document is about materials, hierarchy and interaction; the application layer, the XP economy and persistence are not implemented yet (see `PRODUCT.md`). The starting point is the static mockup **The Long Winter — Journal of the Hollow Mark** (`design/mockup.html`).

The React version does not try to be a “generic dark theme”. It tries to preserve three things from the mockup:

1. **Matter**: worn paper, grain, torn edges, stone panels, wax and ink.
2. **Hierarchy**: what matters is read first; decoration does not compete with the content.
3. **Flexibility**: eight inks and two surfaces without duplicating components.

The aesthetic rests on typography, texture and colour. **No parchment images or external icons are used**: the textures are generated SVGs and the icons are a bespoke set of paths. The gamification is a reading layer on top of that material: a task must stay legible and quick to write before it becomes a quest.

---

## 2. Principles

### 2.1 Structure does not change with the theme

A theme only changes the ink: colours, contrast, paper texture and accents. Geometry, hierarchy, sizes and control behaviour are identical across the eight palettes.

This allows:

- Testing a component once and trusting that it will look right in every theme.
- Adding a palette without touching components.
- Switching themes without the page “jumping”.

### 2.2 Two materials, one control

A control can live on **paper** or on **panel**. They are not two different components: they are two token contexts. The same `Button`, `Checkbox` or `TextInput` recolors itself.

### 2.3 Material before ornament

Textures and torn edges are used to build the feel of paper, not to fill space. Heavy SVG filters are limited to the background layer of the cards; the content is not filtered.

### 2.4 Italic annotation is state, not decoration

The italic of the body face is reserved for notes, hints, subheadings and secondary values. It serves to narrate state (“2 de 3 provisiones”, “Has sellado el diario 2 veces”) without competing with the main text: there is one reading face, and a note is the same face leaning.

Critical information does not rest on italic text alone: there is always a label, a value or an ARIA state backing it. A note is written in muted ink, never in the accent: the accent belongs to the state itself — a value, a danger, a completion — not to the sentence that narrates it.

### 2.5 Accessibility inside the material

Focus, error, disabled and selection states are part of the visual system, not a layer added at the end. Contrast was tuned per theme and keyboard navigation is part of each control's definition.

---

## 3. Token model

Tokens are organised into four layers. The rule is simple: **a component never reads a raw palette**.

```
Layer 1 · theme palette          --stone-0, --bone, --parch, --ink, --ribbon-2, --vital-1…
Layer 2 · surface semantics      --ui-panel-*, --ui-paper-*
Layer 3 · context bindings       --ui-text, --ui-surface, --ui-accent, --ui-field-bg…
Layer 4 · invariant primitives   --space-*, --text-*, --font-*, --control-*, --radius-*, --duration-*
```

### 3.1 Raw palette

It lives in `src/styles/tokens/themes.css`. Each theme defines, at minimum:

- `--stone-0…3`: desktop / panel background.
- `--bone`, `--bone-dim`, `--bone-faint`: ink on panel.
- `--parch`, `--ink`, `--ink-2`, `--ink-3`: paper and ink on paper.
- `--panel-1…3`, `--well`, `--paper-raised`: surfaces.
- `--ribbon-1…3`: wax / primary button.
- `--vital-1…3`: health, stamina, satiety and states.
- `--ribbon-*`, `--map-*`, `--xp-*`, `--pin-*`: world-specific accents.
- `--accent-panel`, `--accent-paper`, `--danger-*`, `--success-*`, `--warning-*`: the theme's semantic decisions, including the `-text` variant of each state.

The `-text` variant is the only one that may be used as `color`; the base token is left for borders and fills and `-soft` for backgrounds.

### 3.2 Surface semantics

Two sets are defined in the same file:

- `--ui-panel-*`: text, borders, fields, accents, states and selection for panels.
- `--ui-paper-*`: the same roles for paper.

They are then mapped to the context tokens:

```css
[data-surface="paper"] {
  --ui-text: var(--ui-paper-text);
  --ui-field-bg: var(--ui-paper-field-bg);
  --ui-accent: var(--ui-paper-accent);
  /* … */
}
```

`data-surface="panel"` does the same with the panel tokens. The page default is panel.

### 3.3 Tokens the components use

Components consume, among others:

| Group | Tokens |
| --- | --- |
| Text | `--ui-text`, `--ui-text-soft`, `--ui-text-muted`, `--ui-placeholder` |
| Surface | `--ui-surface`, `--ui-surface-raised`, `--ui-surface-sunken`, `--ui-surface-overlay` |
| Borders | `--ui-border`, `--ui-border-strong`, `--ui-divider`, `--ui-divider-soft` |
| Fields | `--ui-field-bg`, `--ui-field-bg-hover`, `--ui-focus` |
| Action | `--ui-accent`, `--ui-accent-strong`, `--ui-accent-soft`, `--ui-accent-contrast` |
| Primary button | `--ui-primary-bg`, `--ui-primary-bg-hi`, `--ui-primary-bg-lo`, `--ui-primary-text`, `--ui-primary-edge` |
| States | `--ui-danger`, `--ui-success`, `--ui-warning` (+ `-soft`, `-text`) |
| Shadows | `--shadow-sm/md/lg/xl`, `--shadow-inset`, `--shadow-wax` |
| Focus | `--ui-focus`, `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-style` |

### 3.4 Invariant primitives

They live in `src/styles/tokens/primitives.css`:

- Spacing: 4 px rhythm (`--space-1`…`--space-24`) with 1 and 2 px micro-tokens.
- Typography: families, scale, line heights, tracking, weights.
- Control geometry: 30/38/44 px heights, paddings, icons, checkbox, radio, switch, slider, wheel, calendar, dropzone.
- Shapes: radii from 1 to 4 px, circles and pills.
- Shadows: derived from `--ui-shadow-color`, so they change with the surface.
- Motion, layers (`--z-*`), textures and texture geometry.
- Global layout: page width, gutter, sidebar, reading measure, section gaps.

### 3.5 Rules and exceptions

- **Rule**: in `src/components/**/*.module.css` no raw colours, type sizes or main spacings are written. Tokens are used.
- **Intentional exception**: `ProgressBar variant="xp"` uses `--xp-1` and `--xp-2` directly, because experience is a world colour, not a surface colour.
- **Documented exception**: `src/theme/themes.ts` repeats four hex values per theme in `swatches` for the theme selector. The selector shows palettes that are **not** applied, so it cannot read the custom properties at runtime; the copy is the contract. The swatches are, in order, `--stone-0` (desktop; `--panel-1` in Parchment), `--parch`, `--ink` and the theme's title accent (`--crimson`, `--chalk-rouge`, `--bronze` or `--bronze-soft`), and each entry names its tokens in the code. Retouching a palette means touching both files in the same change.
- **Practical exception**: `@media` breakpoints, the geometry of the decorative SVGs, the 1 px `visually-hidden` pattern and some art details cannot be or should not be tokenised. They are documented in the corresponding modules.
- UI copy and API names are in English.

---

## 4. Themes

### 4.1 The eight themes

| Key | Name | Paper | Intent |
| --- | --- | --- | --- |
| `pergamino` | Parchment | Light | The canonical theme: light paper on a dark desktop. |
| `chalk` | Chalk | Dark | Black card stock, chalk and clay. |
| `catppuccin` | Catppuccin | Dark | Mocha, mauve and rose. |
| `dracula` | Dracula | Dark | Purple night. |
| `nord` | Nord | Dark | Polar cold, blue and cyan. |
| `gruvbox` | Gruvbox | Dark | Leather, amber and rust. |
| `rosepine` | Rosé Pine | Dark | Faded rose and mauve. |
| `tokyonight` | Tokyo Night | Dark | Veiled neon. |

The difference between Parchment and the rest is not simply “light vs. dark”: Parchment has **real light paper** over a dark desktop; the rest have **dark card stock**, with the same geometry and the same material feel.

### 4.2 Selection and persistence

- `<html data-theme="…" data-paper="light|dark">`.
- `ThemeProvider` writes both attributes and stores the key in `localStorage` (`liferpg-ui-theme`).
- The inline script in `index.html` applies the theme before the first paint to avoid a flash of Parchment. `src/theme/themes.ts` is the only list of themes: the `liferpg-theme-manifest` plugin in `vite.config.ts` serializes the keys and their `paper` inside the script in `serve` and in `build`. There is no second hand-written list.
- `color-scheme` is derived from `data-paper` in `base.css`, not from the palette: `html[data-paper="light"]` gives a light scheme and the rest, dark. This way the caret, autofill and native controls follow the paper from the first paint. In Parchment the change is most noticeable in the caret and the autofill background: the scrollbar keeps its themed `scrollbar-color`, so it does not lighten over the dark desktop (only a browser that ignores that property would draw a light track).
- `data-paper` allows the paper texture to be tuned without duplicating selectors per theme:
  - `light`: light gradients, grain with `multiply`.
  - `dark`: faint grain with `screen`, deeper shadows.
- When the theme changes, `html.theme-switching` is added for two frames so the palette changes like ink, not like an animation of every property.

### 4.3 Paper accent vs. panel accent

It is a deliberate decision:

- **Paper** uses a warm “ink” accent: `--chalk-rouge` in the dark themes, `--crimson` in Parchment. This makes controls look stamped onto the sheet.
- **Panel** uses the theme's metallic accent: mauve, cyan, gold, blue, etc. This makes controls look like hardware on stone.

The result is that the same control changes temperature when switching Paper / Panel. It is part of the material narrative, not an inconsistency.

### 4.4 Contrast

Concrete decisions to keep legibility without losing the aesthetic:

- The light paper's “muted” text is mixed 30/70 between `--ink-3` and `--ink-2`; at 50/50 it stayed at 4.22:1 over the Questline panel well.
- The dark paper's “muted” text is mixed 88/12 between `--ink-3` and `--ink-2`: Rose Pine fell to 4.29:1 over its sunken sheet.
- The panel's “muted” text is mixed 70/30 between `--bone-faint` and `--bone-dim`; it keeps the hierarchy and gains contrast.
- State accents have two roles per surface. `--ui-danger`, `--ui-success` and `--ui-warning` remain the badge's border, fill and dot; `--ui-danger-text`, `--ui-success-text` and `--ui-warning-text` are the only ones used as text. The variant is declared per theme and surface (`--danger-panel-text`, `--danger-paper-text`, …) and is mixed toward the surface ink only when the base accent does not reach 4.5:1: Nord's overdue marker goes from 2.74:1 to 4.86:1 over `--panel-1`; Parchment's danger button, from 4.02:1 to 5.59:1 over its tint; Parchment's completed kicker, from 4.18:1 to 5.51:1. On light paper, the final success and warning mix drops to 65/35 and 55/45 to cover the badge tint and the sunken sheet as well.
- Nord's strong panel accent is mixed 92/8 with `--bone`: the active index number was at 4.42:1 over `--ui-accent-soft` and goes to 4.66:1. The size was not lowered to fix it.
- The primary button does not simply use the ribbon colour: `--ui-primary-bg` mixes 72 % of `--ribbon-2` with 28 % of `--stone-0`.
- The primary gradient concentrates the brightness in the top 24 %; the centre and the text rest on the dark colour. This allows white on wax in all themes, including Catppuccin, Rosé Pine and Tokyo Night.
- Error states use `--danger-paper` / `--danger-panel` for border and fill, and their `-text` variant for the message; the health red is not reused without context.
- Focus is a 1 px dashed border with a 3 px offset. In compact controls the adjusted 1 px offset is used.

### 4.5 Adding a theme

1. Add the entry in `src/theme/themes.ts` with key, label, meta, `paper`, and the four swatches.
2. Add the palette and the semantic accents in `src/styles/tokens/themes.css`.

Neither a component nor `index.html` is touched: the boot script is regenerated from `THEMES`. If the theme needs light paper, `paper: 'light'`; if not, `paper: 'dark'`.

---

## 5. Surfaces

### 5.1 Paper

- Base colour `--parch`, light and shadow gradients, SVG grain.
- Irregular edge via the fixed silhouette `#ui-torn-clip` (a `clipPath` in `objectBoundingBox`) on the texture layer, never on the content.
- Outer shadow **always dark**: `box-shadow` with `--ui-paper-drop` (warm ink on light paper, black on dark card stock), not a `drop-shadow` that rasterises the whole card.
- Inset vignette shadow, with no perimeter glows.
- Light, shadow, and grain stack in **a single** texture layer: the edge gradients live in the same `background-image`, not in an extra pseudo-element.
- Optional, very slight `tilt` (`±0.22deg`) so the sheets do not look like perfect cards.
- The texture layer sits below the content (`z-index`) and `Surface` isolates the stacking context.

**No halo.** Dark card stock does not project light: on `data-paper="dark"` there is no luminous inner edge, no top veil, no light shadow. The edge is defined by a dark vignette and a black shadow, and the only light is that of the paper itself. The seven dark palettes share that behaviour; Parchment keeps its warm shadow because its ink is dark.

**Paint cost.** Paper is the most expensive part of the interface, which is why it is painted with cheap layers: a shared geometry `clip-path` instead of a per-sheet `feDisplacementMap`, a `box-shadow` instead of a `drop-shadow` on the subtree, and no full-screen `mix-blend-mode`. Masks (`mask-image`) are used only when geometry cannot replace them. Any new layer must be measured with performance in mind: concatenating filters per card was the reason the gallery took seconds to paint.

**Ornaments.** `Surface` accepts optional physical layers. All of them are decorative (`aria-hidden`), they are painted under the content, and they are turned off with a prop; they exist only on paper.

| Prop | Layer | Tokens |
| --- | --- | --- |
| `stack="single\|double"` | Sheets under the card, offset 9 and 19 px; they are told apart by tone, with no border or rim. | `--paper-sheet-*`, `--ui-paper-sheet-back*` |
| `margin="rule"` | 12 px ruled frame drawn inside the torn edge, on all four sides. | `--paper-frame-inset` |
| `stains` | Water stains and a tide mark, only in the footer; the gradient itself fades them outside the text, with no mask. | `--ui-paper-stain*` |

The sheets underneath are tinted with `--bronze` (paper kept in a drawer: somewhat darker and yellower) and share the torn silhouette of the main paper. The paint order is the physical one: the deepest sheet first, the one touching the card on top. **In no theme do they draw a rim**: there is no lit edge and no shadowed seam, and the stack reads only by depth of tone, each sheet darker than the one before. Of the rim only the border is visible, so it does not repeat the grain: that full tile per sheet was another expensive layer with no visible difference.

Below 640 px the stack offset drops to 4 and 9 px. The page margin on mobile is 16 px, and a sheet peeking out 19 px widened the document, not just the card; with the reduced offset the decoration fits within the margin and the stack still reads by tone. It is art geometry, so it lives with the rest of the ornament tokens (`primitives.css`).

The wax seal lives apart: `WaxSeal` stamps the folio in wax with the primary action tokens and announces “Folio N” with `role="img"`. The wax is drawn as SVG with three paths —the wax that overflows, the irregular body, and the die ring—, so the silhouette is never a circle; the shadow follows that silhouette with `drop-shadow` on the container.

**Containers.** `Card` is the reusable sheet: header (kicker, title, description, wax seal), rule, body, and an italic footer. `tilt` is the same ornament from `Surface` and is ignored on panel. Three heights, with the same material and the same ornaments:

- `sm`: 21 rem card, medium padding, `--text-lg` title.
- `md`: 30 rem folio, large padding, `--text-xl` title.
- `lg`: full page, large padding, `--text-2xl` title.

**The title ribbon.** On paper the title is not a line of text: `RibbonTitle` takes it to a wax ribbon that crosses the torn top edge. It shares the primary action tokens (`--ui-primary-*`), like the wax seal, and adds no reflections, filters, or `backdrop-filter`: the band is a three-stop gradient and the tails are two static `clip-path`s.

The band is raised by the padding inherited from `Surface` (`--surface-pad`) plus `--card-ribbon-rise`; that way it crosses the rim at all three heights without repeating measurements. Below it, the ribbon reserves the drop of the tails plus `--space-4` before the header. The tails live behind the band, peek out `--card-ribbon-tail-peek`, and hang `--card-ribbon-tail-drop`; the swallowtail notch is cut with `clip-path` from the visible peek. The band is limited to `100% - 2 × asomo`, so the decoration never grows the document. Below 640 px the peek drops to 1 rem and the title one scale step so the ribbon still fits at 320 px.

The tails are `aria-hidden` layers; the real `<h3>` lives inside the band and still names the card. The container creates no landmarks. On panel the ribbon is not painted: the title goes back to being a normal heading.

Below 720 px the three collapse to the column width; the ruled frame stays, because it costs no content width.

The `Card` header is a `<div>`, not a `<header>`: a card reused directly in the `body` would turn its title row into a second `banner` landmark. The container emits no landmarks; the inner `<h3>` (in the ribbon or in the panel header) still names it.

### 5.2 Panel

- `--panel-*` background with gradient, grain, and a 1 px border.
- No torn edge.
- Top inner glow and inner vignette to simulate stone.
- Elevation with `--shadow-lg`/`--shadow-xl`.

### 5.3 Context propagation

`Surface` does two things:

1. It sets `data-surface` in the DOM.
2. It provides a React `SurfaceContext`.

Popovers render into a portal to the `body`, outside the visual tree. So that they keep the material, `Popover` reads `useSurface()` and writes `data-surface` on the floating element. That is why a calendar opened over a sheet is made of paper, and one opened over a panel is made of panel.

---

## 6. Typography

### 6.1 Families and roles

Two families carry the whole kit, and nothing else is loaded:

| Token | Family | Use |
| --- | --- | --- |
| `--font-body` | Alegreya | Everything read, labelled or counted: prose, inputs, descriptions, control labels, buttons, badges, counters and the italic of every note. |
| `--font-display` | Cinzel | Headings only: page title, card and ribbon titles, section titles, months, large headers. |

Alegreya is a book face with a true italic and a 400–700 range, so the roles that used to cost a family are now styles: the 14 px uppercase label is the body face at weight 600 with tracking, and a note is the body face in italic. Cinzel is a Roman titling face and its lowercase is small caps, so a heading is set in caps by the face and needs no `text-transform`.

Both families are served locally from `public/fonts` (latin subsets of Google Fonts, SIL Open Font License). `@font-face` is in `src/styles/fonts.css`.

`index.html` preloads with `crossorigin` the two families painted in the first viewport: `alegreya-400-700.woff2` (body and every label) and `cinzel-400-700.woff2` (headings). Renaming those files forces an update of the preload `href`; if it does not match the `@font-face` `src`, the browser downloads the font twice.

### 6.2 Scale and hierarchy

- Scale from `--text-xs` (14 px) to `--text-6xl` (72 px). Nothing in the kit is set below 14 px.
- `--text-xs` is the floor and the only step under the body size: uppercase metadata, badges, counters and the labels of the smallest controls. They read as metadata through `Alegreya` at weight 600, uppercase, tracking and weight, not through being tiny. When a label needs to recede, it loses contrast, not size.
- Two reading roles sit on top of the scale: `--text-prose` (15 px) for descriptions, hints, messages and tooltips, and `--text-note` (18 px) / `--text-note-sm` (16 px) for an italic note.
- Control labels: 14 px, `Alegreya` 600, uppercase, wide tracking.
- Body text: 15 px, `Alegreya`, 1.5 line height.
- Card titles: `Cinzel` at 28 px.
- Page title: `Cinzel` with `clamp()` between 44 and 72 px.
- Notes: `Alegreya` italic at 16–18 px, `--leading-note`. Alegreya's italic shares the roman's x-height, so a note is not set apart by a smaller size: the slant and the muted ink are the signal. 16 px is the floor and 18 px the size when the note speaks. It is never used for information that is not also in normal text or in an accessible attribute.
- Colour on a note is not emphasis: a note that reports state is written in muted ink and the accent colours the value or the state word, so the eye has a reason to go there.

### 6.3 Reading decisions

- No sustained uppercase in paragraphs.
- The 14 px floor is absolute: nothing is set at 11, 12 or 13 px. Anything meant to be read stays at `--text-prose` (15 px) and an italic note never goes below `--text-note-sm` (16 px). A description shrinks its width, not its size: the small card keeps the prose step. `pnpm lint` fails on a step under the floor.
- Density is bought with padding, not with type: compact controls keep their 30/38/44 px heights and the floor size, and lose padding or tracking instead.
- The italic is the note voice and the empty field: notes, hints, asides, placeholders and short quotes. Running prose stays roman, and a paragraph is never set in italic.
- Uppercase labels always carry `letter-spacing` and sit at the floor size; contrast was adjusted so they remain legible.
- Value numbers, counters, and folios use `font-variant-numeric: tabular-nums` when alignment matters.
- Month names come already capitalised from `Intl`, so no extra casing rule is applied to the heading.

---

## 7. Colour, states, and elevation

### 7.1 Colour structure

Each theme has:

- A **desktop** (`--stone-*`) that is not the paper.
- A **paper** (`--parch`, `--paper-raised`) with its own ink (`--ink-*`).
- A **panel** (`--panel-*`) with bone ink (`--bone-*`).
- A **ribbon** (`--ribbon-*`) for the primary action.
- **World states** (`--vital-*`) and UI states (`--danger-*`, `--success-*`, `--warning-*`, with their `-text` variants).

### 7.2 Controls

- Field background: 4 % ink tint on paper; dark well on panel.
- Border: 1 px with a blend of the text; hover raises the border to a stronger tone.
- Focus: accent border + 1 px ring, dashed outline.
- Error: border in `--ui-danger` and message in `--ui-danger-text`; the label also switches to the text variant.
- Disabled: `opacity: 0.45` and `not-allowed` cursor; colour is not the only cue.
- Selection: accent background with contrast text; the check/radio use `--ui-accent-contrast`.

### 7.3 Buttons

- **Primary**: wax/ribbon with a dark gradient and `--pin-hi` text. It is the only action allowed to be “solid and loud”.
- **Secondary**: raised surface with border and faint grain; the desk tool.
- **Ghost**: no background until hover; tertiary actions.
- **Danger**: danger outline and tint, not a saturated red block.
- Sizes: 30/38/44 px; icon only = square.
- States: loading with an integrated spinner, disabled, full width, icons on the left/right.

### 7.4 Shadows and depth

Shadows are derived from `--ui-shadow-color`:

- Light paper: warm ink in `--ui-paper-drop`, so the sheet casts a paper shadow.
- Dark paper: black in `--ui-paper-drop`; never the light ink, which would draw a halo.
- Panel: `--stone-0`, for a black stone shadow.

There are no “neon” shadows and no glassmorphism. Depth comes from layers, borders, grain, and a subtle top light.

---

## 8. Spacing, shape, and texture

- 4 px base rhythm; the 1 and 2 px tokens exist for optical offsets.
- Small radii: 1–4 px. There are no rounded 16 px cards.
- Circles only for checkbox/radio/switch, calendar days, and icon buttons.
- Control heights: 30/38/44 px. The `md` size (38 px) is the gallery standard.
- Textures:
  - General grain: SVG `feTurbulence` with two variants (normal and faint).
  - Paper: grain multiplied or screened depending on `data-paper`.
  - Panel: grain with `overlay` blend.
  - Torn edges: normalised silhouette `#ui-torn-clip` defined once in `TornSilhouette`. It is a `clipPath` with `clipPathUnits="objectBoundingBox"`, deterministic and shared by all sheets; it replaces the old `feTurbulence` filters, which were reevaluated per card on every paint.
  - Physical paper: stacked and aged sheets, the ruled frame, and edge stains, with geometry in `primitives.css` and colour in `themes.css`.
- Icons are custom 24×24 paths with `currentColor`, 1.5 stroke, and rounded caps.

---

## 9. Motion

- Durations: 80 / 140 / 220 / 320 / 480 ms.
- Main easing: `cubic-bezier(.2,.8,.25,1)`.
- Only what communicates state is animated: menu opening, chevron change, spinner, toast, button hover.
- There are no card entrance animations and no parallax.
- `prefers-reduced-motion` takes all durations to 0 and stops motes/spinner.
- Theme switching disables transitions for two frames to prevent every colour from being interpolated.

---

## 10. Component patterns

### 10.1 Forms

- All complex fields use `Field`: label, label aside, hint, error, and `-hint`/`-error` ids.
- The `<label>` carries the id `${id}-label` (`getFieldLabelId`) and is what names the portaled popups; `hideLabel` hides it with `visually-hidden`, never omits it.
- Messages are connected with `aria-describedby`; the error uses `role="alert"`.
- `hint` and `error` coexist: the error is painted first and the hint after, and `aria-describedby` lists `-error` and `-hint` in that order (`getFieldMessageIds`). The error never makes the hint disappear, so a control that passes both still explains how to correct it.
- Clearing `TextInput` is a real edit: focus returns to the input and `onChange` receives `''` in both controlled and uncontrolled mode. `onClear` is extra work (`onChange` has already fired), not the only way to empty the field.
- Controls accept controlled/uncontrolled through `useControllableState`.
- Native inputs keep native semantics whenever possible.
- Checkbox/Radio/Switch use visually hidden native inputs and a styled “box”; focus is drawn on the box, not on the invisible input.

### 10.2 Popovers

- `Popover` + `useFloating` + `useDismiss`.
- Fixed position computed against the trigger; `side` is respected whenever it fits, and flipping top/bottom is only the fallback when the preferred side has no room.
- It is portaled to `body` to escape the paper's `overflow` and filters.
- It closes on outside click, `Escape` and focus loss.
- `Escape` returns focus to the trigger.
- The surface is propagated with `useSurface`.
- The portaled popup is also page content: either it is a landmark in its own right or it lives inside one. `Select` and `Combobox` mark the floating node as a `region` named by the field; the pickers and the theme selector use `role="dialog"`.
- The tooltip keeps `role="tooltip"` on the measured node, and the portaled node lives inside a `region` named by the trigger: that way the notice does not end up outside every landmark and the tooltip still contains text only.
- The tooltip is hoverable (WCAG 1.4.13): it receives pointer events while open, an invisible bridge crosses the 8 px gap to the anchor, and a click on the notice does not reach what is behind it. `Escape` dismisses it without moving focus.
- `aria-controls` is only emitted while the popup is open (`open ? id : undefined`): `Popover` unmounts on close and no hidden popups are rendered.
- A `<header>` inside a portaled popup would create a second `banner`; overlay and picker headers are `<div>`.

### 10.3 Select and Combobox

- Select: focus stays on the trigger; the listbox is controlled with `aria-activedescendant` and arrow-key navigation, Home/End, Enter, Escape and typing (typeahead).
- Combobox: editable input with a normalised filter (accent-insensitive), arrows, Enter, Escape and clearing.
- The Combobox positioning anchor is the **whole control**, not just the input, so that clearing or pressing the chevron is not interpreted as an outside click.
- Initial focus for portaled menus happens in a `requestAnimationFrame`, after the portal and the refs are mounted.

### 10.4 Calendar

- Custom calendar, no `input type="date"`.
- Monday as the first day; 6 weeks (42 cells) to avoid height jumps.
- Out-of-month dates visible and dimmed.
- `min`, `max` and `isDateDisabled`; a disabled day is focusable but not selectable.
- Roving tabindex: only the focused day has `tabIndex=0`.
- Keyboard: arrows, Home/End, PageUp/PageDown, Shift+PageUp/PageDown, Enter, Escape.
- It opens with focus on the selected date or on today.

### 10.5 Time wheel

- 24 h format; minutes in configurable steps.
- Two listboxes with scroll-snap and a central selection band.
- Scrolling updates the draft; “Ahora”, “Limpiar” (optional) and “Aplicar”.
- “Ahora” rounds the minutes down to the previous step (`Math.floor`), so it never jumps to the next hour: at 09:58 with a 5-minute step it yields 09:55.
- `minuteStep` is normalised once to an integer between 1 and 60; `0`, negative values and non-finite values fall back to 5 so the wheel is neither blocked nor left repeating a single option.
- Initial focus goes to the hour wheel after the portal mounts.
- The wheel is operated with arrows, PageUp/PageDown, Home/End, Enter and Escape.

### 10.6 FileUploader

- 100 % local: there is no server upload.
- Accepts click, drag & drop and keyboard (Enter/Space).
- Validates `accept`, `maxSize` and `maxFiles` with explanatory messages.
- `accept` understands the catch-all wildcard (`*/*` or `*`), type wildcards (`image/*`), MIME types and extensions (`.pdf`), ignoring case and spaces.
- Image thumbnails via `URL.createObjectURL` with cleanup.
- The list allows removal; the file input stays hidden and out of the tab order, while the dropzone is the accessible control: it is named by the `Field`'s visible `<label>` (`getFieldLabelId`) plus the drag instruction, it is described by the hint and it exposes `aria-invalid` when there is an error.

### 10.7 Slider and Stepper

- Slider and RangeSlider use overlapping native inputs; the styling is applied to the thumb and the track.
- The range uses two thumbs and keeps the low/high order.
- `RangeSlider` groups the two thumbs in a `role="group"` named by the `Field`'s `<label>`; each thumb keeps its `aria-label` (“Minimum value”/“Maximum value”) and both receive `aria-invalid` when there is an error.
- `className` is shared between the two range inputs; `fieldClassName` is used for the container.
- Marks at the ends align the label inward so it does not spill outside the control.
- Stepper uses a native number input with the ends disabled once the limits are reached.

### 10.8 Toast

- Context + portal, viewport at the bottom right.
- Stacks up to four notices; they pause on hover and while keyboard focus is inside, and they close on their own. On resuming, the full duration is granted again, never the remainder of an already expired timer.
- The viewport is an `aria-live="polite"` region with a label.
- They are not persisted; they are session state.

### 10.9 Questline

- Route organism: a chain of milestones (`QuestNode`) and, inside each one, tasks (`QuestTask`). The model is independent of the UI: stable ids, `title`, `note`, `deadline` and `tasks`.
- **State is not stored.** `getQuestNodeStates` derives it from the completion of the preceding milestones. A milestone is completed when it has at least one task and all of them are checked; an empty milestone is a draft and does not open the next door. An already completed milestone remains editable even if an earlier one is reopened, so the chain does not swallow work already done.
- **The deadline lives on the milestone, not on the task** (product decision). `deadline` is a local `YYYY-MM-DD` key; it is compared with today's date and shown short in the rail (“12 Jan”) and long in the panel. Going overdue does not lock: it only tints the milestone with danger. The comparison uses local dates, never `toISOString`. `today` lives in the organism's state and is refreshed when returning to the tab and when crossing midnight, so that “Due today” does not go stale.
- **Interaction**: the milestone is a disclosure button (`aria-expanded` / `aria-controls`) that opens an accordion panel **below the entire rail**. The accordion was chosen over an anchored popover because the full CRUD —dates, tasks, delete confirmation— does not fit in a floating menu and on mobile it would cover the route. The panel is named by its `<h4>` and behaves as a `region`.
- **CRUD**: create, rename, set dates on and delete milestones; create, rename and delete tasks. When a milestone is added, its editor opens with focus on the name. Deleting a milestone asks for a two-step confirmation: when it opens, focus goes to “Cancel” and on cancel it returns to “Delete milestone”. When the panel closes, focus returns to the trigger.
- **A locked milestone opens** and its tasks can be created, edited and deleted, but not checked: the checkbox is the only closed gesture. The lock note names **all** pending milestones ahead (“…starting with “A”” when there is more than one): a locked one is also incomplete, and naming only the first promised an unlock that does not happen. `description` is avoided on the `Checkbox` because its description lives inside the `<label>` and would widen the accessible name; the reason is shown in the note and the state in hidden text.
- **Locked and overdue at the same time.** The derived state can only be one, but the deadline runs all the same: rail and panel carry `data-overdue` in addition to `data-state="locked"`, and the overdue tint is applied without losing the lock, the dashed border or the word “Locked”.
- **A single owner for the announcement.** The chain's `role="status"` is the only one that writes: it receives the delete notice and the state transitions compared **by id**, not by position. Deleting a milestone in front of a completed one is no longer announced as a completion, and the delete message is not overwritten. Re-locks and real unlocks (`locked → active/overdue`) are announced too, not the positional neighbour.
- **Vocabulary:** “close” belongs only to the panel (“Close panel”); completing is said as “complete / completed” (“Complete this milestone to open the next one”, “· completed”, badge “Completed”). “Finish the journey” is the end of the route.
- **Focus:** the panel takes focus on opening (except when it is born in edit mode, where the name's `autoFocus` wins) and returns it to the trigger on closing. Escape steps back one layer: confirmation → milestone editor → task editor → panel; the pickers and the task editor consume their own Escape with `preventDefault`. After renaming or deleting a task, focus goes to the neighbouring row, not to the whole panel, and it is brought on screen with `scrollIntoView({ block: 'nearest' })`.
- **Draft:** when a milestone is added it is inserted and its editor opens; if it is cancelled without being touched (same title, no tasks, note or deadline) it is discarded. Any save or task edit keeps it. That way an empty “New milestone” does not block the chain.
- **The note belongs to the author:** it is shown in the panel but not edited, even though `QuestNodePatch` accepts it for consumers that edit the model.
- **Controlled/uncontrolled API** with `useControllableState`: `nodes` + `onChange`, or `defaultNodes`. Every mutation emits the full array; the component persists nothing.
- **The trail** is a decorative SVG (`aria-hidden`, `pointer-events: none`) behind the rail. `useQuestTrail` measures markers and stops with a `ResizeObserver` and draws segments between them; if a row wraps, the route goes down, crosses the row gap and re-enters through the first milestone of the next one. That way the line stays connected without `overflow-x` or horizontal scroll. The segment leaving a completed milestone is inked with `--ui-accent`; the pending one uses `--ui-border-strong`. The corner radius and the `stroke-dasharray` are art geometry and stay local.
- **jsdom neither measures nor implements `ResizeObserver`**: the hook paints nothing and the component keeps working. The trail geometry, the painted contrast and real focus are verified with `pnpm test:e2e` in Chromium, not in Vitest.
- **A single `STATE_META`** (`questline-state.ts`) gives icon, accessible word, label and badge variant to the four states; the rail and the panel can no longer diverge (that is how it slipped in that the active state had no word). The components are split across `QuestRail`, `QuestStop`, `QuestNodePanel`, `QuestNodeEditor`, `QuestTaskRow` and `QuestDeleteConfirm`.
- **The goal** is the last milestone: its status line carries “Goal” and the flag icon. It is a reading of the end of the route, not a model field, and it moves if the last milestone is added or removed.

---

## 11. Gallery

The gallery is the system's review surface; Storybook is not used.

- A single page, eleven sections.
- Sticky side index on desktop; horizontally scrollable index on mobile.
- Scroll-spy with `IntersectionObserver`.
- Theme selector dialog with swatches, metadata and keyboard navigation.
- Global **Paper / Panel** switch: every card and control changes surface.
- The demo sheets are `Card size="lg"` with no wrapper of their own: the badge with the component name comes in through `kicker`, the title goes on the ribbon over paper and the folio in the wax seal. That way the gallery shows the real container and not a clone.
- Each demo includes italic notes with the current state so the behaviour is visible without opening the devtools.
- The section “In context” uses every pattern in a real mini todo-list.
- The section “The journey” demonstrates the three states of a milestone (completed, overdue and locked), the full CRUD and the trail that gets inked. Its deadlines are relative to today so the states remain true when the gallery is opened.
- The section “Containers” shows `Card` in its three heights with the list of components from other sections.
- The first focusable element is “Skip to content”, which points to `main#content` (`tabIndex={-1}`) and lives out of flow with `position: fixed` so the topbar is not moved.
- The theme selector keeps one word visible (“Theme”) when the full name does not fit; the surface toggle keeps “Paper”/“Panel” as an explicit name even though its labels are visually hidden on mobile.

---

## 12. Responsive

- The page uses a fluid gutter (`clamp`) and a maximum width of 90 rem.
- Desktop: sticky index + content.
- ≤ 1180 px: the topbar links are hidden.
- ≤ 1024 px: the layout switches to one column; the index becomes a horizontal row.
- ≤ 980 px: the three-column grids go to two.
- ≤ 860 px: masthead in two rows; stats and intro stack.
- ≤ 720 px: the demo grids go to one column.
- ≤ 640 px: compact topbar; the surface toggle's labels are visually hidden but stay in the accessibility tree; the theme selector shows “Theme” instead of the full name; the masthead crest disappears to give the title width.
- `Questline` wraps in rows: the route is measured and drawn in an SVG that goes down and re-enters on the next row, and the panel is placed below the whole rail. No horizontal scroll at 320 px.
- The page must not produce horizontal scroll at any width between 320 and 1440 px. It was verified at 320, 375, 480, 768, 1024 and 1440 px (and 640 px in the previous review). `body { overflow-x: hidden }` is not used: below 640 px the stacked sheets are rescaled with `--paper-sheet-offset-*` and, if something overflows, the element is fixed, not hidden.

---

## 13. Accessibility

- Associated labels; `aria-describedby` for hints and errors.
- ARIA roles and states on listboxes, combobox, calendar, wheels, theme dialog and progressbar.
- Visible focus with a dashed accent outline.
- Focus returned to the trigger when closing with Escape.
- `aria-live` on toasts; `role="alert"` on errors.
- Every control has an accessible name; decorative icons are `aria-hidden`.
- Toasts have a labelled close button.
- `prefers-reduced-motion` respected.
- axe-core WCAG 2 A/AA + best-practices audit automated with `pnpm test:e2e` across the 8 themes × 2 surfaces and the open states, with no baseline: today **0 violations**. The harness found, and we fixed, five contrast and accessible-name findings.
- **Contrast over textures: closed.** axe leaves in `incomplete` the nodes whose background is a gradient, an image or has pseudo-elements on top (the paper and panel textures). The project owner reviewed those nodes by hand in the 8 themes and accepted them as valid; they are not counted as an open finding and tools to measure them are not proposed again. The harness prints them as diagnostics.
- The initial focus of popovers is delayed by one frame so the portal is mounted before focus moves and it does not close because of “focus out”.
- Portaled listboxes are named by the `Field`'s `<label>` (`getFieldLabelId`), not by the trigger: a `combobox` is not named by content.
- `required` is exposed with `aria-required` where the role allows it (`Select`, `Combobox`); on the `DatePicker`/`TimePicker` triggers and on groups it is announced as the description “Required”, because `aria-required` is not valid on `role="button"` or on `role="group"`. The pickers do not take part in native validation (hidden input): the consumer validates on submit.
- The skip link is the first focusable element and moves focus to `main#content`; programmatic focus does not depend on the browser moving the sequence.
- `ProgressBar` requires a name by types: a visible `label` or an `aria-label`; the percentage is value text and cannot be the name.
- `TaskRow` mirrors priority and overdue in `visually-hidden` text, linked with `aria-describedby`; colour stops being the only signal (WCAG 1.4.1).
- Toasts pause on hover and on keyboard focus (WCAG 2.2.1); the viewport remains a single `aria-live="polite"` region so announcements are not duplicated.
- `Questline` exposes `aria-expanded` / `aria-controls` on each milestone, names the panel with its heading, focuses it on opening and returns focus to the trigger on closing. Each milestone carries its number and its state in `visually-hidden` text; transitions are announced by id in a `status` region (“Milestone “X” completed”, ““Y” unlocked/locked”).
- Locked milestones disable the checkbox (not the preparation CRUD) and explain the reason in a visible note; the state does not depend on colour: the marker changes shape and the note carries a lock.

---

## 14. Known limits and trade-offs

- **Local-first, not connected**: the journal keeps its tasks and milestones in `localStorage`. There is no backend, account, sync, XP economy or notification layer yet; FileUploader and Toast remain local demos.
- **No router**: `/` and `/gallery` are a pathname switch. A static host needs an SPA fallback for `/gallery`; the gallery is a single page with anchors.
- **No Storybook**: the gallery page fills that role and is the review deliverable.
- **Interaction tests, not layout tests**: Vitest + Testing Library cover behaviour and `pnpm test:e2e` measures in Chromium the trail, the widths (320–1440 px), the keyboard and axe; jsdom measures none of that.
- **Questline without reordering**: the order of milestones and tasks is narrative; there is no drag and drop.
- **Paper and performance**: the torn silhouette is shared geometry and the shadow is a `box-shadow`. There is no going back to a turbulence filter per sheet or to a `drop-shadow` over the subtree: measured in the gallery, that multiplied the raster cost by more than two and dropped frames while scrolling. The grain is still an `feTurbulence` SVG, but it is rasterised once as a background image, not per element.
- **Breakpoints and art**: media query values and SVG geometry are not tokenised because CSS does not allow variables in media queries and art is geometry, not system design.
- **Themes**: there is no separate global “light/dark mode”; the paper type is part of each theme.
- **Grenze Gotisch**: it is not part of the kit. The reference mockup still sets its masthead with it, so the file lives in `design/fonts/` and is not served with the app.

---

## 15. Where each decision lives

| Decision | File |
| --- | --- |
| Product direction and UI-phase scope | `PRODUCT.md` |
| Invariant tokens | `src/styles/tokens/primitives.css` |
| Palettes, semantics and surfaces | `src/styles/tokens/themes.css` |
| Reset, canvas, global focus, reduced motion | `src/styles/base.css` |
| Local fonts | `src/styles/fonts.css`, `public/fonts/` |
| Paper/panel material and context | `src/components/Surface/` |
| Surface propagation to portals | `src/components/Popover/`, `useSurface` |
| Theme, persistence and selector | `src/theme/` |
| Wax button and states | `src/components/Button/` |
| Questline: model, states and deadlines | `src/components/Questline/questline-model.ts` |
| Measured Questline trail | `src/components/Questline/useQuestTrail.ts` |
| Fields and messages | `src/components/Field/`, `TextInput`, `Textarea` |
| Calendar and wheel | `src/components/DatePicker/`, `TimePicker/` |
| Gallery and demo cards | `src/gallery/` |
| Reference mockup | `design/mockup.html` |
