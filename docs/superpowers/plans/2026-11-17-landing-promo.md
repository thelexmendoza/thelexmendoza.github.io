# Landing de la promo de fin de año: plan de implementación

> Para quien ejecute: usar superpowers:executing-plans. Los pasos usan casillas.

**Meta:** construir `lexmendoza.com/promo/` según el diseño aprobado.

**Arquitectura:** página generada (`scripts/render-promo.mjs` con el contenido en `scripts/promo/promo.mjs`, como las legales), estilos `c-promo-*` en Sass y un módulo `promo.js` que pinta los lugares en vivo con lógica pura en `cupos.js`.

**Tecnología:** HTML, Sass y JavaScript plano; Node 26, `node --test`, Playwright (Edge) solo para verificar.

**Diseño:** `docs/superpowers/specs/2026-11-17-landing-promo-design.md`

## Restricciones globales

- Sin frameworks; español, tuteo y primera persona; ITCSS + BEMIT; escala Fibonacci en `rem`; un acento rojo; todo movimiento dentro de `prefers-reduced-motion: no-preference`.
- Precios con IVA incluido (código $549 · 5 días · 10 lugares; Wix $1,290 · 7 · 5; Squarespace $1,990 · 10 · 3; WordPress $2,190 · 8 · 3; asistencia $390). Promo «hasta el 31 de diciembre de 2026 o hasta agotar lugares».
- Sin «olas», sin urgencia falsa, sin precios tachados, sin promesas de resultados.
- Un módulo nuevo que importe `main.js` se suma a los `modulepreload` de `index.html`, `render-case.mjs`, `render-legal.mjs` y la página nueva.
- Compilar (`npm run build`), regenerar (`npm run promo`, `npm run seo`, `npm run legal`, casos con `--sin-imagenes`) y `npm test` antes de cada commit.

## Revisión (lo que el diseño implica y ninguna prueba cubre aún)

1. La consulta de lugares falla, tarda o responde basura → texto fijo «lugares limitados cada semana», sin error visible (prueba en la tarea 1 y en la 3).
2. Un lugar en 0 → botón «Avísame el lunes» (WhatsApp), no el del brief (tarea 1).
3. Pasada la fecha de cierre → estado «La promo terminó» con WhatsApp (tarea 1).
4. Sin JavaScript → toda la información y los botones siguen ahí (tarea 2).
5. Lugares con valores raros (negativos, no numéricos, `null`) → se tratan como desconocidos (tarea 1).

---

### Tarea 1: lógica de lugares y vigencia (`assets/js/cupos.js`)

**Archivos:** crear `assets/js/cupos.js`, `tests/cupos.test.mjs`.

**Interfaces — produce:**
- `export const FIN_PROMO = '2026-12-31T23:59:59-06:00'` y `export const LIMITES = { medida: 10, wix: 5, squarespace: 3, wordpress: 3 }`.
- `estadoCupo(libres: unknown): { estado: 'disponible'|'ultimo'|'agotado'|'desconocido', texto: string, libres: number|null }` — `libres` entero ≥ 0; si no lo es, `desconocido` con texto «Lugares limitados cada semana». 1 → «Último lugar»; 0 → «Agotado esta semana»; N ≥ 2 → «Quedan N lugares».
- `resumenLugares(cupos: unknown): { texto: string, total: number|null }` — suma los de las cuatro plataformas sobre 21: «Esta semana quedan N de 21 lugares. Se reinician el lunes»; si falta alguno o no es válido, texto fijo «Lugares limitados cada semana».
- `promoVigente(ahora: Date): boolean` — verdadero hasta `FIN_PROMO`.

- [ ] Escribir `tests/cupos.test.mjs`: `estadoCupo(5)` → «Quedan 5 lugares»; `1` → «Último lugar»; `0` → agotado; `-1`, `'x'`, `null`, `undefined`, `2.5` → desconocido; `resumenLugares({ medida: 7, wix: 5, squarespace: 3, wordpress: 3 }).total === 18` y texto «quedan 18 de 21»; faltando una clave → texto fijo; `promoVigente(new Date('2026-12-31T20:00:00-06:00'))` verdadero y `new Date('2027-01-01T00:00:00-06:00')` falso.
- [ ] Correr `node --test tests/cupos.test.mjs` y ver que falla (módulo inexistente).
- [ ] Implementar `assets/js/cupos.js` con las firmas de arriba (funciones puras, sin DOM).
- [ ] Correr la prueba y ver que pasa. Commit `feat: logica de lugares y vigencia de la promo`.

### Tarea 2: contenido y página generada (`/promo/`)

**Archivos:** crear `scripts/promo/promo.mjs`, `scripts/render-promo.mjs`, `tests/promo.test.mjs`; modificar `package.json` (script `promo`).

**Interfaces — consume:** `FIN_PROMO`, `LIMITES` de la tarea 1 (solo para marcar el `data-` de cada tarjeta); la cabecera y el script del tema de `index.html` (como `render-legal.mjs`).
**Produce:** `export const promo` (objeto con hero, pasos, `plataformas` con `id/nombre/precio/dias/lugares/paraQuien/aparte`, `extra`, `incluye`, `noIncluye`, `casos`, `faq`, `cierre`); `export function renderPromo(contenido, { layoutPath }): string`; `promo/index.html` generado por `npm run promo`.

- [ ] Escribir `tests/promo.test.mjs`: la página generada coincide con la del repo (como la de las legales); contiene las cuatro tarjetas con sus precios exactos y `data-plataforma="medida|wix|squarespace|wordpress"`; el botón principal es `href="https://brief.lexmendoza.com/"` y el de WhatsApp lleva `wa.me/528129043592`; no contiene «ola» como palabra, ni «garantizo», ni precios tachados (`<del>`, `<s>`); un solo `h1`; cada `<details>` de las preguntas existe; sin JavaScript todo el contenido está en el HTML (no hay texto que solo salga de `promo.js`); los tres casos enlazan a `../casos/<slug>/`.
- [ ] Correr y ver que falla.
- [ ] Implementar `scripts/promo/promo.mjs` (textos del diseño; para cada plataforma, copiar de `PLATAFORMAS` del brief el resumen, lo que se paga aparte y la edición) y `scripts/render-promo.mjs` (mismo molde que `render-legal.mjs`: cabecera, tema, `modulepreload`, pie). Agregar `"promo": "node scripts/render-promo.mjs"` y correrlo.
- [ ] Correr las pruebas y ver que pasan. Commit `feat: pagina /promo/ generada`.

### Tarea 3: estilos y lugares en vivo

**Archivos:** crear `src/scss/5-components/_c-promo.scss`, `assets/js/promo.js`, `tests/promo-ui.test.mjs`; modificar `src/scss/main.scss`, `assets/js/main.js`, `scripts/render-promo.mjs`, `index.html`, `scripts/render-case.mjs`, `scripts/render-legal.mjs` (preloads).

**Interfaces — consume:** `estadoCupo`, `resumenLugares`, `promoVigente` (tarea 1); `GET https://jmnnodzdopnbvbkcxpvy.supabase.co/functions/v1/pedido?cupos=1` → `{ ok, cupos: { medida, wix, squarespace, wordpress }, reinicia }`.
**Produce:** `export function setupPromo(): void` en `assets/js/promo.js` (solo actúa si la página tiene `.c-promo`).

- [ ] Escribir `tests/promo-ui.test.mjs`: `promo.js` no declara `autoplay`, usa un tiempo límite de 4000 ms y `AbortController`; `main.js` importa y llama `setupPromo`; los `modulepreload` de `promo.js` y `cupos.js` están en `index.html`, `render-case.mjs`, `render-legal.mjs` y `promo/index.html`; el SCSS no anima fuera de `prefers-reduced-motion: no-preference`; cada tarjeta agotada cambia su botón a WhatsApp «Avísame el lunes» (se prueba la función que arma el enlace, con `?text=` codificado).
- [ ] Correr y ver que falla.
- [ ] Implementar `_c-promo.scss` (hero, letrero de lugares, tarjetas de precio con estados `is-ultimo` e `is-agotado`, pasos con el video de `assets/video/plan/`, casos, preguntas con `<details>`, cierre; mobile first) y `assets/js/promo.js` (consulta con 4 s, pinta con las funciones de la tarea 1; en error deja el texto fijo; con la fecha pasada muestra «La promo de fin de año terminó» y cambia los botones al de WhatsApp). Sumar los `modulepreload` y el import en `main.js`.
- [ ] `npm run build`, `npm run promo`, regenerar casos y legales, correr todo y ver que pasa. Commit `feat: estilos y lugares en vivo de la promo`.

### Tarea 4: SEO, privacidad y documentación

**Archivos:** modificar `scripts/seo.mjs`, `scripts/build-seo.mjs` (sitemap con `/promo/`), `private/content/lex/build-og.mjs` (imagen `assets/img/og/promo.jpg`, sin versionar el script), `scripts/legal/privacidad.mjs` (una línea: al ver los lugares el navegador se conecta a Supabase), `CLAUDE.md` (excepción de precios de la promo; sección de la landing), `tests/seo.test.mjs`, `tests/legal.test.mjs`.

**Interfaces — produce:** `promoJsonLd(): string` en `seo.mjs` — `OfferCatalog` con cuatro `Offer` (`priceCurrency: 'MXN'`, `price`, `priceValidUntil: '2026-12-31'`, `availability: 'https://schema.org/LimitedAvailability'`), escapado con `safeJson`.

- [ ] Escribir las pruebas: `/promo/` está en `sitemap.xml`; `promo/index.html` tiene canónica `https://lexmendoza.com/promo/`, `og:image` existente de 1200×630 y el JSON-LD con los cuatro precios exactos; el aviso de privacidad menciona Supabase por la consulta de lugares; las páginas legales siguen al día.
- [ ] Correr y ver que fallan; implementar; `npm run seo`, `npm run legal`, generar la imagen; correr y ver que pasan.
- [ ] Actualizar `CLAUDE.md`. Commit `feat: SEO, privacidad y documentacion de la promo`.

### Tarea 5: verificación y publicación

- [ ] Con un servidor local y Edge real: la página carga sin errores en escritorio, tableta y móvil (390 px) sin desborde; los cuatro estados de lugar (`7`, `1`, `0`, consulta caída) se ven bien; con `reducedMotion: 'reduce'` no hay animaciones; el video del brief solo corre con movimiento.
- [ ] `npm test` en verde y `git status` limpio de archivos de `private/`.
- [ ] Commit, `git -c http.sslBackend=schannel pull --rebase origin main` y `push` (con la autorización de Lex ya dada para esta tarea).

## Autorrevisión

- Cobertura: hero, pasos, precios, incluye/no incluye, casos, preguntas, cierre, lugares en vivo, fin de promo, integración, SEO y privacidad tienen tarea. Los pendientes aparte del diseño (origen en Supabase, cierre en servidor, precios duplicados) no son de este plan y se avisan al final.
- Consistencia de nombres: `estadoCupo`, `resumenLugares`, `promoVigente`, `FIN_PROMO`, `LIMITES` y `setupPromo` se usan igual en todas las tareas.
- Proporción: el plan es más corto que el diseño; los cuerpos de las funciones se dejan a quien implementa.
