# Convenciones del proyecto

Sitio personal y de portafolio de Lex Mendoza, publicado en GitHub Pages desde `main`. Especificación: `docs/superpowers/specs/2026-11-01-sitio-personal-design.md`. Textos: `docs/brand/pitch.md`.

## Reglas

- **Sin frameworks** de CSS ni de JS. Sass para el CSS y JavaScript plano.
- **Idioma:** español, en tuteo y en primera persona.
- **Compilar antes de hacer commit:** `npm run build` genera `assets/css/main.min.css`, que es lo único que carga el sitio. Después, `npm test`.
- **Node 26 LTS o superior** (Sass moderno requiere Node 20.19 o más).

## CSS

- **ITCSS** por capas en `src/scss/`: `0-settings`, `1-tools`, `2-generic`, `3-elements`, `4-objects`, `5-components`, `6-utilities`.
- **BEMIT:** `c-` componente, `o-` objeto, `u-` utilidad, `is-` y `has-` estado, `js-` gancho de JavaScript. Ejemplo: `c-case-card__title--featured`.
- **Escala Fibonacci en `rem`:** espaciado 8, 13, 21, 34, 55, 89 y 144 px (÷ 16). Tipografía con razón áurea sobre 16 px: 10, 16, 26, 42, 68 y 110.
- **Tokens como variables CSS**, porque el tema (`data-theme`) y el caso (`data-case`) cambian en el navegador.
- **Un acento rojo y un degradado animado por vista.** Todo movimiento respeta `prefers-reduced-motion`.
- Mobile first, con los puntos de quiebre nombrados por dispositivo.

## Qué nunca va al repositorio

- `private/`: notas, precios, originales pesados y fuentes propietarias.
- Precios, claves de API y secretos. Las claves viven como *secrets* de Supabase.
- Fuentes con licencia propietaria (BMW Group, Avenir, Eloquia, Bahnschrift): se usan como título exportado en SVG con contornos.

## Fuentes

IBM Plex completa, alojada en el sitio (`npm run fonts` copia los `woff2` latinos desde `@fontsource`). Antes de publicar cualquier otra fuente se verifica su licencia.

## Movimiento

- **El contenido siempre existe en el HTML.** Los elementos con `data-reveal` ("card" o "title") solo se ocultan si el modulo de JavaScript cargo (`.has-js`), la persona acepta movimiento y no se activo `.reveal-all`. El script de la cabecera pone `.reveal-all` a los 2.5 s si `main.js` nunca avisa (`window.__revealReady`).
- **Todo movimiento va dentro de `@media (prefers-reduced-motion: no-preference)`.** Con la preferencia de menos movimiento todo aparece de inmediato y no se anima nada.
- **Parallax y barra de progreso** usan animaciones ligadas al scroll (`animation-timeline: scroll()`) dentro de `@supports`; sin soporte quedan quietos.
- **Scroll-spy:** los enlaces con `js-spy` reciben `is-active` y `aria-current`. La logica pura vive en `assets/js/scrollspy.js` y se prueba con `npm test`.
- Una palabra camaleonica con degradado animado por pantalla; el resto del movimiento es discreto.

## El leon

- **El leon es solo un icono pequeno y pixelado, pensado para el favicon.** Nunca se usa grande ni como imagen, marca de agua o fondo dentro de la pagina; a ese tamano se ve extrano.
- Se dibuja en una sola cuadricula de 20x20 en `scripts/build-icons.mjs` y `npm run icons` genera todos los archivos de `assets/icons/`. Una prueba impide que aparezca como imagen en el HTML o en el CSS.

## Casos

- **El relato va primero.** Cada capítulo es título, texto y luego sus galerías. Los botones de vista (`Todo / Diseños / Fotos / Iconos`) solo ocultan imágenes, nunca el texto, y solo existen para los tipos que el caso tiene. **No se muestran cantidades de piezas.**
- **Un plan por caso en `private/content/<caso>/caso.plan.json`** (trae las rutas de origen, por eso es privado). `npm run case -- private/content/<caso>/caso.plan.json` optimiza las imágenes a `assets/img/casos/<caso>/`, escribe los datos públicos en `data/casos/<caso>.json` (sin rutas del disco) y genera `casos/<caso>/index.html`. `--sin-imagenes` solo regenera la página.
- **Galerías:** carrusel por tema con `scroll-snap` (3, 2 y 1 columna según el espacio del propio carrusel), hoja de iconos, cuadrícula de publicaciones y lightbox con `<dialog>`. Las piezas creadas con IA llevan la etiqueta "Creada con IA".
- **Fotos de personas** solo con permiso. Las imágenes ilegibles se reportan y no detienen el proceso.
- **Revelado de párrafos:** todo párrafo de lectura lleva `data-reveal="text"` (esqueleto de líneas con brillo y luego el texto); los títulos conservan su propio revelado.
- **Formato de vista:** junto a los botones de tipo hay `Carrusel / Cuadrícula` (barra `c-bar`, pegajosa y solo con JavaScript). Sin elegir nada, cada galería usa el suyo (las publicaciones, cuadrícula tipo Instagram; el resto, carrusel). En cuadrícula se ven nueve piezas y hay `Mostrar más` / `Mostrar menos`; las demás se pliegan con `is-folded`.
- **Logotipos** (`kind: "logos"`): casillas con margen interno; `build-case` mide el tono del dibujo transparente (`data-tone`) para darle un fondo donde se vea. Los iconos se encuentran solos con `scripts/find-icons.mjs`, nadie los marca a mano.
- **Tarjeta del home con imágenes** (`data-media`; plantilla para todas las tarjetas de caso): al pasar el cursor o enfocarla, la barra sube y se recorta junto con su línea, el título y la descripción suben a la par (con un colchón arriba para quedar centrados, alineados a la izquierda), de fondo se alternan cinco imágenes del caso bajo un velo y aparece el cuadro de color de marca alrededor de "Ver caso". **Todo sale de un solo número animado, `--peek` (0 a 1, `@property`)**: altura de la barra, color, opacidad y márgenes, así que nada se desfasa y salir es la misma animación en reversa (0.35 s). La barra mide lo mismo que la original (37.8 px, 66.6 px con dos líneas) para no mover el reposo. En pantallas táctiles `main.js` pone `is-peek` cuando la tarjeta queda en el centro, tras 600 ms. Cada tarjeta nueva lleva sus propias 5 imágenes sin texto y su propio ajuste del colchón, pero conserva esta estructura.
- **Nombres de las piezas (regla para todo lo que se suba):** nunca se muestra un nombre genérico de archivo ("Mesa de trabajo 1 copia", "IMG_4821", un hash). `scripts/describe.mjs` quita copias, versiones, fechas y sesiones de producción; si no queda nada que describa la pieza, el texto alternativo es solo el del grupo y `npm run case` avisa con "nombre genérico, falta un pie". Esas piezas se describen a mano mirando la imagen, con un pie en el plan (`captions`), según lo que se ve.
- **Cambios de vista y modal:** cambiar de tipo o de formato se anima con View Transitions (fundido de 0.3 s del contenido, el nombre de transición solo existe mientras dura); el modal se desvanece al abrir y al cerrar (0.2 s). Todo dentro de `prefers-reduced-motion: no-preference`.
- **Plantilla de todos los casos: la estructura de Valtre.** Cada caso nuevo (CiiSA | PSW, BMW / MINI, Daniel Ábrego, Etic's Live, Motociclismo) se arma igual: hero con título, meta, resumen y un gancho al capítulo final; capítulos de relato (título, texto y luego sus galerías); barra de vistas (tipo + Carrusel/Cuadrícula) pegajosa; grupos `logos`, `iconos`, `publicaciones` y `disenos`; lightbox; botón flotante de volver al hero; cierre "Arma tu plan"; y la tarjeta del home con su hover de `--peek`. Todo sale de un plan en `private/content/<caso>/caso.plan.json` + `npm run case`; no se escribe HTML a mano. Lo propio de cada caso es el contenido: capítulos, textos, grupos, paleta (`data-case`) y las 5 imágenes de su tarjeta.
- **Cambio de tema claro/oscuro:** fundido de 0.5 s de toda la pantalla (View Transitions, con `is-theming`; sin soporte, transiciones CSS de color con `is-theming-css`). Con "reducir movimiento" es inmediato.
- **Tarjeta ↔ hero (transición compartida):** el hero del caso lleva el mismo fondo que su tarjeta del home (las 5 imágenes en ciclo y el velo; el plan las nombra por id en `card.images` y `build-case` las guarda en `data.card`). Tarjeta y hero comparten `view-transition-name: case-hero`, así que al abrir el caso la tarjeta se estira hasta ser el hero y al volver el hero se encoge hasta ser la tarjeta (0.55 s). Cada caso nuevo debe declarar sus 5 imágenes en `card.images` y repetirlas en la tarjeta de `index.html`; una prueba verifica que coincidan.
- **Transiciones: estructura de todas las páginas (Valtre es la referencia).**
  - Entre páginas: `@view-transition { navigation: auto }` anima la captura de la pantalla (`root`) con un fundido corto; el menú (`.c-nav`) tiene nombre propio y se queda quieto. **Nunca se nombra `<main>`** (en un caso mide miles de px y no se captura de forma fiable). Cada página declara en su `<head>` `<link rel="expect" href="#contenido" blocking="render">` y precarga las 4 fuentes de arriba del pliegue.
  - Tarjeta ↔ hero: comparten `view-transition-name: case-hero` (el fondo de imágenes) y el título comparte `case-title` (`.c-case-card__word` ↔ `.c-chameleon-title` del hero, ambos `inline-block` para medir solo el texto). Al ir y al volver se estiran y se encogen.
  - Para que haya algo a lo que morfar, el script de la cabecera escucha `pagereveal` y, si llega con transición, pone `is-revealed` a la tarjeta del caso y al contenido del hero (el revelado normal se salta solo en ese caso).
  - Tema claro/oscuro: fundido de 0.5 s de toda la pantalla (`is-theming`); cambios de vista dentro de una página, fundido de 0.3 s del contenido con el scroll anclado.
  - Todo va dentro de `prefers-reduced-motion: no-preference`; sin soporte del navegador o con menos movimiento, la navegación es la de siempre.
  - Para un caso nuevo: nombrar su tarjeta y su hero con las mismas clases/atributos (`data-media`) y su título con los mismos nombres; las pruebas de `tests/page-transition.test.mjs` y `tests/card-media.test.mjs` fijan el contrato.
