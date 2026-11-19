# Registro del arnés E2E

**Comando:** `pnpm test:e2e` · informe: `pnpm test:e2e:report`
**Herramientas:** Playwright 1.64.1 (Chromium `chromium-1248`, ya cacheado en `~/.cache/ms-playwright`) y axe-core 4.14 vía `@axe-core/playwright`.

Estado actual: **36 tests en verde**. Este archivo conserva la primera pasada y las reglas del arnés; no es una lista de excepciones.

---

## Primera pasada (2026-11-18): 19 de 37 en verde

Los 18 fallos eran cinco hallazgos reales, no ruido de infraestructura:

| # | Hallazgo | Estado |
| --- | --- | --- |
| A11Y-01 | `FileUploader`: `label-content-name-mismatch` en los 16 pares tema × superficie | Resuelto: el nombre accesible incluye la instrucción visible de la zona |
| A11Y-02 | `color-contrast` del marcador de hito vencido: 2.74:1 Nord+Panel, 3.68 Pergamino, 3.81 Gruvbox (y 2.46–4.04 en papel, que axe dejaba en `incomplete`) | Resuelto: `--ui-danger-text` por superficie |
| A11Y-03 | `color-contrast` del número del índice activo en Nord: 4.42:1 | Resuelto: acento fuerte de panel de Nord a 4.66:1 |
| A11Y-04 | `color-contrast` del panel de Questline sobre papel Pergamino: 4.18 kicker, 4.20 nota/tally/etiquetas | Resuelto: `--ui-success-text` y `--ui-text-muted` de papel claro |
| A11Y-05 | `color-contrast` del botón «Sí, eliminar el hito» en Pergamino+Panel: 4.02:1 | Resuelto: `--ui-danger-text` |
| — | Hallazgo conocido del `DatePicker` (`REVISION.md` §3): celda visible «1», nombre «01 de noviembre de 2026» | Resuelto: nombre del día sin relleno. La exclusión `disableRules` se retiró y la sonda se eliminó |
| — | `incomplete` `form-field-multiple-labels` en `TaskRow` (5 nodos) | Resuelto: una sola `<label>` nativa |

Detalle de la pasada original y de los ratios medidos: `git log -p e2e/FINDINGS.md`.

---

## Reglas del arnés

- **Sin línea base.** No hay fichero de violaciones aceptadas: un hallazgo abierto deja el test rojo. Si aparece uno nuevo, se arregla o se documenta aquí mientras siga rojo.
- **Sin exclusiones.** `e2e/a11y.spec.ts` no usa `disableRules`. Cuando una exclusión fue necesaria (el `DatePicker` conocido) se acompañó de una sonda que la mantenía honesta; hoy ya no existe.
- **`incomplete` es diagnóstico, no un hallazgo.** Cada pasada imprime y adjunta los nodos que axe no puede decidir: las texturas dejan cientos de nodos `color-contrast` sin resolver (gradientes, imágenes de fondo, pseudo-elementos). El propietario del proyecto los revisó a mano en los 8 temas y **los dio por válidos**; no se documentan como pendientes ni se proponen herramientas para medirlos. Los cuatro textos que sí se corrigieron se midieron contra los tokens resueltos.
- **Estados abiertos en diferencial.** Panel, editor, confirmación, `Select`, `Combobox` y `DatePicker` se comparan con el estado anterior para que un hallazgo preexistente no oculte lo que añade el overlay. La matriz de 8 temas × 2 superficies del estado cerrado es estricta.
- **Puerto 4317 con `reuseExistingServer`.** Dos worktrees que ejecuten `pnpm test:e2e` a la vez comparten servidor y uno audita el código del otro: cambia `PORT` o para el otro servidor antes de fiarte del resultado.

## Límites

- Solo Chromium: sin lector de pantalla real, Safari ni Firefox.
- El teclado es un humo de los patrones clave (panel de Questline, `ThemePicker`, `Select`, `Combobox`), no una pasada exhaustiva de los 13 controles.
- El medidor de overflow ignora elementos recortados por un ancestro con `overflow-x`; el `scrollWidth` del documento sigue detectando el desbordamiento real de la página.

## Reproducir

```bash
pnpm install
pnpm exec playwright install chromium   # solo si falta chromium-1248
pnpm test:e2e
pnpm test:e2e:report
```
