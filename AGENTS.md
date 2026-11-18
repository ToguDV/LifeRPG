# AGENTS.md — Guía para agentes

> Proyecto: **LifeRPG UI — Códice de Componentes**.
> Antes de tocar estilos, componentes o temas, lee **`DESIGN.md`**. Ahí están las decisiones de diseño, el modelo de tokens, las superficies y las reglas de accesibilidad. Este archivo es el mapa operativo del repositorio.

---

## 1. Arranque rápido

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck    # TypeScript, sin emitir
pnpm build        # typecheck + build de producción
pnpm preview      # sirve dist/
pnpm lint         # ESLint: correctitud y accesibilidad
pnpm test         # Vitest en modo watch
pnpm test:run     # Vitest una vez, sin watch
```

- Stack: **Vite + React 19 + TypeScript + CSS Modules**.
- Herramientas de desarrollo: **ESLint** (flat config, `jsx-a11y`, `typescript-eslint`) y **Vitest + Testing Library** sobre jsdom. No imponen estilo de código.
- Sin framework de UI, sin Tailwind, sin librería de fechas.
- Las fuentes son locales (no hay CDN).
- `pnpm-workspace.yaml` aprueba el build de `esbuild`; no lo elimines sin motivo.

---

## 2. Archivos principales

### Documentación

| Archivo | Rol |
| --- | --- |
| **`DESIGN.md`** | **Decisiones de diseño, tokens, temas, superficies, tipografía, accesibilidad y límites.** Léelo antes de cambiar la estética. |
| `README.md` | Introducción, comandos, resumen de componentes, atajos y estructura. |
| `AGENTS.md` | Este mapa operativo y lista de archivos principales. |

### Configuración y entrada

| Archivo | Rol |
| --- | --- |
| `package.json` | Dependencias y scripts. No añadir librerías de UI sin justificarlo. |
| `pnpm-lock.yaml` | Lockfile. |
| `pnpm-workspace.yaml` | Aprobación de build de `esbuild` y `minimumReleaseAgeExclude` de las versiones recién publicadas que usa la suite. |
| `tsconfig.json` | TypeScript estricto, `noUnusedLocals`, `noUnusedParameters`. Incluye `src`, `tests` y las configuraciones de Vite y Vitest. |
| `vite.config.ts` | Vite + plugin React. |
| `vitest.config.ts` | Vitest con entorno jsdom, `tests/setup.ts` y `tests/**/*.test.tsx`. Sin globals: se importa de `vitest`. |
| `eslint.config.js` | Flat config: `@eslint/js`, `typescript-eslint`, `jsx-a11y` y las reglas de hooks. Sin reglas de estilo. |
| `index.html` | Entrada de Vite, favicon y script que aplica el tema guardado antes del primer paint. |
| `src/main.tsx` | Imports de estilos globales y montaje de `<App />`. |
| `src/App.tsx` | `ThemeProvider` → `ToastProvider` → `TornSilhouette` → `GalleryPage`. |
| `src/vite-env.d.ts` | Tipos de Vite para CSS Modules y assets. |

### Tests

| Archivo | Rol |
| --- | --- |
| `tests/setup.ts` | Matchers de `jest-dom`, `cleanup` de Testing Library y stubs de jsdom (`scrollIntoView`, `scrollTo`, `URL.createObjectURL`). |
| `tests/time-picker.test.tsx` | «Ahora» con reloj fijo (paso 5 y 15), `minuteStep={0}`, Escape y retorno de foco. |
| `tests/file-uploader.test.tsx` | `accept` con `*/*`, `image/*`, extensión y lista de MIME. |
| `tests/tooltip.test.tsx` | `side` respetado con espacio y volteo cuando no cabe; descripción del disparador. |
| `tests/listbox.test.tsx` | Select y Combobox: nombre del listbox, `aria-controls` solo abierto, teclado. |
| `tests/required.test.tsx` | «Campo obligatorio» anunciado en DatePicker, TimePicker, CheckboxGroup y RadioGroup. |
| `tests/use-controllable-state.test.tsx` | Dos actualizaciones funcionales en el mismo tick y `onChange` con el valor resuelto. |
| `tests/task-row.test.tsx` | Prioridad y vencimiento en la descripción del checkbox; Marcar / Desmarcar. |
| `tests/card-title.test.tsx` | El título de `Card` sigue siendo el encabezado con la cinta; el panel conserva el encabezado plano. |
| `tests/questline.test.tsx` | Bloqueo y desbloqueo encadenados, CRUD de hitos y tareas, anuncio de cierre, `aria-expanded`/`aria-controls`, foco devuelto y el plazo vencido. |

### Referencia estática

| Archivo | Rol |
| --- | --- |
| `design/mockup.html` | Mockup original **El Largo Invierno**. Es la referencia visual; no lo reescribas como si fuera la app. |
| `design/fonts/local.css` | `@font-face` del mockup, apuntando a `public/fonts`. |
| `public/fonts/*.woff2` | Ocho subconjuntos latin de las familias locales. |

### Sistema de diseño

| Archivo | Rol |
| --- | --- |
| `src/styles/tokens/primitives.css` | Tokens invariantes: espaciado, tipografía, controles, radios, sombras, motion, z-index, texturas. |
| `src/styles/tokens/themes.css` | Paletas de los 8 temas, tokens semánticos `--ui-*` y bindings `paper`/`panel`. |
| `src/styles/base.css` | Reset, lienzo de la página, foco global, scrollbars, `visually-hidden`, reduced motion. |
| `src/styles/fonts.css` | `@font-face` de la aplicación. |
| `src/theme/themes.ts` | Metadata de temas: clave, nombre, meta, tipo de papel y muestras. |
| `src/theme/ThemeProvider.tsx` | Estado del tema, persistencia y escritura de `data-theme` / `data-paper`. |
| `src/theme/ThemePicker.tsx` + `.module.css` | Dialog de temas con radios, muestras y navegación por teclado. |

### Componentes

Cada componente vive en `src/components/<Nombre>/` con su `.tsx` y `.module.css`.

| Componente | Archivos |
| --- | --- |
| Button | `src/components/Button/Button.tsx`, `Button.module.css` |
| Checkbox / CheckboxGroup | `src/components/Checkbox/Checkbox.tsx`, `Checkbox.module.css` |
| Radio / RadioGroup | `src/components/Radio/Radio.tsx`, `Radio.module.css` |
| Switch | `src/components/Switch/Switch.tsx`, `Switch.module.css` |
| TextInput | `src/components/TextInput/TextInput.tsx`, `TextInput.module.css` |
| Textarea | `src/components/Textarea/Textarea.tsx`, `Textarea.module.css` |
| Select | `src/components/Select/Select.tsx`, `Select.module.css` |
| Combobox | `src/components/Combobox/Combobox.tsx`, `Combobox.module.css` |
| Slider / RangeSlider | `src/components/Slider/Slider.tsx`, `Slider.module.css` |
| Stepper | `src/components/Stepper/Stepper.tsx`, `Stepper.module.css` |
| DatePicker | `src/components/DatePicker/DatePicker.tsx`, `DatePicker.module.css` |
| TimePicker | `src/components/TimePicker/TimePicker.tsx`, `TimePicker.module.css` |
| FileUploader | `src/components/FileUploader/FileUploader.tsx`, `FileUploader.module.css` |
| Surface | `src/components/Surface/Surface.tsx`, `Surface.module.css`, `surface-context.ts` |
| Icon | `src/components/Icon/Icon.tsx`, `Icon.module.css` |
| Badge | `src/components/Badge/Badge.tsx`, `Badge.module.css` |
| ProgressBar | `src/components/ProgressBar/ProgressBar.tsx`, `ProgressBar.module.css` |
| Tooltip | `src/components/Tooltip/Tooltip.tsx`, `Tooltip.module.css` |
| Divider | `src/components/Divider/Divider.tsx`, `Divider.module.css` |
| Toast | `src/components/Toast/Toast.tsx`, `Toast.module.css` |
| EmptyState | `src/components/EmptyState/EmptyState.tsx`, `EmptyState.module.css` |
| TaskRow / TaskList | `src/components/TaskList/TaskRow.tsx`, `TaskList.tsx` + módulos CSS |
| Field | `src/components/Field/Field.tsx`, `Field.module.css` |
| Popover | `src/components/Popover/Popover.tsx`, `Popover.module.css` |
| Card | `src/components/Card/Card.tsx`, `Card.module.css`, `RibbonTitle.tsx`, `RibbonTitle.module.css` |
| Questline | `src/components/Questline/Questline.tsx`, `QuestNodePanel.tsx`, `questline-model.ts`, `useQuestTrail.ts` + módulos CSS |
| WaxSeal | `src/components/Ornaments/WaxSeal.tsx`, `WaxSeal.module.css` |
| TornSilhouette | `src/components/Ornaments/TornSilhouette.tsx` (silueta rasgada compartida) |

### Galería

Las hojas de demo no tienen contenedor propio: son `Card size="lg"` con el nombre del componente en un `Badge` pasado por `kicker`.

| Archivo | Rol |
| --- | --- |
| `src/gallery/GalleryPage.tsx` + `.module.css` | Página única, topbar, masthead, índice, scroll-spy, toggle Papel/Panel y footer. |
| `src/gallery/sections.ts` | Metadata de las once secciones. |
| `src/gallery/Demo.tsx` + `.module.css` | `DemoGrid`, `DemoGroup`, `DemoRow`, `DemoStack`, `DemoNote` y `SectionHeading`. |
| `src/gallery/sections/ActionsSection.tsx` | Button y Tooltip. |
| `src/gallery/sections/SelectionSection.tsx` | Checkbox, Radio, Switch y estados. |
| `src/gallery/sections/FieldsSection.tsx` | TextInput, Textarea, tamaños y errores. |
| `src/gallery/sections/ListsSection.tsx` | Select y Combobox. |
| `src/gallery/sections/NumbersSection.tsx` | Slider, RangeSlider y Stepper. |
| `src/gallery/sections/DateTimeSection.tsx` | DatePicker y TimePicker. |
| `src/gallery/sections/FilesSection.tsx` | FileUploader con archivos de demo. |
| `src/gallery/sections/ExtrasSection.tsx` | Badge, ProgressBar, Divider y Toast. |
| `src/gallery/sections/ContextSection.tsx` | Mini todo-list con TaskList, TaskRow, EmptyState y formulario. |
| `src/gallery/sections/QuestlineSection.tsx` | Questline completo con plazos relativos a hoy, CRUD y reinicio del parte. |
| `src/gallery/sections/ContainersSection.tsx` | `Card` en sus tres tamaños con la lista de componentes de otras secciones. |
| `src/gallery/sections/sections.module.css` | Layouts específicos de secciones (task app, sizeFields, badge de componente, etc.). |
| `src/gallery/Atmosphere.tsx` + `.module.css` | Capas fijas de grano, viñeta, mapa y motas. |
| `src/gallery/SectionProps.ts` | Tipo `SectionProps` (`canvas`). |
| `src/gallery/useActiveSection.ts` | Scroll-spy con `IntersectionObserver`. |

### Utilidades

| Archivo | Rol |
| --- | --- |
| `src/lib/cx.ts` | Concatenador de clases seguro. |
| `src/lib/useControllableState.ts` | Puente controlado/no controlado. |
| `src/lib/useFloating.ts` | Posicionamiento fijo de popovers, flip y reposicionamiento. |
| `src/lib/useDismiss.ts` | Cierre por clic fuera, Escape y pérdida de foco. |
| `src/lib/date.ts` | Utilidades de calendario (meses, semanas, 42 días, claves). |
| `src/lib/format.ts` | Fechas, horas, tamaños de archivo y comparaciones. |

---

## 3. Reglas de implementación

### 3.1 Tokens

- **No escribas colores crudos, tamaños de fuente ni espaciados principales en `src/components/**/*.module.css`**. Usa `--ui-*`, `--space-*`, `--text-*`, `--control-*`, etc.
- La paleta cruda solo vive en `themes.css`. Los componentes no leen `--parch`, `--ink`, `--ribbon-*` directamente, salvo la excepción documentada de la barra XP (`--xp-*`).
- Si un valor nuevo se repite o pertenece al sistema, conviértelo en token en `primitives.css` o `themes.css`. Si es un detalle de arte (coordenadas SVG, breakpoint, patrón de 1 px), puede quedarse local y documentado.
- Los temas deben definir también `--accent-panel`, `--accent-paper`, `--danger-*`, `--success-*` y `--warning-*`; sin ellos, la semántica de superficie no funciona.

### 3.2 Superficies y portales

- Usa `Surface` para cualquier tarjeta o contenedor que necesite material; `Card` cuando además hace falta cabecera, lacre y lista.
- Los ornamentos de papel (`stack`, `margin`, `stitch`, `stains`) son capas `aria-hidden` de `Surface`: sólo se pintan sobre `surface="paper"` y nunca debajo del texto.
- La sombra del papel usa `--ui-paper-drop`; no vuelvas a `--ui-shadow-color` para el `drop-shadow` exterior: sobre cartulina oscura la tinta es clara y dibuja un halo.
- Usa `useSurface()` en cualquier componente que renderice en un portal (`Popover`, tooltips, toasts, menús) y pon `data-surface` en el nodo flotante. Si no, el popover perderá el material al salir del árbol.
- El `Surface` de papel usa una capa de textura con filtro; no apliques el filtro al contenido.
- No añadas `overflow: hidden` a las tarjetas si el componente puede necesitar un popover; los overlays ya se portalean, pero el layout debe seguir permitiéndolo.

### 3.3 Formularios

- Usa `Field` para label, hint, error, required/optional y label aside.
- Los ids de mensajes se generan con `getFieldMessageId`; conecta `aria-describedby` en el control.
- Usa `useControllableState` para aceptar `value`/`onChange` y `defaultValue`.
- Conserva la semántica nativa de checkbox, radio, switch y range. Para controles custom, replica el patrón ARIA correspondiente.
- El error va con `role="alert"`, `aria-invalid` y borde de peligro.
- El estado disabled no debe depender solo del color; usa atributos/estado y cursor.

### 3.4 Overlays

- Construye menús y calendarios con `Popover`, `useFloating` y `useDismiss`.
- El foco inicial de un popover portaleado debe moverse en `requestAnimationFrame` (después del montaje del portal). Ya se hace en ThemePicker, DatePicker y TimePicker. El Combobox mantiene el foco en el input y usa `requestAnimationFrame` al limpiar para evitar que el foco lo reabra con el valor anterior.
- Escape devuelve el foco al trigger.
- El clic fuera y la pérdida de foco cierran el overlay.
- Para Select/Combobox, el listbox usa `aria-activedescendant`; el foco permanece en el trigger/input.
- Para el Combobox, el `anchorRef` es el contenedor completo del control, no solo el input: así limpiar o pulsar el chevron no se interpreta como clic fuera.

### 3.5 Accesibilidad

Antes de dar un cambio por terminado:

- ¿Tiene nombre accesible el control?
- ¿Se puede abrir, recorrer, seleccionar y cerrar con teclado?
- ¿El foco es visible y vuelve a un lugar lógico?
- ¿Los nuevos estados tienen texto/aria además de color?
- ¿Respeta `prefers-reduced-motion`?
- ¿Sigue pasando una auditoría axe WCAG 2 A/AA + best practices? La última verificación del estado inicial dio **0 violaciones**. En el repositorio, `pnpm lint` (jsx-a11y) es el control automático; los tests de `tests/` cubren nombre de listbox, `aria-controls`, `required` y las descripciones de `TaskRow`.

### 3.6 Responsive

- No debe haber scroll horizontal a 320 px, ni en ningún ancho hasta 1440 px. No se tapa con `overflow-x: hidden`: si algo se sale, se corrige el elemento.
- Las rejillas de demo usan `DemoGrid` con `columns={2}` o `columns={3}`; no vuelvas al `auto-fit` con spans porque crea tracks vacíos.
- Las tarjetas y campos deben mantener `min-width: 0` para permitir truncado.
- Los textos largos de componente en el badge de la galería deben poder envolver (`componentBadge` en `sections.module.css`).

---

## 4. Recetas

### Añadir un componente

1. Crear `src/components/<Nombre>/<Nombre>.tsx` y `.module.css`.
2. Consumir solo tokens semánticos y primitivas.
3. Usar `Field` si es un campo; `Popover` si necesita overlay; `useSurface` si portalea.
4. Exportar el componente y sus tipos desde el archivo.
5. Añadirlo a la sección de galería adecuada (o crear una sección en `sections.ts` y `GalleryPage`).
6. Verificar teclado, foco, papel y panel.
7. Añadir un test en `tests/` si el componente tiene interacción propia.
8. Actualizar `README.md` y `DESIGN.md` si cambia el sistema.

### Añadir un tema

1. `src/theme/themes.ts`: nueva entrada con `key`, `label`, `meta`, `paper`, `swatches`.
2. `src/styles/tokens/themes.css`: bloque con la paleta completa y los acentos semánticos.
3. `index.html`: añadir la clave al array permitido del script de arranque.
4. Revisar contraste (texto, muted, primary, estados) en papel y panel.
5. Probar el selector de tema, la persistencia y los popovers.

### Añadir un test

1. Un archivo por asunto en `tests/<asunto>.test.tsx`; importa `describe`, `it`, `expect` de `vitest` (no hay globals).
2. Renderiza el componente real y busca por rol, nombre accesible, descripción y texto visible.
3. Usa `userEvent.setup()` para interacciones; si el test depende del reloj, fija solo `Date` con `vi.useFakeTimers({ toFake: ['Date'] })`.
4. jsdom no tiene layout: si el componente mide rectángulos, documenta el stub o deja el caso como comprobación manual.
5. Evita snapshots de árboles completos y asserts sobre clases CSS o estructura interna.

### Añadir una sección a la galería

1. Añadir metadata en `src/gallery/sections.ts`.
2. Crear `src/gallery/sections/<Nombre>Section.tsx` con `SectionProps`.
3. Importarla en el mapa `SECTION_COMPONENTS` de `GalleryPage.tsx`.
4. Añadir el enlace al índice (se genera desde `SECTIONS`), verificar scroll-spy.
5. Probar el layout en 2 y 3 columnas y en móvil.

### Cambiar una regla visual

1. ¿Es global? Va a `primitives.css` o `themes.css`.
2. ¿Es de superficie? Va a `--ui-paper-*` / `--ui-panel-*`.
3. ¿Es de un componente? Va a su `.module.css` usando tokens.
4. Actualiza `DESIGN.md` si la decisión es estructural.
5. Comprueba los ocho temas y las dos superficies.

---

## 5. Trampas conocidas

- **Foco inicial en overlays**: si mueves el foco en un `useLayoutEffect`/`useEffect` inmediato, el portal puede no estar en el DOM y el evento `focusin` cierra el popover. Usa `requestAnimationFrame`.
- **`data-surface` en portales**: sin propagar la superficie, un calendario sobre papel se vuelve panel. Usa `useSurface`.
- **Tema antes del paint**: `src/theme/themes.ts` es la única lista de temas. El plugin `liferpg-theme-manifest` de `vite.config.ts` inyecta las claves y su `paper` en el script inline de `index.html` para `serve` y `build`; no escribas esa lista a mano en el HTML. Añadir un tema solo toca `themes.ts` y `themes.css`. Mantén `themes.ts` sin dependencias de navegador: lo importa `vite.config.ts`.
- **Preload de fuentes**: `index.html` precarga `im-fell-english-400.woff2` y `cinzel-400-700.woff2` con `crossorigin`. Si cambias la fuente del cuerpo o renombras el archivo, actualiza el `href` o el navegador descargará la fuente dos veces.
- **Colores primary**: el texto del botón primario debe quedar sobre la banda oscura del gradiente; no aclares `--ui-primary-bg` sin comprobar contraste.
- **Contraste muted**: el papel claro usa una mezcla más oscura que `--ink-3`; no vuelvas a `--ink-3` directo sin medir contraste.
- **Festival de 1 px**: los patrones `visually-hidden` y los bordes de arte usan 1 px; no los conviertas en “tokens de spacing” sin necesidad.
- **Filtros SVG por hoja**: el borde rasgado es un `clip-path` compartido (`#ui-torn-clip`), no `feTurbulence`. Un filtro de turbulencia por tarjeta multiplica el raster y vuelve a pintarse al hacer scroll. La sombra del papel es `box-shadow`, no `drop-shadow` sobre el subárbol.
- **Mezclas a pantalla completa**: `mix-blend-mode` en capas `fixed` y `backdrop-filter` en la topbar fuerzan a recomponer el documento en cada scroll. Evítalos.
- **Grano**: el tile de 220 px se rasteriza una vez como imagen de fondo y se comparte; no lo conviertas en un filtro por elemento.
- **`design/mockup.html`**: es la referencia original. Si necesitas ajustarlo, hazlo solo para mantenerlo funcional (por ejemplo, fuentes), no para reflejar la app React.
- **Sin Storybook**: la galería es la superficie de revisión; no añadas Storybook sin pedirlo.

---

## 6. Verificación antes de entregar

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm test:run
```

Además, revisar manualmente en la galería:

- Los 8 temas y el toggle Papel / Panel.
- Select, Combobox, DatePicker, TimePicker, tooltip y Toast.
- Teclado: flechas, Enter, Escape y retorno de foco.
- 320, 768 y 1440 px sin overflow horizontal.
- Consola sin errores.
- Contraste y `prefers-reduced-motion` si se tocaron tokens.

Los tests cubren las interacciones que originaron los bugs de la revisión (redondeo de minutos, `accept`, `side`, nombre del listbox, `aria-controls`, `required`, estado controlado y `TaskRow`). **El overflow horizontal no se puede medir en jsdom**: 320/375/480 px sigue siendo una comprobación manual en navegador. La auditoría axe se realizó de forma externa sobre el estado inicial (0 violaciones); `eslint-plugin-jsx-a11y` es el control automático que queda en el repositorio.

Los tests se escriben contra roles, nombres accesibles, descripciones y resultados visibles; evita los snapshots de árboles completos y las aserciones sobre clases o estructura interna.
