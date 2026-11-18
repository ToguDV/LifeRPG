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
```

- Stack: **Vite + React 19 + TypeScript + CSS Modules**.
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
| `pnpm-workspace.yaml` | Aprobación de build de `esbuild`. |
| `tsconfig.json` | TypeScript estricto, `noUnusedLocals`, `noUnusedParameters`. |
| `vite.config.ts` | Vite + plugin React. |
| `index.html` | Entrada de Vite, favicon y script que aplica el tema guardado antes del primer paint. |
| `src/main.tsx` | Imports de estilos globales y montaje de `<App />`. |
| `src/App.tsx` | `ThemeProvider` → `ToastProvider` → `TornSilhouette` → `GalleryPage`. |
| `src/vite-env.d.ts` | Tipos de Vite para CSS Modules y assets. |

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
| Card | `src/components/Card/Card.tsx`, `Card.module.css` |
| WaxSeal | `src/components/Ornaments/WaxSeal.tsx`, `WaxSeal.module.css` |
| TornSilhouette | `src/components/Ornaments/TornSilhouette.tsx` (silueta rasgada compartida) |

### Galería

| Archivo | Rol |
| --- | --- |
| `src/gallery/GalleryPage.tsx` + `.module.css` | Página única, topbar, masthead, índice, scroll-spy, toggle Papel/Panel y footer. |
| `src/gallery/sections.ts` | Metadata de las diez secciones. |
| `src/gallery/DemoCard.tsx` + `.module.css` | Hoja de muestra con superficie, badge, folio en lacre, ornamentos de papel y contenido. |
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
| `src/gallery/sections/ContainersSection.tsx` | `Card` en sus tres tamaños con la lista de componentes de otras secciones. |
| `src/gallery/sections/sections.module.css` | Layouts específicos de secciones (task app, sizeFields, etc.). |
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
- ¿Sigue pasando una auditoría axe WCAG 2 A/AA + best practices? La última verificación del estado inicial dio **0 violaciones**.

### 3.6 Responsive

- No debe haber scroll horizontal a 320 px.
- Las rejillas de demo usan `DemoGrid` con `columns={2}` o `columns={3}`; no vuelvas al `auto-fit` con spans porque crea tracks vacíos.
- Las tarjetas y campos deben mantener `min-width: 0` para permitir truncado.
- Los textos largos de componente en el badge de `DemoCard` deben poder envolver.

---

## 4. Recetas

### Añadir un componente

1. Crear `src/components/<Nombre>/<Nombre>.tsx` y `.module.css`.
2. Consumir solo tokens semánticos y primitivas.
3. Usar `Field` si es un campo; `Popover` si necesita overlay; `useSurface` si portalea.
4. Exportar el componente y sus tipos desde el archivo.
5. Añadirlo a la sección de galería adecuada (o crear una sección en `sections.ts` y `GalleryPage`).
6. Verificar teclado, foco, papel y panel.
7. Actualizar `README.md` y `DESIGN.md` si cambia el sistema.

### Añadir un tema

1. `src/theme/themes.ts`: nueva entrada con `key`, `label`, `meta`, `paper`, `swatches`.
2. `src/styles/tokens/themes.css`: bloque con la paleta completa y los acentos semánticos.
3. `index.html`: añadir la clave al array permitido del script de arranque.
4. Revisar contraste (texto, muted, primary, estados) en papel y panel.
5. Probar el selector de tema, la persistencia y los popovers.

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
- **Tema antes del paint**: `ThemeProvider` y el script de `index.html` comparten la clave `liferpg-ui-theme` y la lista de temas. Si añades un tema, actualiza ambos.
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
```

Además, revisar manualmente en la galería:

- Los 8 temas y el toggle Papel / Panel.
- Select, Combobox, DatePicker, TimePicker, tooltip y Toast.
- Teclado: flechas, Enter, Escape y retorno de foco.
- 320, 768 y 1440 px sin overflow horizontal.
- Consola sin errores.
- Contraste y `prefers-reduced-motion` si se tocaron tokens.

No hay suite de tests en el repositorio. La auditoría axe se realizó de forma externa sobre el estado inicial; si se añade una dependencia de test, documentarlo y actualizar los scripts.
