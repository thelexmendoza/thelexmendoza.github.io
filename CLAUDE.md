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
