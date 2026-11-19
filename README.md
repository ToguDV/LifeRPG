# LifeRPG UI — Códice de Componentes

Galería interactiva de componentes React para una aplicación de tareas con la estética de **El Largo Invierno**: papel pergamino gastado, paneles de piedra, tinta, cera y ocho paletas de color.

El proyecto nace del mockup estático original (`design/mockup.html`) y lo convierte en un sistema de componentes reutilizables, con **tokens de diseño** para color, tipografía, espaciado, geometría de controles, sombras y movimiento.

## Arrancar

```bash
pnpm install
pnpm dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

La verificación E2E necesita Chromium. La versión fijada de Playwright usa la revisión `chromium-1248`; si no está en `~/.cache/ms-playwright`, instálala una vez con `pnpm exec playwright install chromium`.

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con recarga en caliente. |
| `pnpm build` | Comprueba tipos y genera `dist/` para producción. |
| `pnpm preview` | Sirve la build de producción. |
| `pnpm typecheck` | Solo la comprobación de TypeScript (incluye `tests/` y `e2e/`). |
| `pnpm lint` | ESLint: correctitud y accesibilidad (`jsx-a11y`), sin reglas de estilo. |
| `pnpm test` | Vitest en modo watch. |
| `pnpm test:run` | Vitest una sola vez, para verificación. |
| `pnpm test:e2e` | Auditoría en Chromium real: axe en los 8 temas × 2 superficies, estados abiertos, overflow a 320–1440 px, teclado/foco y sendero. |
| `pnpm test:e2e:report` | Abre el informe HTML de la última ejecución E2E. |

## Stack

- **Vite + React 19 + TypeScript**.
- **CSS Modules** por componente. Sin framework de UI ni librería de estilos.
- **CSS custom properties** como única fuente de verdad para el diseño.
- **ESLint** (flat config: `@eslint/js` + `typescript-eslint` + `jsx-a11y` + reglas de hooks) sin reglas de estilo: no reformatea el código.
- **Vitest + Testing Library** sobre jsdom, para las interacciones que originaron los bugs de la revisión.
- **Playwright + axe-core** sobre Chromium real para la verificación de accesibilidad, overflow y teclado (`pnpm test:e2e`).
- **Tipografías locales** en `public/fonts` (subconjunto latin de IM Fell English, IM Fell English SC, Cinzel, Grenze, Grenze Gotisch y Caveat).
- Popovers, calendarios, ruedas y menús propios; sin dependencias de fechas o de componentes.

## La galería

Una sola página con todas las piezas, navegación por secciones, selector de tema y un interruptor **Papel / Panel** que cambia la superficie de muestra de todas las tarjetas.

- **08 temas**: Pergamino (por defecto), Tiza, Catppuccin, Dracula, Nord, Gruvbox, Rosé Pine y Tokyo Night.
- **13 controles**: los 12 pedidos (Button, Checkbox, Radio, Switch, TextInput, Textarea, Select, Combobox, Slider, Stepper, Date/Time Picker y FileUploader) más `RangeSlider`.
- **Primitivas de apoyo**: Surface, Card, WaxSeal, Icon, Badge, ProgressBar, Tooltip, Divider y Toast.
- **Contenedores**: `Card` con tres alturas (ficha, pliego, página), ornamentos de papel (hojas apiladas y envejecidas, margen de cuaderno y lacre) y, sobre papel, el título en una cinta de cera que cruza el borde superior.
- **Compuestos de tarea**: TaskRow, TaskList, EmptyState y una demo final “El diario en marcha” que usa todo junto.
- **La travesía**: `Questline` encadena hitos con tareas y plazo; el sendero se entinta al cerrar un hito y la línea sigue conectada cuando el raíl envuelve. Hitos y tareas se crean, editan y eliminan en el sitio.

Todo es interactivo: escribe, filtra, abre calendarios y ruedas, arrastra archivos, marca tareas, elimina, cambia de tema y alterna papel/panel.

## Sistema de diseño

### Tokens

```
src/styles/
  fonts.css              @font-face de las familias locales
  tokens/
    primitives.css       tipografía, escala, espaciado, controles, motion, capas, texturas
    themes.css           paletas, tokens semánticos y superficies
  base.css               reset, lienzo, accesibilidad y utilidades globales
```

- `primitives.css` define la escala invariante: `--space-*`, `--text-*`, `--font-*`, `--control-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--z-*`, etc.
- `themes.css` contiene las ocho paletas. Cada tema solo cambia la tinta: colores, textura del papel y acentos semánticos.
- Los componentes **nunca leen colores de paleta directamente**. Leen tokens semánticos `--ui-*` (`--ui-text`, `--ui-accent`, `--ui-field-bg`, `--ui-danger`…).
- Los valores de layout que no pueden ser variables CSS —breakpoints y geometría de los SVG decorativos— viven en sus módulos; el resto de color, espaciado y tipografía sale de tokens.

### Superficies

Hay dos materiales, y un mismo control se adapta a ambos:

- **Papel** (`data-surface="paper"`): tinta oscura sobre pergamino en Pergamino; tinta clara sobre cartulina oscura en los otros temas.
- **Panel** (`data-surface="panel"`): piedra oscura con acentos metálicos.

El componente `Surface` propaga el contexto por React y pone `data-surface` en el DOM. Los popovers portaleados recuperan ese contexto con `useSurface`, de modo que un calendario abierto dentro de una hoja sigue siendo de papel, y uno abierto en un panel sigue siendo de panel.

El tema activo se guarda en `localStorage` (`liferpg-ui-theme`) y se aplica antes del primer pintado para evitar parpadeos. En el `<html>` se escriben `data-theme` y `data-paper`. `src/theme/themes.ts` es la única lista de temas: un plugin de `vite.config.ts` inyecta esa lista en el script de arranque de `index.html`.

### Añadir un tema

1. Añade una entrada en `src/theme/themes.ts` (clave, etiqueta, meta, tipo de papel y muestras).
2. Añade su bloque de paleta en `src/styles/tokens/themes.css` con los tokens `--stone-*`, `--bone-*`, `--panel-*`, `--parch`, `--ink-*`, `--ribbon-*`, etc.

No hay que tocar ningún componente ni `index.html`: el script de arranque se genera desde `THEMES`.

## Accesibilidad

- Etiquetas asociadas, roles ARIA y estados (`aria-expanded`, `aria-checked`, `aria-activedescendant`, `aria-selected`, `aria-valuenow`, `aria-live`).
- Navegación completa por teclado en Select, Combobox, calendario, rueda de hora, menú de temas y controles nativos.
- «Saltar al contenido» es el primer elemento enfocable y lleva el foco a `main#contenido`.
- El tooltip es hoverable y se descarta con `Escape` (WCAG 1.4.13); los toasts se pausan con hover y con foco de teclado (WCAG 2.2.1).
- Prioridad y vencimiento de `TaskRow` no dependen del color; `ProgressBar` exige `label` o `aria-label`; `RangeSlider` se anuncia como grupo.
- Foco visible y devuelto al disparador al cerrar con `Escape`.
- Cierre por clic fuera y por pérdida de foco.
- `Questline` deriva el bloqueo y el vencimiento del estado de las tareas; los hitos bloqueados se abren para preparar la lista, pero sus checkboxes están deshabilitados. El cierre de un hito se anuncia en una región `status`.
- `prefers-reduced-motion` desactiva animaciones y transiciones.
- `pnpm test:e2e` audita la galería completa con axe-core (WCAG 2.0/2.1 A y AA + best practices) en los **8 temas × 2 superficies**, más el panel, el editor y la confirmación de borrado de `Questline` y los popovers de Select, Combobox y DatePicker. Los estados abiertos se comparan con el estado anterior para que un hallazgo heredado no oculte el que introduce el overlay.
- **Hallazgos abiertos** en la primera ejecución del arnés (los tests están en rojo a propósito, no hay línea base): `label-content-name-mismatch` en las tres zonas de `FileUploader` (el nombre accesible es la label del campo y no contiene el texto visible de la zona); contraste del marcador vencido de `Questline` sobre panel en Pergamino, Nord y Gruvbox; contraste del número del índice activo en Nord (4.42:1); texto del panel de `Questline` sobre papel en Pergamino (4.18–4.2:1); botón de borrado sobre panel (4.02:1). El `DatePicker` conserva el hallazgo conocido de `REVISION.md` §3 en las celdas de día: está documentado en el test y excluido solo en esa pasada. Detalle con selectores y ratios en [`e2e/FINDINGS.md`](e2e/FINDINGS.md).
- axe deja cientos de nodos de `color-contrast` en `incomplete` sobre las texturas de papel y panel. El arnés los imprime y los adjunta por separado; **no cuentan como aprobados** y el contraste sigue necesitando revisión manual.

Atajos principales:

| Control | Teclas |
| --- | --- |
| Select / Combobox | `↑` `↓` `Home` `End` `Enter` `Esc`; escribir filtra en Combobox. |
| DatePicker | Flechas para el día, `Home`/`End` para la semana, `PageUp`/`PageDown` para el mes, `Shift` + `PageUp`/`PageDown` para el año, `Enter`, `Esc`. |
| TimePicker | `↑` `↓` cambian la rueda enfocada, `PageUp`/`PageDown` saltan cinco, `Home`/`End`, `Enter`. |
| Menú de temas | Flechas, `Home`/`End`, `Enter`, `Esc`. |

## Estructura

```
LifeRPG/
  index.html                 entrada de Vite (tema antes del primer paint)
  design/mockup.html         mockup estático original conservado
  public/fonts/              fuentes locales .woff2
  eslint.config.js           flat config: correctitud y accesibilidad, sin estilo
  vitest.config.ts           Vitest + jsdom + setup de Testing Library
  playwright.config.ts       E2E: Vite en 4317, Chromium, trazas al fallar
  tests/                     un archivo por asunto, escritos contra roles y nombres
  e2e/                       axe (8 temas × 2 superficies), overflow y teclado
  e2e/FINDINGS.md            hallazgos abiertos de la primera pasada
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
      GalleryPage.tsx        página única con índice, temas y superficies
      sections/              una sección por familia de componentes
      Demo.tsx               rejillas, grupos, filas y notas de las demos
    lib/                     cx, estado controlado, floating, dismiss, fechas y formato
    styles/                  fuentes, tokens, temas y base
    theme/                   metadata, provider y selector de temas
```

## Notas

- **DatePicker / TimePicker** son implementaciones propias: no hay `input type="date"` ni dependencias de calendario. El calendario empieza en lunes y respeta `min`, `max` y fechas deshabilitadas. La rueda de hora trabaja en pasos configurables.
- **FileUploader** valida tipo y tamaño, permite arrastrar y soltar, muestra miniaturas de imágenes y lista de archivos. No sube nada a un servidor: la demo es 100% local.
- **Toast** es una demo en memoria; los avisos se apilan, se pausan al pasar el cursor y mientras el foco de teclado está dentro, y se cierran solos.
- **Questline** no guarda estados de bloqueo: se derivan de las tareas. El plazo vive en el hito (`deadline` como `YYYY-MM-DD`), no en la tarea. El sendero es un SVG decorativo medido en el navegador; en jsdom no se pinta, así que su continuidad se revisa a mano.
- El mockup original sigue en `design/mockup.html`, con `design/fonts/local.css` apuntando a las fuentes locales de `public/fonts`.

## Documentación de diseño

- `DESIGN.md` — decisiones de diseño, modelo de tokens, temas, superficies, tipografía, accesibilidad y límites.
- `AGENTS.md` — mapa de archivos principales, convenciones y recetas para trabajar en el proyecto.
- `design/mockup.html` — referencia estática original.

## Créditos

Diseño original del diario, la paleta y los temas: el mockup `El Largo Invierno — Diario de la Marca Hueca`. Esta versión lo convierte en un kit React con tokens y componentes interactivos. Tipografías: Google Fonts, distribuidas bajo SIL Open Font License.
