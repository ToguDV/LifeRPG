# Hallazgos abiertos del arnés E2E

**Fecha de la primera ejecución:** 2026-11-18
**Comando:** `pnpm test:e2e` (Playwright 1.64.1 · Chromium 156 / `chromium-1248` · axe-core 4.14)
**Resultado:** 37 tests, **19 pasan / 18 fallan**. Los fallos son hallazgos reales; no hay línea base ni exclusiones salvo el hallazgo conocido del `DatePicker` (§ Hallazgo conocido).

Este documento es el parte de la primera pasada. No es una lista de excepciones: cuando un hallazgo se arregle, sus tests se pondrán verdes y este archivo debe actualizarse o borrarse.

---

## A11Y-01 · `FileUploader`: el nombre accesible no contiene el texto visible

- **Regla:** `label-content-name-mismatch` · impacto **serious** · WCAG 2.5.3 (Label in Name).
- **Dónde:** sección `#archivos`, las tres zonas de carga (`Mapas y provisiones`, `Sello del gremio`, `Archivo sellado` deshabilitada).
- **Superficies y temas:** los 16 pares (8 temas × Papel/Panel). Es independiente de la paleta.
- **Selector observado:** `div[role="button"][aria-labelledby="file-uploader-…-label"]` (los ids `_r_…_` son `useId` y cambian por página).
- **Causa:** el `div` con `role="button"` toma su nombre de la label del campo («Mapas y provisiones»), pero su texto visible dice «Arrastra tus archivos aquí / o elige desde el estante». El nombre accesible no contiene ese texto.
- **Impacto:** un usuario de control por voz no puede activar la zona diciendo lo que lee en pantalla; un lector de pantalla anuncia solo el nombre del campo, no la instrucción visible.
- **Sugerencia (no aplicada):** que el texto visible forme parte del nombre accesible o que la zona no sea el control nombrado por la label. La decisión de copy/estructura es del propietario del componente.
- **Estado: resuelto.** La zona se nombra con la label del campo **y** las dos líneas visibles de la instrucción (`aria-labelledby` → label + título + texto). Nombre resultante: «Mapas y provisiones Arrastra tus archivos aquí o elige desde el estante»; con el arrastre activo, «… Suelta aquí los archivos …». La descripción (`hint`/error) no cambia.

## A11Y-02 · Contraste del marcador de hito vencido sobre panel

- **Regla:** `color-contrast` · impacto **serious** · WCAG 1.4.3 (AA).
- **Dónde:** `#travesia`, el número del marcador de un hito `data-state="overdue"` (la demo siembra «El pozo ciego»).
- **Selector observado:** `li[data-state="overdue"] > button[type="button"] > ._marker_…` (la clase es un hash de CSS Module).
- **Mediciones:**
  - Pergamino + Panel: **3.68:1** (`#b57462` sobre `#2c2e28`, 12 px).
  - Nord + Panel: **2.74:1** (`#bf616a` sobre `#343b49`, 12 px).
  - Gruvbox + Panel: **3.81:1** (`#fb4934` sobre `#32302f`, 12 px).
  - Mínimo exigido: 4.5:1 (texto normal).
- **Impacto:** el número del hito vencido se lee mal en panel oscuro; el color no es el único indicador (hay icono y palabra oculta), pero el texto sigue siendo información.

## A11Y-03 · Contraste del número del índice activo en Nord

- **Regla:** `color-contrast` · impacto **serious** · WCAG 1.4.3 (AA).
- **Dónde:** índice de la galería, eslabón activo (`aria-current="location"`), número de sección.
- **Selector observado:** `._indexLinkActive_… > ._indexNum_…`.
- **Mediciones:** **4.42:1** (`#8fbcbb` sobre `#3c4956`, 11 px) en Nord + Papel y en Nord + Panel.
- **Mínimo exigido:** 4.5:1. Es un fallo por muy poco margen, pero medible.

## A11Y-04 · Texto del panel de Questline sobre papel en Pergamino

- **Regla:** `color-contrast` · impacto **serious** · WCAG 1.4.3 (AA).
- **Dónde:** `#travesia`, con el panel de un hito abierto, superficie **Papel**, tema **Pergamino**.
- **Selectores observados** (hashes de CSS Module):
  - `._kicker_…` («Hito 01 de 06 · Plazo: …»): **4.18:1** (`#4f6a4a` sobre `#ddd7c8`, 11 px).
  - `._note_…` (nota del hito): **4.2:1** (`#696254` sobre `#ddd7c8`, 15 px).
  - `._tally_…` («3 de 3 tareas · cumplido»): **4.2:1** (13 px).
  - Dos `._label_…` de tareas completadas (`strikeWhenChecked`): **4.2:1** (15 px).
- **Mínimo exigido:** 4.5:1.
- **Nota:** el mismo panel sobre **Panel** pasa el contraste; el problema es la mezcla de tinta sobre papel de Pergamino. El `incomplete` de color-contrast no permite descartar que haya más nodos afectados en otras texturas.

## A11Y-05 · Botón de borrado del hito sobre panel

- **Regla:** `color-contrast` · impacto **serious** · WCAG 1.4.3 (AA).
- **Dónde:** `#travesia`, confirmación de borrado abierta, superficie **Panel**, tema **Pergamino**. Botón de peligro «Sí, eliminar el hito».
- **Selector observado:** `._danger_…._sm_….button_… > ._label_…`.
- **Medición:** **4.02:1** (`#b57462` sobre `#2e251e`, 11 px). Mínimo 4.5:1.
- **Impacto:** la acción destructiva es la que peor se lee del panel.

## Hallazgo conocido · `DatePicker` y `label-content-name-mismatch` (resuelto)

- **Estado: resuelto.** El nombre accesible de cada celda usa el día sin relleno («1 de noviembre de 2026»), que contiene el texto visible «1». El `aria-label` de las celdas ya no usa `formatDate`, que conserva el día a dos dígitos para la prosa y el disparador. La exclusión `disableRules` y la sonda del hallazgo se retiraron: el estado abierto audita la regla sin excepciones.

- **Regla:** `label-content-name-mismatch` · impacto **serious** · WCAG 2.5.3.
- **Dónde:** calendario abierto (`role="dialog"`, «Elegir fecha»), celdas de día con número de un dígito.
- **Selector observado:** `button[aria-label="01 de noviembre de 2026"]` … `…09…` y los días 1–9 del mes siguiente visible (18 celdas en la pasada).
- **Causa:** el texto visible es «1» y el nombre accesible «01 de noviembre de 2026»; «1» no está contenido en «01». Es el hallazgo anterior de `REVISION.md` §3.
- **Tratamiento:** la pasada completa del estado abierto ya no desactiva esta regla; el test del `DatePicker` abierto la ejecuta como cualquier otra. No hay línea base ni sonda separada: si el nombre vuelve a perder el número visible, el test se pone rojo.

---

## `incomplete` (no es un aprobado)

axe no puede determinar el contraste de **310–351 nodos** por pasada: las texturas de papel y panel usan gradientes, imágenes de fondo y pseudo-elementos. El arnés:

- imprime un resumen por pasada (`[axe incomplete] … color-contrast=317, form-field-multiple-labels=5`);
- adjunta `axe-incomplete-<contexto>.json` al informe;
- añade una anotación `axe-incomplete` al test.

No se contabilizan como violaciones ni como pases. El contraste real de esos nodos sigue pendiente de revisión manual o de una herramienta que componga las capas.

`form-field-multiple-labels` (5 nodos, `TaskRow`) ya no aparece: cada checkbox tiene una sola `<label>` nativa que envuelve la caja y el cuerpo, y su nombre viene de `aria-labelledby` a la frase de acción oculta dentro de esa misma label. «Marcar/Desmarcar «título»» se conserva exacto, la fila sigue clicable y la descripción (`aria-describedby`) no cambia.

## Lo que sí pasa en esta pasada

- **Overflow horizontal:** 0 desbordes y `scrollWidth === innerWidth` en 320, 375, 480, 768, 1024 y 1440 px para la galería completa, el panel de Questline abierto y un hito con título de 60 caracteres sin espacios.
- **Teclado/foco:** 5/5. Tab hasta el primer hito (88 pulsaciones desde el inicio), Enter abre y enfoca el panel, Escape cierra y devuelve el foco al disparador; ThemePicker, Select y Combobox recorren, seleccionan y cierran con foco de retorno.
- **Sendero:** 6 hitos, 5 paths con `d` no vacío a 1440 px y a 320 px (el raíl envuelve y el SVG sigue visible).

## Cómo reproducir

```bash
pnpm install
pnpm exec playwright install chromium   # solo si falta chromium-1248
pnpm test:e2e
pnpm test:e2e:report                    # informe HTML con trazas y adjuntos
```

Los tests de `e2e/a11y.spec.ts` fallan mientras estos hallazgos sigan abiertos. `e2e/overflow.spec.ts` y `e2e/keyboard.spec.ts` pasan.
