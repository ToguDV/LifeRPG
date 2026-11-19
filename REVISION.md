# Revisión técnica — LifeRPG UI

**Fecha:** 2026-11-18
**Estado:** la revisión general (32 hallazgos: BUG, A11Y, UX, PERF, MAINT, TEST) está implementada y verificada; su detalle histórico sigue en `git log -p REVISION.md` y sus decisiones de diseño en `DESIGN.md`. Aquí queda **solo lo pendiente**: los hallazgos de `Questline` (§1) y las comprobaciones manuales (§2).

---

## 1. Questline — abierto, no implementado

**Alcance:** `src/components/Questline/` y `tests/questline.test.tsx`. Typecheck, lint y la suite pasan, pero ningún test cubre los casos de abajo. jsdom no mide layout ni pinta el sendero (`useQuestTrail`).

### 1.1 Bugs funcionales

**Q-01 · El anuncio de cierre se calcula por posición y compite con el de borrado.** `completionSignature` es una cadena `0/1` sin ids y el efecto compara `previous[position]` (`Questline.tsx:233-258`). Al borrar un hito anterior a uno completo, las posiciones se desplazan y se anuncia «Hito B cumplido» aunque B ya lo estaba, pisando el «Hito A eliminado» de `deleteNode` (`Questline.tsx:159-169`). En el caso común (borrar un hito incompleto sin completos detrás) el efecto hace `setStatus('')` y **también se pierde el mensaje de borrado**.

*Arreglo:* firma por id (`Map<id, boolean>`) y un único dueño del `status` (o cola). Test: borrar un hito incompleto delante de uno completo.

**Q-02 · La validación nativa bloquea el error propio del título.** El formulario del editor no tiene `noValidate` y `TextInput` pasa `required` al `<input>` (`QuestNodePanel.tsx:133-144`, `:253-263`; `TextInput.tsx:130`). Con el título vacío el navegador corta el submit y `submitNode` nunca corre: se ve el globo nativo en vez de «El hito necesita un nombre.», que solo aparece con espacios (pasan `required`, fallan el `trim`).

*Arreglo:* `noValidate` (manteniendo `required` semántico) o `aria-required` sin validación nativa; test del caso vacío.

### 1.2 Comportamiento y accesibilidad

**Q-03 · Bloqueos y desbloqueos en silencio.** Solo se anuncia el cierre. Desmarcar la última tarea de un hito completo, o editar tareas, puede bloquear/desbloquear hitos posteriores sin aviso (`questline-model.ts:119-136`, `Questline.tsx:238-258`). Si el control enfocado pasa a `disabled`, el navegador puede mandar el foco al `body`.

*Arreglo:* comparar estados por id, anunciar ambos sentidos y gestionar el foco.

**Q-04 · El panel no recibe el foco al abrirse.** El DOM es `ol` (triggers) → panel → fila de añadir; al abrir no se mueve el foco, así que hay que tabular por todos los hitos posteriores (y en móvil el panel puede quedar fuera de pantalla). `panelRef` y `tabIndex={-1}` ya existen y se usan tras editar tareas (`QuestNodePanel.tsx:74`, `:165`, `:195`).

*Arreglo:* enfocar panel/encabezado con `requestAnimationFrame` al abrir (el retorno al trigger ya funciona) o mover el panel tras el hito abierto. Test de apertura por teclado.

**Q-05 · La nota del candado señala un hito que no desbloquea.** `getBlockingNode` devuelve el primer incompleto anterior (`questline-model.ts:99-108`): con A y B pendientes, el panel de C dice que se desbloquea al completar A, pero B sigue bloqueando. El comentario «always `index - 1`» es falso: un nodo bloqueado también está incompleto.

*Arreglo:* nombrar el bloqueo inmediato o reformular («…empezando por A»); corregir el comentario.

**Q-06 · «Se ha desbloqueado B» puede ser falso.** El efecto siempre mira `nodes[index + 1]` (`Questline.tsx:250-257`). Con A y B completos y C pendiente, reabrir y cerrar A anuncia que se desbloqueó B, que nunca estuvo bloqueado; además no dice «travesía completa» si todos los posteriores ya están completos.

*Arreglo:* derivar el primer nodo que pasa de `locked` a `active`.

### 1.3 Copy y UX

- **Q-07 · Copy del último hito** (`QuestNodePanel.tsx:407-413`): dice «Cierra este hito para abrir el siguiente» sin siguiente, y «El camino sigue» en el último cumplido. Usar `index === total - 1`.
- **Q-08 · «Cerrar el hito» significa dos cosas opuestas**: colapsar el panel (`QuestNodePanel.tsx:245`) y completar el hito (pie, `:407-413`). El badge dice «Cumplido», el tally «cerrado» (`:218`) y el estado «cumplido». Unificar: «Cerrar el panel» / «Completar–Cumplido».
- **Q-09 · Cancelar deja un hito borrador**: `addNode` inserta el hito de inmediato (`Questline.tsx:148-157`) y «Cancelar» solo cierra el editor (`QuestNodePanel.tsx:146-149`), dejando un «Nuevo hito» vacío que bloquea al siguiente. Decidir: crear al guardar, borrar el borrador intacto, o cambiar el copy.
- **Q-10 · Copy y recuentos**: el plazo se repite (kicker y tally, `QuestNodePanel.tsx:205-221`); con hitos sin tareas el header muestra «0 de 0 tareas» (`Questline.tsx:260-270`); `note` se muestra pero no se edita aunque `QuestNodePatch` lo soporta (documentar si es nota de autor).

### 1.4 Accesibilidad y responsive

- **Q-11 · Añadir tarea no se anuncia**: el foco sigue en el input y la tarea aparece por encima (`QuestNodePanel.tsx:145-152`, `:387-403`). Mover el foco al checkbox nuevo o anunciar «Tarea añadida» en un `status`.
- **Q-12 · El estado activo no tiene texto oculto**: `STATE_WORD` cubre `locked`/`complete`/`overdue` (`Questline.tsx:59-63`), no `active`; el raíl se apoya en el color aunque el panel diga «En curso». `DESIGN.md` exige no depender solo del color.
- **Q-13 · Hito bloqueado y vencido sin tinte de peligro**: el estilo de vencimiento depende de `data-state="overdue"` y pierde contra `locked` (`Questline.module.css:138-145`, `:191-193`; `QuestNodePanel.module.css:44-50`). Decidir si un bloqueado vencido se señala.
- **Q-14 · Escape y validaciones de tareas**: Escape no cierra el editor del hito ni la confirmación de borrado (`QuestNodePanel.tsx:253-289`, `:414-432`); añadir o renombrar tarea con título vacío se ignora en silencio.
- **Q-15 · Foco tras renombrar o eliminar tarea**: va al panel completo con `preventScroll` (`QuestNodePanel.tsx:165-190`), que en un panel alto puede quedar fuera de vista. Comprobar en navegador.
- **Q-16 · Texto dinámico sin `overflow-wrap`**: `.title` está protegido, pero no `.note`, `.confirmText`, `.lockNote` ni el label de `Checkbox` (`QuestNodePanel.module.css:81-151`, `:270-276`; `Checkbox.module.css:108-115`). Un título o nota sin espacios desborda a 320 px. Añadir `overflow-wrap: anywhere` + `min-width: 0`; valorar el arreglo global del `Checkbox`. Verificar en navegador.

### 1.5 Mantenimiento

- **Q-17 · Código muerto y comentarios inexactos**: `data-done` del `<li>` de tarea sin regla CSS (`QuestNodePanel.tsx:306`); `triggerId` generado y no referenciado (`Questline.tsx:280`, `:300`); `deadlineToKey` sin uso (`questline-model.ts:74`); comentario falso de `getBlockingNode` (Q-05); `QuestNodePanel.module.css:4` dice «every measure comes from tokens» pero hay `12rem`, `8rem`, `14rem`, `560px` y `stroke-width: 1.5`.
- **Q-18 · `label` por defecto en inglés**: «Questline» en una UI española, usado en el header visible y en el `aria-label` del raíl (`Questline.tsx:273`); con `label=""` el header queda vacío pero el `aria-label` cae a «Questline».
- **Q-19 · Plazos obsoletos a medianoche**: `new Date()` en render (`getQuestNodeStates`, `getQuestDeadline`) sin refresco en `visibilitychange`; «Vence hoy» / «Faltan N días» quedan viejos si la app sigue abierta. La fecha corta sin año es una limitación aceptada en `DESIGN.md`, ambigua en plazos de otro año.
- **Q-20 · IDs DOM y API pública**: ids con `node.id` sin sanear (`Questline.tsx:280`, `:300`); un id con espacios rompe `aria-controls`. `QuestDeadline`, `QuestDeadlineTone`, `formatQuestNumber`… no se reexportan: decidir qué es público.
- **Duplicación y tamaño**: `toggleTask`/`addTask`/`renameTask`/`deleteTask` repiten el mismo `map`/`filter` (`Questline.tsx:172-227`) — un `updateTasks(nodeId, updater)` lo reduce. Cuatro mapas de estado (`STATE_ICON`/`STATE_WORD` en `Questline.tsx`; `STATE_LABEL`/`STATE_VARIANT` en `QuestNodePanel.tsx`) piden un `STATE_META` (así se coló Q-12). `Questline.tsx` 399 líneas y `QuestNodePanel.tsx` 451: candidatos a dividir (`Stop`, `NodeEditor`, `TaskList`, `DeleteConfirm`). Cada toggle re-renderiza la cadena y remide el sendero (`useQuestTrail` depende de `nodes`): correcto a esta escala, a memoizar si crece.

### 1.6 Tests que faltan

En `tests/questline.test.tsx`, por prioridad:

| # | Caso | Cubre |
| --- | --- | --- |
| 1 | Borrar un hito incompleto delante de uno completo | Q-01 |
| 2 | El mensaje de borrado no se pierde | Q-01 |
| 3 | Desmarcar/añadir tareas que rebloquean hitos y su anuncio | Q-03 |
| 4 | Reabrir un hito y volver a cerrarlo: mensaje correcto | Q-06 |
| 5 | Título vacío con `noValidate` | Q-02 |
| 6 | Foco al abrir el panel | Q-04 |
| 7 | Copy del último hito | Q-07 |
| 8 | Cancelar la creación de un hito | Q-09 |
| 9 | Foco tras eliminar hito/tarea | Q-15 |
| 10 | Plazo: editar y borrar; Escape en el editor de tarea | Q-14 |

Falta también `tests/questline-model.test.ts` (el modelo puro no tiene tests propios): `parseDeadlineKey` (válidas, inválidas, 29 de febrero), `daysUntilDeadline` (hoy, mañana, ayer, cambio de horario), `getQuestNodeStates` (hito vacío, completo tras reabrir uno anterior, varios pendientes, vencido), `getBlockingNode` (uno y varios pendientes → Q-05), `getQuestDeadline` (todos los tonos, incluido `none`), `countQuestTasks`, `isQuestNodeComplete`, `formatQuestNumber`, `deadlineToKey`.

---

## 2. Verificación manual pendiente

No automatizable aquí: axe no vive en el repositorio y jsdom no mide layout. Antes de cerrar una entrega:

- axe WCAG 2 A/AA + best practices en los **8 temas × 2 superficies**; la pasada completa es de la revisión base y la posterior a los cambios fue ad-hoc sobre un tema. La afirmación «0 violaciones» de `AGENTS.md` solo cubre el estado base.
- Teclado completo (flechas, Home/End, Enter, Escape, Tab y retorno de foco) y `prefers-reduced-motion`: no se repitieron tras los cambios.
- Overflow horizontal a 320/375/480/768/1024/1440 px: medido en Chromium, sin CI. Incluye el panel de Questline abierto, títulos y notas sin espacios, y el sendero en 2 y 3 filas.
- Lector de pantalla real (TaskRow, listboxes, `required`, toasts) y prueba en Safari/Firefox.

---

## 3. Trampas conocidas

- **Hallazgo colateral en `DatePicker`**: con un segundo `DatePicker` abierto, axe marca `label-content-name-mismatch` en las celdas de día (visible «1», nombre «01 de noviembre…»). Es anterior a esta revisión y quedó fuera del alcance.
- **Preload de fuentes**: los `href` de los dos `<link rel="preload">` de `index.html` son literales; renombrar un `.woff2` obliga a actualizarlos a mano.
- **ESLint**: `exhaustive-deps` está en `warn` a propósito y hay seis `eslint-disable-next-line` justificados (patrón `aria-activedescendant` y `aria-invalid` sobre `role="button"`).
- **Decisiones ya tomadas, no reabrir sin motivo**: «Ahora» redondea hacia abajo; `minuteStep` se normaliza a 1–60 (fallback 5); las hojas de `Surface` bajan a 4/9 px bajo 640 px; los popups portaleados usan `region` nombrada y no `dialog`; `required` se anuncia como descripción cuando el rol no admite `aria-required`. Detalle en `DESIGN.md`.
