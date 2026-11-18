# DESIGN.md — Decisiones de diseño

> Documento de referencia de **LifeRPG UI — Códice de Componentes**.
> Explica qué se decidió, por qué, y dónde vive cada decisión en el código.
> Si cambias una regla visual o de interacción, actualiza este archivo.

---

## 1. Concepto

La interfaz es el cuaderno de invierno de una viajera: un diario de tareas que también es un objeto. El punto de partida es el mockup estático **El Largo Invierno — Diario de la Marca Hueca** (`design/mockup.html`).

La versión React no intenta ser un “tema oscuro genérico”. Intenta conservar tres cosas del mockup:

1. **Materia**: papel gastado, grano, bordes rasgados, paneles de piedra, cera y tinta.
2. **Jerarquía**: lo importante se lee primero; la decoración no compite con el contenido.
3. **Flexibilidad**: ocho tintas y dos superficies sin duplicar componentes.

La estética se apoya en la tipografía, la textura y el color. **No se usan imágenes de pergamino ni iconos externos**: las texturas son SVG generados y los iconos son un set propio de paths.

---

## 2. Principios

### 2.1 La estructura no cambia con el tema

Un tema solo cambia la tinta: colores, contraste, textura del papel y acentos. La geometría, la jerarquía, los tamaños y el comportamiento de los controles son idénticos en las ocho paletas.

Esto permite:

- Probar un componente una vez y confiar en que se verá en todos los temas.
- Añadir una paleta sin tocar componentes.
- Cambiar de tema sin que la página “salte”.

### 2.2 Dos materiales, un mismo control

Un control puede vivir sobre **papel** o sobre **panel**. No son dos componentes distintos: son dos contextos de tokens. El mismo `Button`, `Checkbox` o `TextInput` se re-colorea solo.

### 2.3 Material antes que ornamento

Las texturas y los bordes rasgados se usan para construir la sensación de papel, no para llenar espacio. Los filtros SVG pesados se limitan a la capa de fondo de las tarjetas; el contenido no se filtra.

### 2.4 La anotación a mano es estado, no decoración

La tipografía `Caveat` se reserva para notas, pistas, subtítulos y valores secundarios. Sirve para contar el estado (“2 de 3 provisiones”, “Has sellado el diario 2 veces”) sin competir con el texto principal.

La información crítica no depende solo del texto manuscrito: siempre hay una etiqueta, un valor o un estado ARIA que la respalda.

### 2.5 Accesibilidad dentro del material

Los estados de foco, error, deshabilitado y selección forman parte del sistema visual, no son una capa añadida al final. El contraste se ajustó por tema y la navegación por teclado es parte de la definición de cada control.

---

## 3. Modelo de tokens

Los tokens se organizan en cuatro capas. La regla es simple: **un componente nunca lee una paleta cruda**.

```
Capa 1 · paleta del tema         --stone-0, --bone, --parch, --ink, --ribbon-2, --vital-1…
Capa 2 · semántica de superficie --ui-panel-*, --ui-paper-*
Capa 3 · bindings de contexto    --ui-text, --ui-surface, --ui-accent, --ui-field-bg…
Capa 4 · primitivas invariantes  --space-*, --text-*, --font-*, --control-*, --radius-*, --duration-*
```

### 3.1 Paleta cruda

Vive en `src/styles/tokens/themes.css`. Cada tema define, como mínimo:

- `--stone-0…3`: fondo de escritorio / paneles.
- `--bone`, `--bone-dim`, `--bone-faint`: tinta sobre panel.
- `--parch`, `--ink`, `--ink-2`, `--ink-3`: papel y tinta sobre papel.
- `--panel-1…3`, `--well`, `--paper-raised`: superficies.
- `--ribbon-1…3`: cera / botón primario.
- `--vital-1…3`: salud, resistencia, saciedad y estados.
- `--ribbon-*`, `--map-*`, `--xp-*`, `--pin-*`: acentos específicos del mundo.
- `--accent-panel`, `--accent-paper`, `--danger-*`, `--success-*`, `--warning-*`: decisiones semánticas del tema.

### 3.2 Semántica de superficie

En el mismo archivo se definen dos juegos:

- `--ui-panel-*`: texto, bordes, campos, acentos, estados y selección para paneles.
- `--ui-paper-*`: los mismos roles para papel.

Después se mapean a los tokens de contexto:

```css
[data-surface="paper"] {
  --ui-text: var(--ui-paper-text);
  --ui-field-bg: var(--ui-paper-field-bg);
  --ui-accent: var(--ui-paper-accent);
  /* … */
}
```

`data-surface="panel"` hace lo propio con los tokens de panel. El valor por defecto de la página es panel.

### 3.3 Tokens que usan los componentes

Los componentes consumen, entre otros:

| Grupo | Tokens |
| --- | --- |
| Texto | `--ui-text`, `--ui-text-soft`, `--ui-text-muted`, `--ui-placeholder` |
| Superficie | `--ui-surface`, `--ui-surface-raised`, `--ui-surface-sunken`, `--ui-surface-overlay` |
| Bordes | `--ui-border`, `--ui-border-strong`, `--ui-divider`, `--ui-divider-soft` |
| Campos | `--ui-field-bg`, `--ui-field-bg-hover`, `--ui-focus` |
| Acción | `--ui-accent`, `--ui-accent-strong`, `--ui-accent-soft`, `--ui-accent-contrast` |
| Botón principal | `--ui-primary-bg`, `--ui-primary-bg-hi`, `--ui-primary-bg-lo`, `--ui-primary-text`, `--ui-primary-edge` |
| Estados | `--ui-danger`, `--ui-success`, `--ui-warning` (+ `-soft`) |
| Sombras | `--shadow-sm/md/lg/xl`, `--shadow-inset`, `--shadow-wax` |
| Foco | `--ui-focus`, `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-style` |

### 3.4 Primitivas invariantes

Viven en `src/styles/tokens/primitives.css`:

- Espaciado: ritmo de 4 px (`--space-1`…`--space-24`) con micro-tokens de 1 y 2 px.
- Tipografía: familias, escala, interlineados, tracking, pesos.
- Geometría de controles: alturas 30/38/44 px, paddings, iconos, checkbox, radio, switch, slider, rueda, calendario, dropzone.
- Formas: radios de 1 a 4 px, círculos y píldoras.
- Sombras: derivadas de `--ui-shadow-color`, por lo que cambian con la superficie.
- Movimiento, capas (`--z-*`), texturas y geometría de la textura.
- Layout global: ancho de página, gutter, sidebar, medida de lectura, gaps de sección.

### 3.5 Reglas y excepciones

- **Regla**: en `src/components/**/*.module.css` no se escriben colores crudos, ni tamaños de tipografía, ni espaciados principales. Se usan tokens.
- **Excepción intencional**: `ProgressBar variant="xp"` usa `--xp-1` y `--xp-2` directamente, porque la experiencia es un color del mundo, no un color de superficie.
- **Excepción documentada**: `src/theme/themes.ts` repite cuatro hexadecimales por tema en `swatches` para el selector de temas. El selector muestra paletas que **no** están aplicadas, así que no puede leer las custom properties en runtime; la copia es el contrato. Las muestras son, en orden, `--stone-0` (escritorio; `--panel-1` en Pergamino), `--parch`, `--ink` y el acento titular del tema (`--crimson`, `--chalk-rouge`, `--bronze` o `--bronze-soft`), y cada entrada nombra sus tokens en el código. Retocar una paleta obliga a tocar los dos archivos en el mismo cambio.
- **Excepción práctica**: los breakpoints de `@media`, la geometría de los SVG decorativos, el patrón `visually-hidden` de 1 px y algunos detalles de arte no pueden o no deben tokenizarse. Están documentados en los módulos correspondientes.
- El texto de la interfaz está en español; los nombres de API y props están en inglés.

---

## 4. Temas

### 4.1 Los ocho temas

| Clave | Nombre | Papel | Intención |
| --- | --- | --- | --- |
| `pergamino` | Pergamino | Claro | El tema canónico: papel claro sobre escritorio oscuro. |
| `chalk` | Tiza | Oscuro | Cartulina negra, tiza y arcilla. |
| `catppuccin` | Catppuccin | Oscuro | Mocha, malva y rosa. |
| `dracula` | Dracula | Oscuro | Noche púrpura. |
| `nord` | Nord | Oscuro | Frío polar, azul y cian. |
| `gruvbox` | Gruvbox | Oscuro | Cuero, ámbar y óxido. |
| `rosepine` | Rosé Pine | Oscuro | Rosa marchita y malva. |
| `tokyonight` | Tokyo Night | Oscuro | Neón velado. |

La diferencia entre Pergamino y el resto no es “claro vs. oscuro” sin más: Pergamino tiene **papel claro real** sobre un escritorio oscuro; los demás tienen **cartulina oscura**, con la misma geometría y la misma sensación de material.

### 4.2 Selección y persistencia

- `<html data-theme="…" data-paper="light|dark">`.
- `ThemeProvider` escribe ambos atributos y guarda la clave en `localStorage` (`liferpg-ui-theme`).
- El script inline de `index.html` aplica el tema antes del primer pintado para evitar un flash de Pergamino. `src/theme/themes.ts` es la única lista de temas: el plugin `liferpg-theme-manifest` de `vite.config.ts` serializa las claves y su `paper` dentro del script en `serve` y en `build`. No hay una segunda lista escrita a mano.
- `color-scheme` se deriva de `data-paper` en `base.css`, no de la paleta: `html[data-paper="light"]` da esquema claro y el resto, oscuro. Así el caret, el autofill y los controles nativos siguen el papel desde el primer pintado. En Pergamino el cambio se nota sobre todo en el caret y el fondo del autofill: la barra de scroll conserva su `scrollbar-color` temático, así que no se aclara sobre el escritorio oscuro (solo un navegador que ignore esa propiedad dibujaría un carril claro).
- `data-paper` permite ajustar la textura del papel sin duplicar selectores por tema:
  - `light`: gradientes claros, grano con `multiply`.
  - `dark`: grano tenue con `screen`, sombras más profundas.
- Al cambiar de tema se añade `html.theme-switching` durante dos frames para que la paleta cambie como tinta, no como una animación de todas las propiedades.

### 4.3 Acento de papel vs. acento de panel

Es una decisión deliberada:

- **Papel** usa un acento cálido de “tinta”: `--chalk-rouge` en los temas oscuros, `--crimson` en Pergamino. Así los controles parecen estampados en la hoja.
- **Panel** usa el acento metálico del tema: malva, cian, oro, azul, etc. Así los controles parecen herrajes sobre piedra.

El resultado es que el mismo control cambia de temperatura al alternar Papel / Panel. Es parte de la narrativa de materiales, no una inconsistencia.

### 4.4 Contraste

Decisiones concretas para mantener legibilidad sin perder la estética:

- El texto “muted” del papel claro se mezcla 50/50 entre `--ink-3` e `--ink-2`; antes se perdía por debajo de 4.5:1.
- El texto “muted” del panel se mezcla 70/30 entre `--bone-faint` y `--bone-dim`; mantiene la jerarquía y gana contraste.
- El botón primario no usa el color de cinta sin más: `--ui-primary-bg` mezcla un 72 % de `--ribbon-2` con un 28 % de `--stone-0`.
- El gradiente primario concentra el brillo en el 24 % superior; el centro y el texto descansan sobre el color oscuro. Esto permite blanco sobre cera en todos los temas, incluidos Catppuccin, Rosé Pine y Tokyo Night.
- Los estados de error usan `--danger-paper` / `--danger-panel` según superficie; no se reutiliza el rojo de salud sin contexto.
- El foco es un borde discontinuo de 1 px con offset de 3 px. En controles compactos se usa el offset ajustado de 1 px.

### 4.5 Añadir un tema

1. Añadir la entrada en `src/theme/themes.ts` con clave, etiqueta, meta, `paper` y las cuatro muestras.
2. Añadir la paleta y los acentos semánticos en `src/styles/tokens/themes.css`.

No se toca ningún componente ni `index.html`: el script de arranque se regenera desde `THEMES`. Si el tema necesita un papel claro, `paper: 'light'`; si no, `paper: 'dark'`.

---

## 5. Superficies

### 5.1 Papel

- Color base `--parch`, gradientes de luz y sombra, grano SVG.
- Borde irregular mediante la silueta fija `#ui-torn-clip` (un `clipPath` en `objectBoundingBox`) sobre la capa de textura, nunca sobre el contenido.
- Sombra exterior **siempre oscura**: `box-shadow` con `--ui-paper-drop` (tinta cálida sobre papel claro, negro sobre cartulina oscura), no un `drop-shadow` que rasterice la tarjeta entera.
- Sombra interior de viñeta, sin brillos perimetrales.
- La luz, la sombra y el grano se apilan en **una sola** capa de textura: los degradados de borde viven en el mismo `background-image`, no en un pseudo-elemento extra.
- `tilt` opcional muy leve (`±0.22deg`) para que las hojas no parezcan tarjetas perfectas.
- La capa de textura queda por debajo del contenido (`z-index`) y el `Surface` aísla el stacking context.

**Sin halo.** La cartulina oscura no proyecta luz: sobre `data-paper="dark"` no hay filo interior luminoso, ni velo superior, ni sombra clara. El borde se define con una viñeta oscura y una sombra negra, y la única luz es la del propio papel. Las siete paletas oscuras comparten ese comportamiento; Pergamino conserva su sombra cálida porque su tinta es oscura.

**Coste de pintura.** El papel es la parte más cara de la interfaz y por eso se pinta con capas baratas: un `clip-path` de geometría compartido en vez de un `feDisplacementMap` por hoja, una `box-shadow` en vez de un `drop-shadow` sobre el subárbol, y sin `mix-blend-mode` a pantalla completa. Las máscaras (`mask-image`) solo se usan cuando la geometría no puede sustituirlas. Cualquier capa nueva debe medirse con el rendimiento en mente: la concatenación de filtros por tarjeta fue la causa de que la galería tardara segundos en pintar.

**Ornamentos.** `Surface` acepta capas físicas opcionales. Todas son decorativas (`aria-hidden`), se pintan bajo el contenido y se apagan con una prop; sólo existen sobre papel.

| Prop | Capa | Tokens |
| --- | --- | --- |
| `stack="single\|double"` | Hojas bajo la tarjeta, desplazadas 9 y 19 px; se distinguen por tono, sin borde ni canto. | `--paper-sheet-*`, `--ui-paper-sheet-back*` |
| `margin="rule"` | Margen de cuaderno de 38 px con línea vertical de acento. | `--paper-margin-*` |
| `stains` | Manchas de agua y una marca de marea, sólo en el pie; el propio degradado las apaga fuera del texto, sin máscara. | `--ui-paper-stain*` |

Las hojas de debajo se tiñen con `--bronze` (papel guardado en un cajón: algo más oscuro y amarillo) y comparten la silueta rasgada del papel principal. El orden de pintado es el físico: la hoja más profunda primero, la que toca la tarjeta encima. **En ningún tema dibujan borde**: no hay canto iluminado ni costura en sombra, y la pila se lee solo por profundidad de tono, cada hoja más oscura que la anterior. Del canto solo se ve el borde, así que no repite el grano: ese tile completo por hoja era otra capa cara sin diferencia visible.

Por debajo de 640 px el desplazamiento de la pila baja a 4 y 9 px. El margen de página en móvil es de 16 px y una hoja que asomaba 19 px ensanchaba el documento, no solo la tarjeta; con el desplazamiento reducido la decoración cabe en el margen y la pila sigue leyéndose por tono. Es geometría de arte, así que vive con el resto de los tokens de ornamento (`primitives.css`).

El lacre vive aparte: `WaxSeal` estampa el folio en cera con los tokens de la acción principal y anuncia «Folio N» con `role="img"`. La cera se dibuja como SVG con tres trazados —la cera que rebosa, el cuerpo irregular y el anillo de la matriz—, de modo que la silueta nunca es un círculo; la sombra sigue esa silueta con `drop-shadow` sobre el contenedor.

**Contenedores.** `Card` es la hoja reutilizable: cabecera (kicker, título, descripción, lacre), filete, cuerpo y pie manuscrito. `tilt` es el mismo ornamento de `Surface` y se ignora sobre panel. Tres alturas, con el mismo material y los mismos ornamentos:

- `sm`: ficha de 21 rem, padding medio, título `--text-lg`.
- `md`: pliego de 30 rem, padding grande, título `--text-xl`.
- `lg`: página completa, padding grande, título `--text-2xl`.

**La cinta del título.** Sobre papel el título no es una línea de texto: `RibbonTitle` lo lleva a una cinta de cera que cruza el borde superior rasgado. Comparte los tokens de la acción principal (`--ui-primary-*`), como el lacre, y no añade reflejos, filtros ni `backdrop-filter`: la banda es un degradado de tres paradas y las colas, dos `clip-path` estáticos.

La banda se sube con el padding heredado de `Surface` (`--surface-pad`) más `--card-ribbon-rise`; así cruza el canto en las tres alturas sin repetir medidas. Debajo, la cinta reserva la caída de las colas más `--space-4` antes de la cabecera. Las colas viven detrás de la banda, asoman `--card-ribbon-tail-peek` y cuelgan `--card-ribbon-tail-drop`; la muesca de golondrina se corta con `clip-path` a partir del asomo visible. La banda se limita a `100% - 2 × asomo`, de modo que la decoración nunca crece el documento. Por debajo de 640 px el asomo baja a 1 rem y el título un paso de escala para que la cinta siga cabiendo a 320 px.

Las colas son capas `aria-hidden`; el `<h3>` real vive dentro de la banda y sigue nombrando la tarjeta. El contenedor no crea landmarks. Sobre panel la cinta no se pinta: el título vuelve a ser un encabezado normal.

Por debajo de 720 px los tres colapsan al ancho de la columna y el margen de cuaderno se desactiva para no comerse el contenido.

La cabecera del `Card` es un `<div>`, no un `<header>`: una tarjeta reutilizada directamente en el `body` convertiría su fila de título en un segundo landmark `banner`. El contenedor no emite landmarks; el `<h3>` interior (en la cinta o en la cabecera del panel) sigue nombrándolo.

### 5.2 Panel

- Fondo `--panel-*` con gradiente, grano y borde de 1 px.
- Sin borde rasgado.
- Brillo interior superior y viñeta interior para simular piedra.
- Elevación con `--shadow-lg`/`--shadow-xl`.

### 5.3 Propagación de contexto

`Surface` hace dos cosas:

1. Pone `data-surface` en el DOM.
2. Provee un `SurfaceContext` de React.

Los popovers se renderizan en un portal al `body`, fuera del árbol visual. Para que conserven el material, `Popover` lee `useSurface()` y escribe `data-surface` en el elemento flotante. Por eso un calendario abierto sobre una hoja es de papel, y uno abierto sobre un panel es de panel.

---

## 6. Tipografía

### 6.1 Familias y roles

| Token | Familia | Uso |
| --- | --- | --- |
| `--font-body` | IM Fell English | Texto principal, párrafos, inputs, descripciones. |
| `--font-caps` | IM Fell English SC | Títulos de tarjeta y secciones; versalitas. |
| `--font-display` | Grenze | Título de página, meses, hora, cabeceras grandes. |
| `--font-engraved` | Cinzel | Etiquetas de formulario, botones, metadatos, valores numéricos. |
| `--font-hand` | Caveat | Notas, pistas, folios, subtítulos manuscritos. |
| `--font-gothic` | Grenze Gotisch | Disponible para acentos góticos; actualmente no se usa en componentes. |

Todas las familias se sirven localmente desde `public/fonts` (subconjuntos latin de Google Fonts, SIL Open Font License). `@font-face` está en `src/styles/fonts.css`.

`index.html` precarga con `crossorigin` las dos familias que se pintan en el primer viewport: `im-fell-english-400.woff2` (cuerpo) y `cinzel-400-700.woff2` (marca, navegación y kicker de la topbar y el masthead). El resto se carga bajo demanda. Renombrar esos archivos obliga a actualizar el `href` del preload; si no coincide con el `src` del `@font-face`, el navegador descarga la fuente dos veces.

### 6.2 Escala y jerarquía

- Escala de `--text-2xs` (11 px) a `--text-6xl` (72 px).
- Etiquetas de control: 11 px, `Cinzel`, mayúsculas, tracking amplio.
- Texto de cuerpo: 15 px, `IM Fell English`, interlineado 1.5.
- Títulos de tarjeta: `IM Fell English SC` a 28 px.
- Título de página: `Grenze` con `clamp()` entre 44 y 72 px.
- Notas: `Caveat` 13–16 px. Nunca se usa para información que no esté también en texto normal o en un atributo accesible.

### 6.3 Decisiones de lectura

- No se usa mayúscula sostenida en párrafos.
- Las etiquetas en mayúsculas siempre llevan `letter-spacing` y un tamaño pequeño; el contraste se ajustó para que sigan siendo legibles.
- Los números de valores, contadores y folios usan `font-variant-numeric: tabular-nums` cuando importa la alineación.
- El mes del calendario empieza con mayúscula solo en la primera letra (`::first-letter`), no capitaliza “De”.

---

## 7. Color, estados y elevación

### 7.1 Estructura del color

Cada tema tiene:

- Un **escritorio** (`--stone-*`) que no es el papel.
- Un **papel** (`--parch`, `--paper-raised`) con tinta propia (`--ink-*`).
- Un **panel** (`--panel-*`) con tinta hueso (`--bone-*`).
- Una **cinta** (`--ribbon-*`) para la acción principal.
- **Estados** del mundo (`--vital-*`) y estados de UI (`--danger-*`, `--success-*`, `--warning-*`).

### 7.2 Controles

- Fondo de campo: tinte de tinta al 4 % sobre papel; pozo oscuro sobre panel.
- Borde: 1 px con mezcla del texto; hover sube el borde a un tono más fuerte.
- Foco: borde de acento + anillo de 1 px, outline discontinuo.
- Error: borde y mensaje en `--ui-danger`; el label también cambia.
- Deshabilitado: `opacity: 0.45` y cursor `not-allowed`; no se depende solo del color.
- Selección: fondo de acento con texto de contraste; el check/radio usan `--ui-accent-contrast`.

### 7.3 Botones

- **Primary**: cera/ribbon con gradiente oscuro y texto `--pin-hi`. Es la única acción que se permite ser “sólida y ruidosa”.
- **Secondary**: superficie elevada con borde y grano tenue; la herramienta de mesa.
- **Ghost**: sin fondo hasta el hover; acciones terciarias.
- **Danger**: contorno y tinte de peligro, no un bloque rojo saturado.
- Tamaños: 30/38/44 px; icono solo = cuadrado.
- Estados: loading con spinner integrado, disabled, full width, iconos a izquierda/derecha.

### 7.4 Sombras y profundidad

Las sombras se derivan de `--ui-shadow-color`:

- Papel claro: tinta cálida en `--ui-paper-drop`, para que la hoja proyecte una sombra de papel.
- Papel oscuro: negro en `--ui-paper-drop`; nunca la tinta clara, que dibujaría un halo.
- Panel: `--stone-0`, para una sombra negra de piedra.

No hay sombras “de neón” ni glassmorphism. La profundidad viene de capas, bordes, grano y una luz superior sutil.

---

## 8. Espaciado, forma y textura

- Ritmo base de 4 px; los tokens de 1 y 2 px existen para offsets ópticos.
- Radios pequeños: 1–4 px. No hay tarjetas de 16 px redondeadas.
- Círculos solo para checkbox/radio/switch, días del calendario y botones de icono.
- Alturas de control: 30/38/44 px. El tamaño `md` (38 px) es el estándar de la galería.
- Texturas:
  - Grano general: SVG `feTurbulence` con dos variantes (normal y tenue).
  - Papel: grano multiplicado o tamizado según `data-paper`.
  - Panel: grano con mezcla `overlay`.
  - Bordes rasgados: silueta normalizada `#ui-torn-clip` definida una vez en `TornSilhouette`. Es un `clipPath` con `clipPathUnits="objectBoundingBox"`, determinista y compartido por todas las hojas; sustituye a los antiguos filtros `feTurbulence`, que se reevaluaban por tarjeta en cada pintado.
  - Papel físico: hojas apiladas y envejecidas, margen de cuaderno y manchas de borde, con geometría en `primitives.css` y color en `themes.css`.
- Los iconos son paths propios de 24×24 con `currentColor`, trazo 1.5 y extremos redondeados.

---

## 9. Movimiento

- Duraciones: 80 / 140 / 220 / 320 / 480 ms.
- Easing principal: `cubic-bezier(.2,.8,.25,1)`.
- Se anima lo que comunica estado: apertura de menús, cambio de chevron, spinner, toast, hover de botones.
- No hay animaciones de entrada de tarjetas ni parallax.
- `prefers-reduced-motion` lleva todas las duraciones a 0 y detiene motas/spinner.
- El cambio de tema desactiva transiciones durante dos frames para evitar que todos los colores se interpolen.

---

## 10. Patrones de componentes

### 10.1 Formularios

- Todos los campos complejos usan `Field`: label, label aside, hint, error y ids `-hint`/`-error`.
- El `<label>` lleva id `${id}-label` (`getFieldLabelId`) y es lo que nombra a los popups portaleados; `hideLabel` lo oculta con `visually-hidden`, nunca lo omite.
- Los mensajes se conectan con `aria-describedby`; el error usa `role="alert"`.
- `hint` y `error` conviven: el error se pinta primero y el hint después, y `aria-describedby` lista `-error` y `-hint` en ese orden (`getFieldMessageIds`). El error nunca hace desaparecer la pista, así que un control que pase ambos sigue explicando cómo corregir.
- Limpiar `TextInput` es una edición real: el foco vuelve al input y `onChange` recibe `''` tanto en controlado como en no controlado. `onClear` es trabajo extra (`onChange` ya se ha disparado), no la única vía para vaciar el campo.
- Los controles aceptan controlado/no controlado mediante `useControllableState`.
- Los inputs nativos conservan semántica nativa siempre que sea posible.
- Checkbox/Radio/Switch usan inputs nativos visualmente ocultos y un “box” estilizado; el foco se dibuja sobre el box, no sobre el input invisible.

### 10.2 Popovers

- `Popover` + `useFloating` + `useDismiss`.
- Posición fija calculada contra el trigger; `side` se respeta siempre que quepa y el volteo arriba/abajo es solo el recurso cuando la preferencia no tiene sitio.
- Se portalea al `body` para escapar de `overflow` y filtros del papel.
- Se cierra con clic fuera, `Escape` y pérdida de foco.
- `Escape` devuelve el foco al trigger.
- La superficie se propaga con `useSurface`.
- El popup portaleado también es contenido de página: o es un landmark por sí mismo o va dentro de uno. `Select` y `Combobox` marcan el nodo flotante como `region` nombrada por el campo; los pickers y el selector de temas usan `role="dialog"`.
- El tooltip conserva `role="tooltip"` en el nodo medido y el nodo portaleado vive dentro de una `region` nombrada por el trigger: así el aviso no queda fuera de todo landmark y el tooltip sigue conteniendo solo texto.
- El tooltip es hoverable (WCAG 1.4.13): recibe puntero mientras está abierto, un puente invisible cruza el hueco de 8 px hasta el ancla y un clic sobre el aviso no alcanza lo que hay detrás. `Escape` lo descarta sin mover el foco.
- `aria-controls` solo se emite mientras el popup está abierto (`open ? id : undefined`): `Popover` se desmonta al cerrar y no se renderizan popups ocultos.
- Un `<header>` dentro de un popup portaleado crearía un segundo `banner`; las cabeceras de overlays y pickers son `<div>`.

### 10.3 Select y Combobox

- Select: el foco queda en el trigger; el listbox se controla con `aria-activedescendant` y navegación por flechas, Home/End, Enter, Escape y escritura (typeahead).
- Combobox: input editable con filtro normalizado (sin acentos), flechas, Enter, Escape y limpieza.
- El anchor de posicionamiento del Combobox es el **control completo**, no solo el input, para que limpiar o pulsar el chevron no se interprete como un clic fuera.
- El foco inicial de menús portaleados se hace en un `requestAnimationFrame`, después de que el portal y las refs estén montados.

### 10.4 Calendario

- Calendario propio, sin `input type="date"`.
- Lunes como primer día; 6 semanas (42 celdas) para evitar saltos de altura.
- Fechas fuera de mes visibles y atenuadas.
- `min`, `max` e `isDateDisabled`; el día deshabilitado es enfocable pero no seleccionable.
- Roving tabindex: solo el día con foco tiene `tabIndex=0`.
- Teclado: flechas, Home/End, PageUp/PageDown, Shift+PageUp/PageDown, Enter, Escape.
- Se abre con foco en la fecha seleccionada o en hoy.

### 10.5 Rueda de hora

- Formato 24 h; minutos en pasos configurables.
- Dos listboxes con scroll-snap y una banda central de selección.
- El scroll actualiza el borrador; “Ahora”, “Limpiar” (opcional) y “Aplicar”.
- “Ahora” baja los minutos al paso anterior (`Math.floor`), de modo que nunca salta a la hora siguiente: a las 09:58 con paso de 5 da 09:55.
- `minuteStep` se normaliza una vez a un entero entre 1 y 60; `0`, los negativos y los valores no finitos caen a 5 para no bloquear la rueda ni repetir una sola opción.
- El foco inicial va a la rueda de horas después del montaje del portal.
- La rueda se maneja con flechas, PageUp/PageDown, Home/End, Enter y Escape.

### 10.6 FileUploader

- 100 % local: no hay subida a servidor.
- Acepta clic, drag & drop y teclado (Enter/Espacio).
- Valida `accept`, `maxSize` y `maxFiles` con mensajes explicativos.
- `accept` entiende el comodín total (`*/*` o `*`), comodines de tipo (`image/*`), tipos MIME y extensiones (`.pdf`), sin distinguir mayúsculas ni espacios.
- Miniaturas de imágenes mediante `URL.createObjectURL` con limpieza.
- La lista permite eliminar; el input de archivo permanece oculto y fuera del orden de tabulación, mientras el dropzone es el control accesible: se nombra con el `<label>` visible del `Field` (`getFieldLabelId`) más la instrucción de arrastrar, se describe con el hint y expone `aria-invalid` cuando hay error.

### 10.7 Slider y Stepper

- Slider y RangeSlider usan inputs nativos superpuestos; la estética se aplica al thumb y al track.
- El rango usa dos pulgares y mantiene el orden bajo/alto.
- `RangeSlider` agrupa los dos pulgares en un `role="group"` nombrado con el `<label>` del `Field`; cada pulgar conserva su `aria-label` (“Valor mínimo”/“Valor máximo”) y ambos reciben `aria-invalid` cuando hay error.
- `className` se comparte entre los dos inputs del rango; para el contenedor se usa `fieldClassName`.
- Las marcas en los extremos alinean la etiqueta hacia dentro para no salirse del control.
- Stepper usa un input numérico nativo con extremos deshabilitados al llegar a los límites.

### 10.8 Toast

- Contexto + portal, viewport abajo a la derecha.
- Apila hasta cuatro avisos; se pausan al pasar el cursor y mientras el foco de teclado está dentro, y se cierran solos. Al reanudar se concede de nuevo la duración completa, nunca el resto de un temporizador ya vencido.
- El viewport es una región `aria-live="polite"` con etiqueta.
- No se persisten; son estado de sesión.

---

## 11. Galería

La galería es la superficie de revisión del sistema; no se usa Storybook.

- Una sola página, diez secciones.
- Índice lateral sticky en escritorio; índice horizontal desplazable en móvil.
- Scroll-spy con `IntersectionObserver`.
- Selector de tema dialog con muestras, metadatos y navegación por teclado.
- Interruptor **Papel / Panel** global: todas las tarjetas y controles cambian de superficie.
- Las hojas de demo son `Card size="lg"` sin envoltorio propio: el badge con el nombre del componente entra por `kicker`, el título va en la cinta sobre papel y el folio en lacre. Así la galería enseña el contenedor real y no un clon.
- Cada demo incluye notas manuscritas con el estado actual para que el comportamiento sea visible sin abrir las devtools.
- La sección “En contexto” usa todos los patrones en una mini todo-list real.
- La sección “Contenedores” muestra `Card` en sus tres alturas con la lista de componentes de otras secciones.
- El primer elemento enfocable es “Saltar al contenido”, que apunta a `main#contenido` (`tabIndex={-1}`) y vive fuera del flujo con `position: fixed` para no mover la topbar.
- El selector de tema mantiene una palabra visible (“Tema”) cuando el nombre completo no cabe; el toggle de superficie conserva “Papel”/“Panel” como nombre explícito aunque sus etiquetas se oculten visualmente en móvil.

---

## 12. Responsive

- La página usa un gutter fluido (`clamp`) y un ancho máximo de 90 rem.
- Escritorio: índice sticky + contenido.
- ≤ 1180 px: se ocultan los enlaces de la topbar.
- ≤ 1024 px: el layout pasa a una columna; el índice se convierte en una fila horizontal.
- ≤ 980 px: las rejillas de tres columnas pasan a dos.
- ≤ 860 px: masthead en dos filas; estadísticas e intro se apilan.
- ≤ 720 px: las rejillas de demos pasan a una columna.
- ≤ 640 px: topbar compacta; las etiquetas del toggle de superficie se ocultan visualmente pero siguen en el árbol de accesibilidad; el selector de tema muestra “Tema” en lugar del nombre completo; el crest del masthead desaparece para dar ancho al título.
- La página no debe producir scroll horizontal en ningún ancho entre 320 y 1440 px. Se verificó en 320, 375, 480, 768, 1024 y 1440 px (y 640 px en la revisión anterior). No se usa `body { overflow-x: hidden }`: bajo 640 px las hojas apiladas se reescalan con `--paper-sheet-offset-*` y, si algo se sale, se corrige el elemento, no se oculta.

---

## 13. Accesibilidad

- Etiquetas asociadas; `aria-describedby` para pistas y errores.
- Roles y estados ARIA en listboxes, combobox, calendario, ruedas, diálogo de temas y progressbar.
- Foco visible con outline discontinuo de acento.
- Foco devuelto al trigger al cerrar con Escape.
- `aria-live` en toasts; `role="alert"` en errores.
- Todos los controles tienen un nombre accesible; los iconos decorativos son `aria-hidden`.
- Los toasts tienen botón de cierre con etiqueta.
- `prefers-reduced-motion` respetado.
- Auditoría axe-core WCAG 2 A/AA + buenas prácticas sobre el estado inicial: **0 violaciones**.
- El foco inicial de los popovers se retrasa un frame para que el portal esté montado antes de mover el foco y no se cierre por “focus fuera”.
- Los listboxes portaleados se nombran con el `<label>` del `Field` (`getFieldLabelId`), no con el trigger: un `combobox` no se nombra por contenido.
- `required` se expone con `aria-required` donde el rol lo admite (`Select`, `Combobox`); en los triggers de `DatePicker`/`TimePicker` y en los grupos se anuncia como descripción «Campo obligatorio», porque `aria-required` no es válido en `role="button"` ni en `role="group"`. Los pickers no participan en la validación nativa (input oculto): el consumidor valida en el submit.
- El skip link es el primer elemento enfocable y mueve el foco a `main#contenido`; el foco programático no depende de que el navegador mueva la secuencia.
- `ProgressBar` exige nombre por tipos: `label` visible o `aria-label`; el porcentaje es texto de valor y no puede ser el nombre.
- `TaskRow` replica prioridad y vencimiento en texto `visually-hidden`, enlazado con `aria-describedby`; el color deja de ser la única señal (WCAG 1.4.1).
- Los toasts se pausan con hover y con foco de teclado (WCAG 2.2.1); el viewport sigue siendo una única región `aria-live="polite"` para no duplicar anuncios.

---

## 14. Límites y compromisos conocidos

- **Sin backend**: FileUploader y Toast son locales; no hay red.
- **Sin router**: la galería es una sola página con anclas.
- **Sin Storybook**: la página de galería cumple ese rol y es el entregable de revisión.
- **Sin suite de tests automatizada**: la verificación actual es typecheck, build, auditoría axe y pruebas manuales de teclado/overlays/responsive.
- **Papel y rendimiento**: la silueta rasgada es geometría compartida y la sombra es una `box-shadow`. No se vuelve a un filtro de turbulencia por hoja ni a un `drop-shadow` sobre el subárbol: medido en la galería, eso multiplicaba por más de dos el coste de raster y hacía perder fotogramas al hacer scroll. El grano sí sigue siendo un SVG `feTurbulence`, pero se rasteriza una vez como imagen de fondo, no por elemento.
- **Breakpoints y arte**: los valores de media queries y la geometría de los SVG no están tokenizados porque CSS no permite variables en media queries y el arte es geometría, no diseño de sistema.
- **Temas**: no hay un “modo claro/oscuro” global separado; el tipo de papel es parte de cada tema.
- **Grenze Gotisch**: está disponible como familia, pero todavía no se usa en componentes.

---

## 15. Dónde vive cada decisión

| Decisión | Archivo |
| --- | --- |
| Tokens invariantes | `src/styles/tokens/primitives.css` |
| Paletas, semántica y superficies | `src/styles/tokens/themes.css` |
| Reset, lienzo, foco global, reduced motion | `src/styles/base.css` |
| Fuentes locales | `src/styles/fonts.css`, `public/fonts/` |
| Material papel/panel y contexto | `src/components/Surface/` |
| Propagación de superficie a portales | `src/components/Popover/`, `useSurface` |
| Tema, persistencia y selector | `src/theme/` |
| Botón de cera y estados | `src/components/Button/` |
| Campos y mensajes | `src/components/Field/`, `TextInput`, `Textarea` |
| Calendario y rueda | `src/components/DatePicker/`, `TimePicker/` |
| Galería y tarjetas de muestra | `src/gallery/` |
| Mockup de referencia | `design/mockup.html` |
