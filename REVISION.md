# Revisión técnica — LifeRPG UI

**Fecha:** 2026-11-18  
**Alcance:** `src/`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`, `DESIGN.md` y `AGENTS.md`.  
**Estado:** revisión completada y **ejecutada**. Los 32 hallazgos de §2 están implementados en el árbol de trabajo y las casillas de §2 y §5 reflejan el estado final; ver «Estado de ejecución» al final del documento para decisiones, verificación y pendientes.  
**Herramientas de la revisión original:** `pnpm typecheck`, `pnpm build`, Playwright + Chromium, `axe-core 4.10.2` (WCAG 2 A/AA + best practices), inspección del árbol de accesibilidad y del DOM.

---

## 0. Resumen ejecutivo

La base del proyecto es buena: el sistema de tokens es coherente, los componentes están bien encapsulados, el build pasa limpio y la accesibilidad del estado base está cuidada. El proyecto está en condiciones de crecer, pero hay **3 bugs funcionales** que conviene corregir antes de construir el sitio encima, y un conjunto de detalles de accesibilidad y robustez que deberían cerrarse antes de considerar la librería “estable”.

### Bugs que justifican prioridad alta

1. **El `Tooltip` ignora la posición solicitada.** `side="top"` (el valor por defecto) se renderiza abajo si hay espacio.
2. **El botón «Ahora» del `TimePicker` pierde la hora al redondear.** A las 09:58 con pasos de 5 minutos produce 09:00.
3. **Overflow horizontal de 8 px en móvil** por las hojas apiladas de `Surface`, enmascarado por `body { overflow-x: hidden }`.

### Resultado de la verificación

| Comprobación | Resultado |
| --- | --- |
| `pnpm typecheck` | Sin errores |
| `pnpm build` | Correcto (Vite 7) |
| Consola del navegador | 0 errores y 0 warnings |
| axe, estado base, 8 temas × 2 superficies | **0 violaciones** |
| axe con overlays abiertos | 3 violaciones best-practice (ver A11Y-02, A11Y-03 y A11Y-04) |
| Overflow a 320 px | `scrollWidth: 328` / `clientWidth: 320` (solo en papel) |
| Overflow a 375 px | `scrollWidth: 383` / `clientWidth: 375` |
| Overflow a 480 px | `scrollWidth: 485` / `clientWidth: 480` |
| Overflow a 768/1024/1440 px | Sin overflow |
| Persistencia de tema | Correcta (localStorage + atributos antes del paint) |
| Navegación por teclado de overlays | Correcta en Select, Combobox, DatePicker, TimePicker y ThemePicker |

> Las mediciones de esta tabla son el estado **anterior** a la ejecución de la revisión. El resultado posterior a los cambios, la verificación automatizada y los pendientes están en «Estado de ejecución», al final del documento.

---

## 1. Cómo se verificó

### Comandos

```bash
pnpm typecheck
pnpm build
```

### Navegador

Se levantó una instancia de Vite en un puerto alternativo (5174; el 5173 ya estaba ocupado) y se recorrió la galería con Chromium:

- Anchos: **320, 375, 480, 640, 768, 900, 1024, 1180 y 1440 px**.
- Interacciones: Select, Combobox, DatePicker, TimePicker, ThemePicker, Toast, FileUploader y TaskList.
- Teclado: flechas, Home/End, PageUp/PageDown, Enter, Space, Escape, Tab y tipo-ahead.
- Persistencia de tema tras recarga.
- Reloj fijado a las **09:58** para reproducir el bug de «Ahora».

### axe-core

Se ejecutó `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] } })`:

- Estado base cerrado: **0 violaciones en los 8 temas y en ambas superficies** (papel y panel).
- Select abierto: `region`.
- Tooltip abierto: `region`.
- TimePicker abierto: `landmark-no-duplicate-banner`.
- ThemePicker abierto: `landmark-no-duplicate-banner`.
- Toast abierto: sin violaciones (el viewport de toasts ya es un landmark `region`).

> Importante: la afirmación de “0 violaciones” de AGENTS.md es correcta **solo para el estado base**. Los overlays portaleados introducen violaciones best-practice que axe no ve con los diálogos cerrados.

---

## 2. Orden de trabajo sugerido

El orden está pensado para no construir el sitio sobre cimientos inestables: primero correctitud, después accesibilidad de overlays, luego semántica de formularios y contexto, y al final robustez y tooling.

### Fase 1 — Correctitud (antes de construir el sitio)

- [x] **BUG-01** · Hacer que `Tooltip` respete `side` (`top`/`bottom`) y voltee solo cuando no quepa.
- [x] **BUG-02** · Corregir el redondeo de «Ahora» en `TimePicker` (acarreo de hora o redondeo hacia abajo).
- [x] **BUG-03** · Eliminar el overflow de 8 px a 320/375/480 px causado por las hojas de `Surface`.
- [x] **BUG-04** · Validar `minuteStep` para que 0 o valores negativos no bloqueen el hilo.
- [x] **BUG-05** · Soportar `accept="*/*"` en `FileUploader`.

### Fase 2 — Accesibilidad de overlays

- [x] **A11Y-01** · Dar nombre accesible propio a los listbox de `Select` y `Combobox`.
- [x] **A11Y-02** · Resolver los `aria-controls` que apuntan a popups desmontados.
- [x] **A11Y-03** · Evitar el segundo landmark `banner` en `TimePicker` y `ThemePicker`.
- [x] **A11Y-04** · Revisar la violación `region` de Select/Combobox/Tooltip portaleados.
- [x] **A11Y-05** · Exponer `required` en DatePicker, TimePicker, CheckboxGroup y RadioGroup.
- [x] **A11Y-06** · Corregir `Field.hideLabel`, que hoy elimina el `<label>` en vez de ocultarlo visualmente.

### Fase 3 — Formularios, contexto y móvil

- [x] **A11Y-07** · Añadir texto/icono para prioridad y vencimiento en `TaskRow` (no depender del color).
- [x] **A11Y-08** · Pausar los `Toast` también con foco de teclado, no solo con hover.
- [x] **A11Y-09** · Revisar la hoverabilidad del `Tooltip` (WCAG 1.4.13).
- [x] **A11Y-10** · Añadir nombres/affordance visible a los toggles Papel/Panel y tema en móvil.
- [x] **A11Y-11** · Añadir un skip link a `#contenido`.
- [x] **A11Y-12** · Exigir nombre accesible en `ProgressBar` cuando no hay label.
- [x] **A11Y-13** · Unificar la semántica de `RangeSlider` (grupo, `aria-invalid`, `className`).
- [x] **A11Y-14** · Asociar el label del `FileUploader` al dropzone y marcar `aria-invalid` con error.
- [x] **UX-01** · Hacer que el botón de limpiar de `TextInput` funcione también en modo controlado con solo `onChange`.
- [x] **UX-02** · Decidir y documentar qué pasa cuando `Field` recibe `hint` y `error` a la vez.
- [x] **UX-03** · Revisar el `<header>` interno de `Card`/`DemoCard` como riesgo de landmark.
- [x] **UX-04** · Exponer labels no string en `Divider`.
- [x] **UX-05** · Ajustar el `aria-label` del checkbox de `TaskRow` cuando la tarea ya está hecha.

### Fase 4 — Robustez, rendimiento y mantenimiento

- [x] **PERF-01** · Evitar que `useFloating` repinte en scrolls internos del popover.
- [x] **PERF-02** · Corregir el `useMemo` inefectivo del `TimePicker` y simplificar el estado `draft`.
- [x] **MAINT-01** · Endurecer `useControllableState` para actualizaciones funcionales.
- [x] **MAINT-02** · Unificar la fuente de verdad de los colores de los swatches de `themes.ts`.
- [x] **MAINT-03** · Tipar `SECTION_COMPONENTS` con un union de ids de sección.
- [x] **MAINT-04** · Reducir la duplicación de la lista de temas en `index.html`.
- [x] **MAINT-05** · Eliminar utilidades muertas o darles uso.
- [x] **MAINT-06** · Añadir ESLint + `jsx-a11y` y una suite mínima de tests de interacción.
- [x] **MAINT-07** · Preload de la fuente del cuerpo para reducir el swap.
- [x] **MAINT-08** · Revisar `color-scheme: dark` fijo en un tema de papel claro.
- [x] **MAINT-09** · Sustituir `body { overflow-x: hidden }` por una corrección real del overflow.
- [x] **TEST-01** · Cubrir con tests los casos que originaron los bugs de esta revisión.

---

## 3. Detalle de hallazgos

### Fase 1 — Correctitud

#### BUG-01 · `Tooltip` ignora `side`

**Prioridad:** P1  
**Ubicación:** `src/lib/useFloating.ts:74-79` (cálculo de `side`), `src/lib/useFloating.ts:114` (dependencias)  
**Afecta a:** `Tooltip` (`Tooltip.tsx`), que expone `side="top" | "bottom"`.

**Qué pasa:** `useFloating` calcula la posición así:

```ts
const canFitBelow = availableBelow >= needed
const side: FloatingSide = canFitBelow
  ? 'bottom'
  : availableAbove > availableBelow
    ? 'top'
    : 'bottom'
```

`preferredSide` se guarda en el estado inicial y aparece en las dependencias, pero **nunca se consulta para decidir la posición**. Si hay espacio abajo, siempre se elige `bottom`, aunque el consumidor haya pedido `top`.

**Evidencia:** En la galería, el tooltip de «Brújula» (default `side="top"`) se renderiza con `data-side="bottom"` y su `y` está por debajo del trigger. El de «Atalaya» (`side="bottom"`) también queda abajo, por lo que la demo de «Posición» no muestra dos posiciones distintas.

**Propuesta:** Respetar la preferencia cuando quepa:

```ts
const fitsPreferred =
  preferredSide === 'bottom'
    ? availableBelow >= needed
    : availableAbove >= needed
const side = fitsPreferred
  ? preferredSide
  : availableAbove > availableBelow
    ? 'top'
    : 'bottom'
```

Añadir un test de posicionamiento (o una comprobación de `data-side` en la galería) para ambos valores.

---

#### BUG-02 · `TimePicker` pierde la hora al pulsar «Ahora»

**Prioridad:** P1  
**Ubicación:** `src/components/TimePicker/TimePicker.tsx:36-39` (`roundToStep`), `src/components/TimePicker/TimePicker.tsx:246` (fallback), `src/components/TimePicker/TimePicker.tsx:284` (`setNow`).

**Qué pasa:**

```ts
function roundToStep(minutes: number, step: number): number {
  const rounded = Math.round(minutes / step) * step
  return rounded >= 60 ? 0 : rounded
}
```

Cuando el redondeo llega a 60, devuelve `0` sin incrementar la hora. Es decir, no se comporta como un acarreo de reloj.

**Reproducción:** Con el reloj fijado a **09:58** y `minuteStep={5}`:

- Valor esperado: **09:55** (redondeo hacia abajo) o **10:00** (redondeo con acarreo).
- Valor actual: **09:00**.

**Propuesta:** Escoger una política explícita:

- Redondeo hacia abajo: `Math.floor(minutes / step) * step` (nunca llega a 60).
- O acarreo: devolver `{ hours, minutes }` y hacer `hours = (hours + 1) % 24` cuando `rounded === 60`.

Añadir un test unitario de `roundToStep` y/o del handler `setNow`.

---

#### BUG-03 · Overflow horizontal de las hojas apiladas en móvil

**Prioridad:** P1  
**Ubicación:** `src/components/Surface/Surface.module.css:123` y `:129` (`.sheets::before` y `.sheets::after`).  
**Relacionado:** `src/styles/base.css` (`body { overflow-x: hidden }`).

**Qué pasa:** Las hojas decorativas se desplazan 19 px (y 9 px) y rotan ligeramente. Una tarjeta que termina en `x = 304` en un viewport de 320 px deja la hoja en ~323 px; con la rotación, el documento llega a **328 px**.

Mediciones:

| Viewport | `scrollWidth` | `clientWidth` | Diferencia |
| --- | --- | --- | --- |
| 320 | 328 | 320 | +8 |
| 375 | 383 | 375 | +8 |
| 480 | 485 | 480 | +5 |
| 640 | 640 | 640 | 0 |
| 768 | 768 | 768 | 0 |

Si se ocultan solo los `.sheets`, el `scrollWidth` vuelve a 320. `body { overflow-x: hidden }` evita la barra de scroll, pero **recorta la hoja** en el borde derecho.

**Propuesta:** Elegir una de estas opciones:

- Reducir el offset de las hojas en `max-width: 720px` (o eliminarlo en móvil).
- Aplicar `overflow-x: clip` a `.section`/`.page` para que la decoración no contribuya al scroll del documento.
- Cambiar el posicionamiento de las hojas para que su caja quede dentro de la tarjeta en pantallas estrechas.

Añadir una comprobación automatizada de `document.documentElement.scrollWidth <= clientWidth` a 320/375/480 px.

---

#### BUG-04 · `minuteStep` sin validar

**Prioridad:** P1 (robustez de API)  
**Ubicación:** `src/components/TimePicker/TimePicker.tsx:255`.

**Qué pasa:**

```ts
for (let minute = 0; minute < 60; minute += minuteStep) values.add(minute)
```

Con `minuteStep={0}` el bucle no termina; con un valor negativo, tampoco (el contador se aleja de 60). La demo usa 5 y 15, por lo que no se dispara, pero es un prop público.

**Propuesta:** Normalizar al inicio:

```ts
const safeStep = Number.isFinite(minuteStep) && minuteStep > 0 ? minuteStep : 5
```

Idealmente, limitar también a un máximo razonable (60) y documentar el comportamiento.

---

#### BUG-05 · `accept="*/*"` rechaza todos los archivos

**Prioridad:** P1 (bug de API)  
**Ubicación:** `src/components/FileUploader/FileUploader.tsx:37-47`.

**Qué pasa:** Para `accept="*/*"`:

- `rule.endsWith('/*')` es `true`.
- `rule.slice(0, -1)` produce `*/`.
- `file.type.toLowerCase().startsWith('*/')` siempre es `false`.

El comodín estándar `*/*` (cualquier archivo) rechaza todo. La demo usa `image/*,.pdf`, así que no se ha visto.

**Propuesta:** Tratar explícitamente `*/*` (y, si se quiere, `*`) como “aceptar todo”. Añadir tests para:

- `*/*`
- `image/*`
- `.pdf`
- `image/png,image/jpeg`

---

### Fase 2 — Accesibilidad de overlays

#### A11Y-01 · Los listbox de Select y Combobox no tienen nombre accesible

**Prioridad:** P2  
**Ubicación:** `src/components/Select/Select.tsx:270`, `src/components/Combobox/Combobox.tsx:327`.

**Qué pasa:** Ambos listbox usan:

```tsx
<ul role="listbox" aria-labelledby={fieldId}>
```

Pero `fieldId` está en el trigger/input, no en el `<label>` del `Field`. En el árbol de accesibilidad, el listbox aparece como:

```
- listbox:
  - option "Viajera ..."
```

Es decir, **sin nombre**. El trigger sí tiene nombre (`combobox "Clase del caminante"`), pero el popup no lo hereda.

**Propuesta:** Añadir un id al `<label>` de `Field` (por ejemplo `labelId = `${id}-label``) y usarlo en `aria-labelledby` del listbox. Alternativa: un `<span>` oculto con el texto de la etiqueta y referenciarlo. Añadir una comprobación de nombre accesible en tests o con `aria_snapshot`.

---

#### A11Y-02 · `aria-controls` apunta a popups desmontados

**Prioridad:** P2  
**Ubicación:** `src/components/Select/Select.tsx:221`, `src/components/Combobox/Combobox.tsx:265`, `DatePicker.tsx` (`aria-controls={dialogId}`) y `TimePicker.tsx` (`aria-controls={dialogId}`).

**Qué pasa:** `Popover` devuelve `null` cuando está cerrado, por lo que el elemento referenciado por `aria-controls` no existe hasta que se abre. La validación de axe no lo marca, pero ARIA espera que el id referenciado exista.

**Propuesta:** Una de estas dos:

- Renderizar el popup con `hidden`/`aria-hidden` en vez de desmontarlo (mantiene el id).
- Aplicar `aria-controls={open ? id : undefined}`.

Verificar con una comprobación de DOM: todo `aria-controls` debe resolver a un `getElementById`.

---

#### A11Y-03 · Segundo landmark `banner` al abrir TimePicker y ThemePicker

**Prioridad:** P2  
**Ubicación:** `src/components/TimePicker/TimePicker.tsx:355` (`<header className={styles.header}>`) y `src/theme/ThemePicker.tsx:87` (`<header className={styles.header}>`).

**Qué pasa:** El `Popover` se portalea al `body`. El `<header>` del popup queda como descendiente directo del body, fuera de cualquier `main`/`section`, y por tanto se interpreta como un segundo `banner`. axe lo detecta con `landmark-no-duplicate-banner` al abrir cualquiera de los dos.

**Propuesta:** Cambiar esos `<header>` por `<div>` (o por un heading real dentro de un contenedor con `role="presentation"` si se quiere conservar la semántica visual). El `DatePicker` ya usa `<div className={styles.header}>`, así que no tiene el problema; sirve de referencia.

---

#### A11Y-04 · El contenido portaleado de Select/Combobox/Tooltip queda fuera de landmarks

**Prioridad:** P2 (best practice)  
**Ubicación:** `src/components/Popover/Popover.tsx` (portal), `src/components/Tooltip/Tooltip.tsx` (portal).

**Qué pasa:** axe marca `region` (“All page content should be contained by landmarks”) cuando se abre un Select. Lo mismo ocurre con el Tooltip. Los diálogos de DatePicker, TimePicker y ThemePicker no lo disparan porque tienen `role="dialog"`.

Probado en vivo: al poner `role="dialog"` en el popover del Select, la violación desaparece. Poner `role="listbox"` o `aria-label` no la elimina.

**Propuesta:** Decidir el nivel de cumplimiento:

- Si se quiere mantener el “0 violaciones” también con overlays abiertos, añadir `role="dialog"` al popover de Select/Combobox y al tooltip (o envolver el portal en un landmark).
- Si se acepta la excepción best-practice para popups transitorios, documentarlo y excluir la regla en la auditoría.

No es una violación WCAG A/AA, pero sí afecta a la afirmación de AGENTS.md sobre best practices.

---

#### A11Y-05 · `required` no se expone en DatePicker, TimePicker, CheckboxGroup y RadioGroup

**Prioridad:** P2  
**Ubicación:** `src/components/DatePicker/DatePicker.tsx:226`, `src/components/TimePicker/TimePicker.tsx:305`, `src/components/Checkbox/Checkbox.tsx:110`, `src/components/Radio/Radio.tsx:141`.

**Qué pasa:**

- `DatePicker` y `TimePicker` pasan `required` al `Field` (asterisco visual), pero el trigger no tiene `aria-required` y el input oculto no puede participar en la validación nativa.
- `CheckboxGroup` y `RadioGroup` solo pintan el asterisco; el `fieldset` no tiene `aria-required`.
- `Select` sí tiene `aria-required`, y `Combobox` usa `required` en el input. La cobertura es inconsistente.

**Propuesta:**

- Añadir `aria-required={required || undefined}` a los triggers de DatePicker/TimePicker y a los fieldsets de los grupos.
- Documentar que la validación nativa de `required` no aplica a inputs ocultos; si se necesita, validar en el submit del formulario.
- Añadir un test de árbol de accesibilidad para cada control requerido.

---

#### A11Y-06 · `Field.hideLabel` elimina el label en vez de ocultarlo

**Prioridad:** P2  
**Ubicación:** `src/components/Field/Field.tsx:51`.

**Qué pasa:** Si `hideLabel` es `true`, el `Field` no renderiza el `<label>`; renderiza un `<span />` vacío. Un control que dependa del label del `Field` queda sin nombre accesible salvo que el consumidor añada `aria-label`.

**Propuesta:** Renderizar el `<label>` con la clase `visually-hidden` (o un `<span>` con el texto y `aria-labelledby`) en lugar de omitirlo. Si el objetivo es “label solo para lectores de pantalla”, ese es el patrón correcto.

---

### Fase 3 — Formularios, contexto y móvil

#### A11Y-07 · TaskRow comunica prioridad y vencimiento solo visualmente

**Prioridad:** P2  
**Ubicación:** `src/components/TaskList/TaskRow.tsx:63-65`, `src/components/TaskList/TaskRow.module.css:219`.

**Qué pasa:**

- La prioridad se representa con un rombo `aria-hidden` y un `title`. El `title` no es accesible por teclado y el `aria-hidden` elimina la información del árbol.
- El estado `overdue` se aplica con `data-overdue="true"`, que solo cambia el color del texto de vencimiento (“día 17”). No hay texto ni icono que diga “vencida”.

Esto es un caso de WCAG 1.4.1 (no usar solo el color) y una pérdida de información para lectores de pantalla.

**Propuesta:**

- Añadir un `<span className="visually-hidden">` con `PRIORITY_LABEL[priority]`.
- Para vencimiento, añadir texto/icono (“Vencida” o un icono con `aria-label`) además del color.
- Mantener el `title` solo como ayuda para ratón, no como fuente de información.

---

#### A11Y-08 · Los Toast no se pausan con foco de teclado

**Prioridad:** P2  
**Ubicación:** `src/components/Toast/Toast.tsx:60-61`.

**Qué pasa:** `onMouseEnter`/`onMouseLeave` pausan el temporizador, pero un usuario que llega con Tab al botón de cerrar no pausa el toast. Un toast de 4,2 s puede desaparecer mientras se lee o se navega. Es un riesgo de WCAG 2.2.1 (límite de tiempo).

**Propuesta:** Añadir `onFocus`/`onBlur` al contenedor o al botón de cerrar para pausar mientras el foco esté dentro. Alternativamente, usar un temporizador global que se pause con cualquier interacción. Valorar `role="status"`/`role="alert"` por toast según la variante.

---

#### A11Y-09 · Tooltip no es hoverable

**Prioridad:** P2 (revisar)  
**Ubicación:** `src/components/Tooltip/Tooltip.module.css:20`.

**Qué pasa:** `pointer-events: none` impide mover el puntero sobre el tooltip; al abandonar el trigger, se cierra a los 80 ms. Escape funciona (es descartable), pero no es hoverable.

**Propuesta:** Si el contenido es esencial, permitir `pointer-events: auto` mientras está abierto y mantenerlo visible al entrar en el tooltip. Si es auxiliar, documentar la decisión y asegurar que la misma información está disponible por otra vía (por ejemplo, `aria-describedby` o texto visible).

---

#### A11Y-10 · Toggles Papel/Panel y tema sin etiqueta visible en móvil

**Prioridad:** P2 (UX)  
**Ubicación:** `src/gallery/GalleryPage.module.css:675` (`.surfaceLabel { display: none }` a ≤640 px), `src/theme/ThemePicker.module.css:256` (`.triggerLabel { display: none }` a ≤720 px).

**Qué pasa:**

- Los botones Papel/Panel quedan solo con icono; su nombre accesible depende del atributo `title` (“Ver los controles sobre papel”). Funciona en muchos AT, pero es frágil y verboso.
- El trigger de temas queda solo con tres barras de color y un chevron; no hay texto visible que explique qué hace.

**Propuesta:**

- Añadir `aria-label` explícito a los botones de superficie (“Papel”, “Panel”).
- Usar `visually-hidden` para la etiqueta en lugar de `display: none` (así el nombre no depende de `title`).
- En móvil, valorar un icono más descriptivo o un texto corto para el selector de tema.

---

#### A11Y-11 · Falta un skip link

**Prioridad:** P2/P3  
**Ubicación:** `src/gallery/GalleryPage.tsx` (topbar y `main#contenido`).

**Qué pasa:** La página tiene una topbar, un índice de 10 secciones y un `main` largo, pero no hay un enlace “Saltar al contenido” como primer elemento enfocable.

**Propuesta:** Añadir un skip link visible al recibir foco, apuntando a `#contenido`, y asegurar que `main` sea enfocable (`tabIndex={-1}`) si el navegador no mueve el foco solo.

---

#### A11Y-12 · `ProgressBar` sin label no tiene nombre accesible

**Prioridad:** P3  
**Ubicación:** `src/components/ProgressBar/ProgressBar.tsx:57-58`.

**Qué pasa:** `aria-labelledby` solo se aplica si se pasa `label`. Si un consumidor usa `value` + `showValue` sin label, el `progressbar` no tiene nombre accesible.

**Propuesta:** Exigir `label` o `aria-label` en los tipos (union discriminada) o añadir una prop `aria-label` al contenedor. En la demo actual siempre hay label, así que no se ve.

---

#### A11Y-13 · `RangeSlider` no agrupa semánticamente sus dos inputs

**Prioridad:** P3  
**Ubicación:** `src/components/Slider/Slider.tsx:308-330`.

**Qué pasa:**

- El label del `Field` apunta al input mínimo, pero ese input tiene `aria-label="Valor mínimo"`, que gana. El grupo “Guardias de la noche” no se anuncia como grupo.
- El input máximo no recibe `aria-invalid` cuando hay error (el mínimo sí).
- `className` se aplica a los dos inputs, lo que puede sorprender al consumidor.

**Propuesta:** Envolver los dos inputs en un `fieldset` con `legend` (o usar `role="group"` con `aria-labelledby`), añadir `aria-invalid` a ambos y documentar que `className` es compartido o separarlo en `minClassName`/`maxClassName`.

---

#### A11Y-14 · FileUploader: label asociado al input oculto y falta `aria-invalid`

**Prioridad:** P3  
**Ubicación:** `src/components/FileUploader/FileUploader.tsx` (dropzone `role="button"` y `Field`).

**Qué pasa:** El `<label>` del `Field` apunta al `<input type="file">`, que está `aria-hidden` y fuera del orden de tabulación; el control accesible real es el dropzone. El dropzone tiene su propio nombre por contenido, pero el label visible no está asociado a él. Además, con `error` no se marca `aria-invalid` en el dropzone (solo se describe).

**Propuesta:** Asociar el texto del label al dropzone (`aria-labelledby` o un `<span className="visually-hidden">` con el label), y añadir `aria-invalid={error ? true : undefined}` al dropzone.

---

#### UX-01 · El botón de limpiar de `TextInput` no dispara `onChange`

**Prioridad:** P2/P3  
**Ubicación:** `src/components/TextInput/TextInput.tsx:69-72`.

**Qué pasa:** En modo no controlado, `handleClear` actualiza el estado interno, pero no llama a `onChange`. En modo controlado, solo llama a `onClear`; si el consumidor usa el patrón estándar `value`/`onChange` y no pasa `onClear`, el botón no limpia nada. La demo pasa `onClear`, por eso funciona.

**Propuesta:** Hacer que limpiar sea equivalente a escribir vacío: llamar a `onChange` con un evento sintético o permitir que `onClear` reciba el valor vacío. Como mínimo, documentar que en controlado hay que usar `onClear`.

---

#### UX-02 · `Field` con `hint` y `error` a la vez

**Prioridad:** P3  
**Ubicación:** `src/components/Field/Field.tsx:40-43`.

**Qué pasa:** `const message = error ?? hint` y `aria-describedby` solo referencia el error. Si se pasan ambos, el hint desaparece. La demo de “Correo del gremio” pasa `error` y `hint`, y el usuario nunca ve el hint.

**Propuesta:** Decidir el comportamiento:

- Mostrar el error y el hint (con el error primero), o
- Documentar que el error reemplaza al hint y no pasar ambos en las demos.

---

#### UX-03 · `<header>` interno de Card/DemoCard

**Prioridad:** P3 (riesgo latente)  
**Ubicación:** `src/components/Card/Card.tsx` y `src/gallery/DemoCard.tsx`.

**Qué pasa:** Hoy no genera un banner porque las tarjetas viven dentro de `<main>`/`<section>`. Pero un `Card` reutilizado directamente en el body (fuera de una sección) convertiría su `<header>` en un landmark `banner` adicional. Para una librería de componentes, conviene que el contenedor no emita landmarks por accidente.

**Propuesta:** Usar `<div>` para la cabecera del `Card`/`DemoCard`, o documentar la restricción de que deben ir dentro de contenido seccionado.

---

#### UX-04 · `Divider` no expone labels que no sean string

**Prioridad:** P3  
**Ubicación:** `src/components/Divider/Divider.tsx`.

**Qué pasa:** `aria-label={typeof label === 'string' ? label : undefined}`. Un `ReactNode` con texto no se expone como nombre del separador, y el rol `separator` no toma el nombre del contenido.

**Propuesta:** Renderizar el label en un `<span id>` y usar `aria-labelledby`, o aceptar solo strings y documentarlo.

---

#### UX-05 · `TaskRow` anuncia “Marcar” también cuando ya está marcado

**Prioridad:** P3  
**Ubicación:** `src/components/TaskList/TaskRow.tsx:48`.

**Qué pasa:** `aria-label={`Marcar «${task.title}»`}` no cambia con `task.done`; el estado se comunica con `aria-checked`, pero la acción descrita es la incorrecta cuando ya está hecha.

**Propuesta:** Usar `task.done ? 'Desmarcar' : 'Marcar'` o dejar que el nombre sea solo el título y confiar en el estado nativo.

---

### Fase 4 — Robustez, rendimiento y mantenimiento

#### PERF-01 · `useFloating` reacciona a scrolls internos del popover

**Prioridad:** P3  
**Ubicación:** `src/lib/useFloating.ts:130-140` (`window.addEventListener('scroll', onScroll, true)`).

**Qué pasa:** El listener en captura recibe también los scrolls internos del propio popover (por ejemplo, al recorrer una lista larga). Cada evento ejecuta `getBoundingClientRect` y `setState`, aunque la posición del ancla no haya cambiado.

**Propuesta:** Ignorar el evento si `event.target` está dentro de `floatingRef.current`, o escuchar solo el scroll de la ventana/documento.

---

#### PERF-02 · `TimePicker`: `useMemo` inefectivo y estado duplicado

**Prioridad:** P3  
**Ubicación:** `src/components/TimePicker/TimePicker.tsx:254-259` y estado `draft`/`draftMinutes`.

**Qué pasa:**

- `currentParts` es un objeto nuevo en cada render (`parseTime(current)`), por lo que la dependencia de `useMemo` cambia siempre y el memo no evita el recálculo.
- `draft` contiene `minutes`, pero el valor real se guarda en `draftMinutes`; `draft.minutes` queda obsoleto tras abrir.

**Propuesta:** Usar `currentParts?.minutes` como dependencia y unificar `draft`/`draftMinutes` en un solo objeto `{ hours, minutes }`.

---

#### MAINT-01 · `useControllableState` y las actualizaciones funcionales

**Prioridad:** P3  
**Ubicación:** `src/lib/useControllableState.ts:22-29`.

**Qué pasa:**

```ts
const resolved = typeof next === 'function'
  ? (next as (previous: T) => T)(current)
  : next
```

La función recibe `current` del render, no el estado interno más reciente. Dos actualizaciones funcionales batched en el mismo tick se calculan sobre el mismo valor y la segunda pisa a la primera. Además, `setValue` cambia de identidad en cada render porque depende de `current`.

**Propuesta:** Para el caso no controlado, usar `setInternal(previous => ...)` y una ref para el valor actual; para el controlado, delegar en `onChange` con el valor resuelto. Añadir tests de dos actualizaciones consecutivas.

---

#### MAINT-02 · Los swatches de `themes.ts` duplican la paleta

**Prioridad:** P3  
**Ubicación:** `src/theme/themes.ts:19-28+`.

**Qué pasa:** AGENTS.md dice que la paleta cruda vive solo en `themes.css`, pero `THEMES` contiene hex propios para los swatches del selector. Son dos fuentes de verdad que pueden desincronizarse al añadir o retocar un tema.

**Propuesta:** Derivar los swatches de una fuente única (por ejemplo, un manifiesto de paletas compartido o lectura de custom properties en runtime) o documentar explícitamente la excepción.

---

#### MAINT-03 · `SECTION_COMPONENTS` pierde el contrato de ids

**Prioridad:** P3  
**Ubicación:** `src/gallery/GalleryPage.tsx:23`.

**Qué pasa:** `Record<string, ComponentType<SectionProps>>` permite cualquier clave; si un id de `SECTIONS` no existe en el mapa, `Section` es `undefined` y la página falla en runtime.

**Propuesta:** Exportar un union `SectionId` desde `sections.ts` y tipar:

```ts
const SECTION_COMPONENTS = {
  acciones: ActionsSection,
  // ...
} satisfies Record<SectionId, ComponentType<SectionProps>>
```

---

#### MAINT-04 · Duplicación de la lista de temas en `index.html`

**Prioridad:** P3  
**Ubicación:** `index.html:19` y `src/theme/themes.ts`.

**Qué pasa:** La lista de claves y el mapeo `data-paper` están duplicados en el script inline. Es una trampa ya documentada en AGENTS.md, pero sigue siendo el punto más frágil al añadir un tema.

**Propuesta:** Mantener la lista en un único manifiesto (JSON/TS) y generar el script inline en build, o añadir un test que compare ambos arrays.

---

#### MAINT-05 · Utilidades muertas

**Prioridad:** P3  
**Ubicación:** `src/lib/format.ts`.

**Qué pasa:** `formatDateShort`, `formatWeekday`, `formatTime` e `isoDate` no se usan; `isoDate` duplica `dateKey`.

**Propuesta:** Eliminarlas o darles uso. Si se mantienen como API pública, documentarlas y cubrirlas con tests.

---

#### MAINT-06 · Sin lint ni tests

**Prioridad:** P3 (alto retorno)  
**Ubicación:** `package.json`.

**Qué pasa:** No hay ESLint, `eslint-plugin-jsx-a11y`, Vitest ni Testing Library. Los bugs de esta revisión (redondeo de minutos, `accept`, `side`, estado controlado) son exactamente los que una suite mínima habría detectado.

**Propuesta:**

- ESLint + TypeScript + `jsx-a11y`.
- Vitest + Testing Library para interacciones.
- Tests prioritarios:
  - `roundToStep` y `setNow` (09:58/5 y 09:58/15).
  - `matchesAccept` con `*/*`, `image/*`, extensión y MIME.
  - `useFloating` con `side="top"` y espacio disponible.
  - Select/Combobox: nombre del listbox, `aria-controls`, teclado y retorno de foco.
  - `useControllableState` con dos actualizaciones funcionales.
  - `FileUploader` con archivos válidos/invalidos y límites.

---

#### MAINT-07 · Preload de la fuente del cuerpo

**Prioridad:** P3  
**Ubicación:** `index.html`, `src/styles/fonts.css`.

**Qué pasa:** `IM Fell English` es la fuente del cuerpo y se carga con `font-display: swap`; el primer paint usa la fallback y luego cambia. No hay `preload`.

**Propuesta:** Añadir `<link rel="preload" as="font" type="font/woff2" href="/fonts/im-fell-english-400.woff2" crossorigin>` y medir el CLS. Valorar lo mismo para `Cinzel` si se usa above the fold.

---

#### MAINT-08 · `color-scheme: dark` fijo para un tema de papel claro

**Prioridad:** P3  
**Ubicación:** `src/styles/base.css` (`html { color-scheme: dark }`), `src/theme/ThemeProvider.tsx` (`root.style.colorScheme = 'dark'`).

**Qué pasa:** Pergamino es un tema de papel claro, pero el `color-scheme` global es oscuro. Hoy los controles son custom y el input de archivo está oculto, pero puede afectar a autofill, caret, scrollbars nativas y controles del navegador.

**Propuesta:** Derivar `color-scheme` de `data-paper` (`light`/`dark`) o de la definición del tema, y verificar los controles nativos en ambos casos.

---

#### MAINT-09 · `body { overflow-x: hidden }` como parche

**Prioridad:** P3  
**Ubicación:** `src/styles/base.css`.

**Qué pasa:** Esconde el overflow de BUG-03, pero no lo corrige y puede recortar decoración. Además, hace más difícil detectar regresiones de layout.

**Propuesta:** Corregir la causa (hojas) y dejar `overflow-x` solo si hay una razón documentada. Añadir el test de `scrollWidth` en CI.

---

#### TEST-01 · Casos de prueba derivados de esta revisión

**Prioridad:** P3  
**Ubicación:** nueva carpeta de tests.

Checklist mínima:

- [x] `TimePicker` «Ahora» a las 09:58 con paso 5 y 15.
- [x] `TimePicker` con `minuteStep=0` no bloquea.
- [x] `FileUploader` con `accept="*/*"`.
- [x] `Tooltip` con `side="top"` y `side="bottom"`.
- [x] `Select`/`Combobox`: el listbox tiene nombre accesible.
- [x] `Select`/`Combobox`: `aria-controls` resuelve a un id existente.
- [x] DatePicker/TimePicker: `required` se anuncia.
- [x] `useControllableState`: dos actualizaciones funcionales en el mismo tick.
- [x] `TaskRow`: prioridad y vencimiento presentes en el árbol de accesibilidad.
- [ ] Overflow a 320/375/480 px.

---

## 4. Lo que ya está bien (no tocar sin motivo)

- **Disciplina de tokens:** no hay colores crudos ni tamaños de fuente sueltos en los CSS de componentes; las superficies `paper`/`panel` y los `--ui-*` están bien encapsulados.
- **Arquitectura de portales:** `data-surface` se propaga, el foco inicial se mueve en `requestAnimationFrame`, Escape devuelve el foco y el cierre por foco/clic fuera está centralizado.
- **Rendimiento:** el borde rasgado es un `clipPath` estático compartido en vez de `feTurbulence` por tarjeta; el grano es un tile compartido; no hay `backdrop-filter`; `prefers-reduced-motion` desactiva duraciones, motas y spinner. Son decisiones acertadas y documentadas.
- **Teclado:** Select, Combobox, calendario, rueda de hora y selector de temas funcionan con flechas, Home/End, Enter, Escape y typeahead; el foco vuelve al trigger.
- **Base accesible:** axe sale limpio en el estado base en los 8 temas y ambas superficies; los mensajes de error usan `role="alert"`, `aria-invalid` y los ids de `Field` están bien conectados.
- **Build y organización:** typecheck/build limpios, sin warnings de consola, sin `any`, sin `@ts-ignore`, sin `console.log` y con documentación operativa muy útil.
- **Galería como superficie de revisión:** las secciones, los folios, las demos y los estados cubren bien los componentes; es una buena base para validar cambios visuales.

---

## 5. Checklist de cierre

### Correctitud

- [x] BUG-01 resuelto y verificado con `data-side` en ambos valores.
- [x] BUG-02 resuelto y cubierto con test de reloj fijo.
- [x] BUG-03 resuelto y verificado a 320/375/480 px.
- [x] BUG-04 resuelto con validación de `minuteStep`.
- [x] BUG-05 resuelto y cubierto con test de `accept`.

### Accesibilidad

- [x] Listbox de Select/Combobox con nombre accesible.
- [x] `aria-controls` sin referencias colgando.
- [x] axe sin `landmark-no-duplicate-banner` con TimePicker/ThemePicker abiertos.
- [x] Decisión documentada sobre `region` en portales.
- [x] `required` expuesto en todos los controles que lo aceptan.
- [x] `hideLabel` conserva el nombre accesible.
- [x] TaskRow comunica prioridad y vencimiento sin depender del color.
- [x] Toast se pausa con foco de teclado.
- [x] Toggles móviles con nombre y affordance clara.
- [x] Skip link operativo.
- [x] `ProgressBar` sin label no queda sin nombre.
- [x] `RangeSlider` agrupado y con `aria-invalid` en ambos inputs.
- [x] `FileUploader` con label asociado al dropzone y `aria-invalid` con error.

### Verificación final

```bash
pnpm typecheck
pnpm build
```

- [ ] 8 temas × 2 superficies con axe en estado base: 0 violaciones.
- [x] Overlays abiertos: 0 violaciones o excepciones documentadas.
- [x] 320, 375, 480, 768, 1024 y 1440 px sin overflow horizontal.
- [ ] Teclado: flechas, Enter, Escape, Tab y retorno de foco en todos los overlays.
- [x] Consola sin errores ni warnings.
- [x] `prefers-reduced-motion` respetado.
- [ ] Revisión manual con lector de pantalla de TaskRow, listboxes, `required` y toasts.

---

## 6. Anexo — Evidencia de la revisión

### Estado del repositorio

- `git status` limpio antes y después de la revisión.
- No se modificaron archivos de código; este documento es el único añadido.
- El servidor de pruebas levantado para las comprobaciones se detuvo; el servidor de desarrollo del usuario en el puerto 5173 quedó intacto.

### Mediciones de overflow

```text
320 px: scrollWidth 328 / clientWidth 320 (+8)
375 px: scrollWidth 383 / clientWidth 375 (+8)
480 px: scrollWidth 485 / clientWidth 480 (+5)
640 px: scrollWidth 640 / clientWidth 640 (0)
768 px: scrollWidth 768 / clientWidth 768 (0)
```

Al ocultar solo los elementos `.sheets`, el `scrollWidth` vuelve a 320 en el viewport de 320 px, lo que confirma la causa.

### Reproducción de «Ahora»

```text
Reloj fijado: 2026-11-21 09:58
Componente: TimePicker con minuteStep=5
Antes: 18:30 (valor de demo)
Después de «Ahora»: 09:00
Esperado: 09:55 (hacia abajo) o 10:00 (con acarreo)
```

### Evidencia del listbox sin nombre

```text
- listbox:
  - option "Viajera Lee el hielo y camina ligera." [selected]
  - option "Guardabosques Conoce cada senda y cada trampa."
```

El listbox no muestra nombre accesible en el snapshot; el trigger sí lo tiene.

### Evidencia de axe con overlays

```text
Select abierto:      region
Tooltip abierto:     region
TimePicker abierto:  landmark-no-duplicate-banner
ThemePicker abierto: landmark-no-duplicate-banner
Toast abierto:       sin violaciones
```

---

## 7. Estado de ejecución (2026-11-18)

Los 32 hallazgos de §2 se implementaron después de cerrar la revisión, por lotes secuenciales para no solapar archivos. Este es el estado final del árbol de trabajo.

### Verificación final

| Comprobación | Resultado |
| --- | --- |
| `pnpm typecheck` | Sin errores |
| `pnpm build` | Correcto (Vite 7) |
| `pnpm lint` | 0 problemas (ESLint 9 flat + `typescript-eslint` + `jsx-a11y`) |
| `pnpm test:run` | 25 tests en 7 archivos, todos en verde |
| axe ad-hoc con Select, Combobox, DatePicker, TimePicker, ThemePicker y Tooltip abiertos | 0 violaciones |
| Overflow horizontal en Chromium a 320/375/480/768/1024/1440 px | Sin overflow; `body { overflow-x: hidden }` eliminado |
| `data-theme` / `data-paper` antes del primer paint (dev y build) | Correcto; el manifiesto se genera desde `themes.ts` |

### Decisiones tomadas al implementar

- **BUG-02**: «Ahora» redondea **hacia abajo** (`Math.floor`); 09:58 con paso 5 da 09:55 y con paso 15 da 09:45, sin acarreo de hora.
- **BUG-04**: `minuteStep` se normaliza a un entero entre 1 y 60; `0`, negativos y valores no finitos caen a 5.
- **BUG-03**: por debajo de 640 px las hojas de `Surface` se desplazan 4/9 px en vez de 9/19 px, como geometría de ornamento en `primitives.css`; no se toca la tarjeta ni la topbar.
- **A11Y-04**: los popups portaleados que no son diálogos (Select, Combobox, Tooltip) viven dentro de una `region` nombrada; el tooltip conserva `role="tooltip"` y la `region` envuelve el nodo flotante. No se usa `role="dialog"` para lo que no es un diálogo.
- **A11Y-05**: `aria-required` no es válido en `role="button"` ni en `group`; el estado obligatorio se anuncia como descripción («Campo obligatorio») dentro de `aria-describedby`.
- **UX-01**: limpiar escribe el valor con el setter nativo y emite un `input` real, así que `onChange` recibe `''` en controlado y no controlado; `onClear` sigue disponible como trabajo extra.
- **UX-02**: `Field` pinta error y hint a la vez (error primero) y ambos entran en `aria-describedby` mediante `getFieldMessageIds`.
- **MAINT-01**: en no controlado las actualizaciones funcionales se resuelven contra el valor interno más reciente; en controlado el valor pertenece al padre y esa limitación queda documentada en el JSDoc.
- **MAINT-02**: la copia de swatches en `themes.ts` queda como excepción sancionada y documentada (el selector previsualiza paletas no aplicadas y no puede leer custom properties), con el token que refleja cada slot.
- **MAINT-04**: `vite.config.ts` inyecta el manifiesto de temas desde `themes.ts` en `index.html`, para dev y build; el script sigue inline y síncrono antes del paint.
- **MAINT-08**: `color-scheme` se deriva de `data-paper` (claro en Pergamino, oscuro en el resto); ya no hay `dark` fijo en JS.
- **MAINT-06**: `exhaustive-deps` queda en `warn` para no inundar la salida y no se añadió ninguna regla de estilo. Quedan seis `eslint-disable-next-line` justificados en el patrón ARIA de `aria-activedescendant` y en `aria-invalid` sobre `role="button"`.

### Pendiente (no automatizable o no re-auditado aquí)

- La auditoría axe de los **8 temas × 2 superficies** posterior a los cambios no se repitió completa: la re-ejecución fue ad-hoc sobre un tema. axe no vive en el repositorio.
- La comprobación de overflow no está en CI: jsdom no mide layout. Los anchos se midieron en Chromium y quedan como verificación manual.
- Lectores de pantalla reales y prueba en Safari/Firefox: siguen pendientes.
- `prefers-reduced-motion` y el recorrido exhaustivo de teclado no se repitieron tras los cambios.
- Hallazgo colateral de la auditoría ad-hoc: con un segundo `DatePicker` abierto, axe marca `label-content-name-mismatch` en las celdas de día (texto visible «1», nombre «01 de noviembre…»). Es anterior a esta ejecución y quedó fuera del alcance.
- Los `href` de los dos `preload` de fuentes siguen siendo cadenas literales; si se renombra un `.woff2`, hay que actualizarlos a mano.

---

*Documento generado a partir de la revisión técnica del repositorio. No sustituye a una auditoría manual con lectores de pantalla reales ni a pruebas en Safari/Firefox; esas comprobaciones siguen pendientes.*
