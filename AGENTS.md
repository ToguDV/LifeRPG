# AGENTS.md — Guía operativa

> **LifeRPG UI**: kit de componentes React con estética de diario de fantasía.
> Este archivo es corto a propósito: comandos, reglas que no se deducen del código y trampas.
> Antes de tocar estilos, tokens, temas o superficies, lee **`DESIGN.md`**.

## Comandos

```bash
pnpm dev          # http://localhost:5173
pnpm typecheck    # TypeScript, sin emitir
pnpm lint         # ESLint + check:docs (vigila este archivo)
pnpm test:run     # Vitest sobre jsdom
pnpm test:e2e     # Playwright: axe, overflow y teclado en Chromium real
pnpm build        # typecheck + build de producción
```

- Antes de entregar: `pnpm typecheck && pnpm build && pnpm lint && pnpm test:run && pnpm test:e2e`.
- Si falta el Chromium del arnés: `pnpm exec playwright install chromium`.

## Dónde mirar

- `src/components/<Nombre>/` — un componente por carpeta (`<Nombre>.tsx` + `.module.css`).
- `src/styles/tokens/` — `primitives.css` (invariantes) y `themes.css` (8 paletas + `--ui-*`).
- `src/theme/` — `themes.ts` (única lista de temas), provider y selector.
- `src/lib/` — `useControllableState`, `useFloating`, `useDismiss`, `cx`, fechas y formato.
- `src/gallery/` — la galería es la superficie de revisión. Cada hoja de demo es una `Card size="lg"` con el nombre del componente en el `Badge` de `kicker`.
- `tests/` (jsdom, un asunto por archivo) y `e2e/` (Chromium real).
- `DESIGN.md` — el porqué visual · `README.md` — uso y estructura · `design/mockup.html` — referencia original.

## Reglas

**Tokens.** En `src/components/**/*.module.css` no hay colores crudos, tamaños de fuente ni espaciados principales: solo `--ui-*`, `--space-*`, `--text-*`, `--control-*`. La paleta cruda vive en `themes.css` (excepción documentada: `--xp-*`). Un valor que se repite se convierte en token. Cada tema define `--accent-panel`, `--accent-paper` y `--danger/success/warning-*`.

**Superficies y portales.** `Surface` da material; `Card` cuando además hay cabecera, lacre y lista. Lo que se portalea (`Popover`, tooltips, toasts, menús) llama a `useSurface()` y pone `data-surface` en el nodo flotante o pierde el material. La sombra del papel es `--ui-paper-drop`. No pongas `overflow: hidden` en una tarjeta que pueda alojar un popover.

**Formularios.** `Field` para label, hint, error y required; `getFieldMessageId` para los ids; `useControllableState` para `value`/`onChange`/`defaultValue`. Errores con `role="alert"` y `aria-invalid`. Conserva la semántica nativa de checkbox, radio, switch y range.

**Overlays.** `Popover` + `useFloating` + `useDismiss`. Foco inicial en `requestAnimationFrame`; Escape devuelve el foco al trigger; clic fuera cierra. Select y Combobox no mueven el foco: `aria-activedescendant` en el trigger/input. En Combobox, `anchorRef` es el contenedor entero, no solo el input.

**Accesibilidad.** Nombre accesible, recorrido completo con teclado, foco visible y devuelto, estados con texto o aria además de color, `prefers-reduced-motion`. `pnpm lint` es el control rápido; `pnpm test:e2e` (axe WCAG 2 A/AA, 8 temas × 2 superficies, sin línea base) es el que manda.

**Responsive.** Sin scroll horizontal de 320 a 1440 px, y se corrige el elemento: nunca con `overflow-x: hidden`. `min-width: 0` en tarjetas y campos. Las demos usan `DemoGrid` con `columns={2}` o `{3}`, no `auto-fit` con spans.

**Temas.** Añadir uno toca solo `src/theme/themes.ts` y `themes.css`. La lista del script de arranque de `index.html` la inyecta el plugin `liferpg-theme-manifest` de `vite.config.ts`: no la escribas a mano. `themes.ts` no importa nada de navegador (lo lee Vite).

**Tests.** Un archivo por asunto, sin globals (importa de `vitest`) y escrito contra roles, nombres accesibles y texto visible; nada de snapshots completos ni asserts sobre clases. Reloj fijo solo con `vi.useFakeTimers({ toFake: ['Date'] })`. jsdom no tiene layout: rects, overflow y contraste pintado se juzgan en `e2e/`.

## Trampas

- **`incomplete` de contraste: cerrado.** axe no compone fondos con textura. El propietario revisó esos nodos a mano en los 8 temas y los dio por válidos el 2026-11-18. No es un pendiente: no lo reportes ni propongas medirlo de nuevo.
- **Puerto 4317 compartido.** `playwright.config.ts` usa `reuseExistingServer`: dos worktrees a la vez comparten servidor y uno audita el código del otro. Cambia `PORT` o para el otro servidor.
- **Preload de fuentes.** `index.html` precarga `im-fell-english-400` y `cinzel-400-700`; si cambias la fuente del cuerpo o renombras el archivo, actualiza el `href` o se descargará dos veces.
- **Contraste de acentos.** El texto del botón primario va sobre la banda oscura del gradiente; el papel claro no usa `--ink-3` directo para muted. Mide antes de aclarar.
- **Rendimiento del arte.** El borde rasgado es un `clip-path` compartido (`#ui-torn-clip`), no un filtro por tarjeta; la sombra del papel es `box-shadow`. Nada de `mix-blend-mode` en capas fijas ni `backdrop-filter` en la topbar. El grano es un tile de fondo compartido, no un filtro por elemento.
- **`design/mockup.html`** es la referencia original: ajústalo solo para mantenerlo funcional, no para reflejar la app.
- **Sin Storybook** ni librería de UI, Tailwind o de fechas; fuentes locales, sin CDN. No añadas dependencias sin justificarlo.

## Verificación manual

El arnés no cubre todo: revisa los 8 temas en papel y panel (sobre todo los rojos de Nord/Gruvbox), prueba lector de pantalla, Safari y Firefox, y deja la consola limpia.

## Mantener este archivo

Presupuesto: **90 líneas, 8 000 caracteres, 6 secciones y ninguna tabla**. `pnpm lint` lo comprueba con `scripts/check-docs.mjs` y falla si se pasa; subir el presupuesto exige editar el script a mano.

Esto no es un inventario: los archivos se descubren con `ls` y `rg`. Antes de añadir algo, pregúntate si un agente lo deduciría en un minuto leyendo el código; si la respuesta es sí, no va aquí. El uso va a `README.md`, el porqué visual a `DESIGN.md` y los hallazgos a `e2e/FINDINGS.md`.
