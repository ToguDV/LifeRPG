# Revisión técnica — LifeRPG UI

**Estado:** cerrada. La revisión base (32 hallazgos) se implementó y verificó antes; esta tanda cierra los hallazgos de `Questline` y convierte `§2` en un arnés automático. El detalle histórico está en `git log -p REVISION.md` y las decisiones de diseño en `DESIGN.md`.

**Verificación:** `pnpm typecheck`, `pnpm lint`, `pnpm test:run` (12 archivos, 95 tests), `pnpm build` y `pnpm test:e2e` (36 tests en Chromium) en verde.

---

## 1. Questline — resuelto

Cada hallazgo se reprodujo antes de arreglarlo: los tests nuevos se ejecutaron contra el código original y fallaban (15 en el núcleo, 14 en el panel). No hubo falsos positivos.

| # | Hallazgo | Resolución | Tests |
| --- | --- | --- | --- |
| Q-01 | El cierre se anunciaba por posición y competía con el borrado | Transiciones comparadas por `Map<id, estado>`; un único escritor de la región `status` compone el aviso de borrado (encolado) con las transiciones del mismo commit | `questline.test.tsx` (borrado delante de un cumplido, mensaje de borrado) |
| Q-02 | La validación nativa bloqueaba el error propio | `noValidate` en el formulario, `required` se mantiene como semántica; `submitNode` siempre corre | `questline-panel.test.tsx` |
| Q-03 | Bloqueos y desbloqueos en silencio | Se anuncian ambos sentidos y se guarda el último elemento enfocado para devolver el foco si un control pasa a `disabled` | `questline.test.tsx` (rebloqueo al añadir tarea y al reabrir) |
| Q-04 | El panel no recibía el foco al abrirse | Foco en `requestAnimationFrame` al montar (salvo cuando nace en modo edición: gana el `autoFocus`), sin robar el foco a un clic ya hecho | `questline-panel.test.tsx` |
| Q-05 | La nota del candado señalaba un hito que no desbloquea | `getBlockingNodes` devuelve todos los pendientes por delante; con varios, «…empezando por «A»»; comentario corregido | `questline-model.test.ts`, `questline-panel.test.tsx` |
| Q-06 | «Se ha desbloqueado B» podía ser falso | Se deriva el primer `locked → active/overdue`; «La travesía está completa» solo si todos los estados quedan cumplidos | `questline.test.tsx` |
| Q-07 | Copy del último hito | `index === total - 1`: «Completa este hito para terminar la travesía» / «La travesía está completa» | `questline-panel.test.tsx` |
| Q-08 | «Cerrar el hito» significaba dos cosas | «Cerrar el panel» para el panel; «completar / cumplido» para el hito (pie, tally, badge) | `questline-panel.test.tsx` |
| Q-09 | Cancelar dejaba un hito borrador | El hito recién añadido se descarta al cerrar el editor si sigue intacto; cualquier guardado o edición de tareas lo conserva | `questline.test.tsx` |
| Q-10 | Copy y recuentos | El header no muestra «0 de 0 tareas»; el plazo se muestra una sola vez (kicker); la nota queda documentada como nota de autor | `questline.test.tsx`, `questline-panel.test.tsx` |
| Q-11 | Añadir tarea no se anunciaba | El foco va a la casilla nueva (o al botón de la fila si está bloqueada) y se asegura en pantalla | `questline-panel.test.tsx` |
| Q-12 | El estado activo no tenía texto oculto | `STATE_META` con palabra para los cuatro estados, compartido por raíl y panel | `questline.test.tsx` |
| Q-13 | Hito bloqueado y vencido sin tinte | `data-overdue` en raíl y panel: se tiñe el vencimiento sin perder candado, borde discontinuo ni la palabra «Bloqueado» | `questline.test.tsx` |
| Q-14 | Escape y validaciones de tareas | Escape retrocede una capa (confirmación → editor → editor de tarea → panel) con retorno de foco; título vacío en alta y renombrado muestra «La tarea necesita un nombre.» | `questline-panel.test.tsx` |
| Q-15 | Foco tras renombrar o eliminar tarea | Va a la fila vecina y se asegura con `scrollIntoView({ block: 'nearest' })`, sin `preventScroll` | `questline-panel.test.tsx` |
| Q-16 | Texto dinámico sin `overflow-wrap` | `overflow-wrap: anywhere` + `min-width: 0` en nota, confirmación, candado y label de `Checkbox` | `e2e/overflow.spec.ts` (320–1440 px) |
| Q-17 | Código muerto y comentarios inexactos | Fuera `triggerId`, `deadlineToKey` y `data-done`; comentarios de `getBlockingNode` y de la hoja de estilos corregidos | lint/build |
| Q-18 | `label` por defecto en inglés | Default «Ruta de hitos»; con `label=""` el raíl se nombra «Hitos» | `questline.test.tsx` |
| Q-19 | Plazos obsoletos a medianoche | `today` en estado, refrescado en `visibilitychange`, `focus` y medianoche; el panel se recalcula al re-renderizar | `questline.test.tsx` |
| Q-20 | IDs DOM y API pública | Base `useId` + `domFragment` (seguro para `[A-Za-z0-9_-]`); reexportados tipos y `formatQuestNumber` desde `Questline.tsx` | `questline.test.tsx` |
| — | Duplicación y tamaño | `updateTasks`, `STATE_META` único y división en `QuestRail`, `QuestStop`, `QuestNodeEditor`, `QuestTaskRow`, `QuestDeleteConfirm`; `Questline.tsx` 588→449 y `QuestNodePanel.tsx` 602→456 | suite completa |
| — | Memoización del sendero | **No se hace**: `sameTrail` ya evita el `setState` con geometría idéntica y una caché extra habría que sincronizarla con el wrapping y las métricas de fuente. Decisión escrita en `useQuestTrail.ts` | — |

---

## 2. Verificación — ahora automatizada

`§2` ya no es una lista de comprobaciones manuales: `pnpm test:e2e` levanta Vite en Chromium real (Playwright 1.64.1, `chromium-1248` en caché) y ejecuta **36 tests**.

- **axe** WCAG 2 A/AA + best practices en los **8 temas × 2 superficies** y en los estados abiertos (panel, editor, confirmación de borrado, `Select`, `Combobox`, `DatePicker`). Los estados abiertos se auditan en diferencial contra el estado anterior: así un hallazgo preexistente no oculta lo que introduce el overlay.
- **Overflow** a **320, 375, 480, 768, 1024 y 1440 px** con la galería completa, el panel abierto y un título de 60 caracteres sin espacios.
- **Teclado y foco**: Tab/Enter/Escape del panel con retorno al disparador, `ThemePicker`, `Select`, `Combobox` y humo del sendero (paths con `d` no vacío en 2 y 3 filas).

### Hallazgos que encontró y ya están arreglados

| # | Hallazgo | Arreglo |
| --- | --- | --- |
| A11Y-01 | `FileUploader`: el nombre accesible no contenía la instrucción visible (WCAG 2.5.3) | El nombre incluye label + instrucción de la zona |
| A11Y-02 | Marcador de hito vencido: 2.74:1 en Nord+Panel, 3.68 en Pergamino, 3.81 en Gruvbox | `--ui-danger-text` por superficie (4.86–6.03:1) |
| A11Y-03 | Número del índice activo en Nord: 4.42:1 | `--accent-panel-strong` a 4.66:1 |
| A11Y-04 | Panel sobre papel Pergamino: kicker 4.18, nota/tally/etiquetas 4.2 | `--ui-success-text` y `--ui-text-muted` de papel claro (4.66–5.51:1) |
| A11Y-05 | Botón de peligro en Pergamino+Panel: 4.02:1 | `--ui-danger-text` (5.59:1) |
| — | `DatePicker` conocido (§3 anterior): «01 de noviembre» frente a «1» visible | Nombre del día sin relleno y **sin exclusión** en axe |
| — | `form-field-multiple-labels` en `TaskRow` (`incomplete`) | Una sola `<label>` nativa; nombre exacto «Marcar/Desmarcar «título»» conservado |

### Decisiones cerradas

- **Contraste sobre texturas: verificado a mano.** axe deja cientos de nodos `color-contrast` en `incomplete` porque las texturas de papel y panel (gradientes, imágenes de fondo, pseudo-elementos) impiden componer el fondo. El propietario del proyecto revisó esos nodos en los 8 temas y **los dio por válidos** (2026-11-18): no se reabre, no se reporta como pendiente y no se proponen herramientas nuevas para medirlo. El arnés los imprime y los adjunta como diagnóstico.
- **Sin lector de pantalla real ni Safari/Firefox**: el arnés es Chromium. Es un límite aceptado del arnés, no un hallazgo.
- **La revisión visual de los 8 temas** (jerarquía de muted, rojo de Nord, acento de panel) es del propietario; los ratios de los textos corregidos están medidos.
- **El arnés no tiene línea base**: un hallazgo nuevo deja el test rojo y se documenta en `e2e/FINDINGS.md`; no se silencia con `disableRules`.

---

## 3. Trampas conocidas y decisiones cerradas

- **Puerto del arnés**: `playwright.config.ts` sirve `127.0.0.1:4317` con `reuseExistingServer`. Dos worktrees ejecutando `pnpm test:e2e` a la vez comparten servidor: uno auditaría el código del otro.
- **Chromium fijado**: `@playwright/test` 1.64.1 corresponde a `chromium-1248`. Actualizarlo puede exigir `pnpm exec playwright install chromium`.
- **Preload de fuentes**: los `href` de los dos `<link rel="preload">` de `index.html` son literales; renombrar un `.woff2` obliga a actualizarlos.
- **ESLint**: `exhaustive-deps` está en `warn` a propósito y quedan seis `eslint-disable-next-line` justificados (patrón `aria-activedescendant` y `aria-invalid` sobre `role="button"`).
- **Decisiones ya tomadas, no reabrir sin motivo**: «Ahora» redondea hacia abajo; `minuteStep` se normaliza a 1–60 (fallback 5); las hojas de `Surface` bajan a 4/9 px bajo 640 px; los popups portaleados usan `region` nombrada y no `dialog`; `required` se anuncia como descripción cuando el rol no admite `aria-required`; el acento de estado (`--ui-danger`, `--ui-success`, `--ui-warning`) nunca se usa como texto: para eso están `--ui-*-text`; el `DatePicker` nombra el día sin relleno de cero para que el nombre contenga el texto visible.
