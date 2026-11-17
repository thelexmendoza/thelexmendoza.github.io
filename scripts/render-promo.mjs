import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIN_PROMO, LIMITES } from '../assets/js/cupos.js';
import { BRIEF_URL, promo, whatsappUrl } from './promo/promo.mjs';
import { promoJsonLd, seoTags } from './seo.mjs';
import { tagsHead } from './tags.mjs';

// Genera lexmendoza.com/promo/ (la landing de la promo de fin de año) con el mismo molde que las páginas legales y los casos:
// cabecera, script del tema y pie salen de index.html, así que cualquier cambio del menú o del pie se refleja al regenerarla.
// Uso: npm run promo

const PREFIX = '../';

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name) => `<span class="c-icon c-icon--${name}" aria-hidden="true"></span>`;

const rebase = (html) =>
  html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, url) => {
    if (/^(https?:|mailto:|tel:|data:|\/\/|#)/.test(url)) return match;
    if (url === './') return `${attr}="${PREFIX}"`;
    return `${attr}="${PREFIX}${url}"`;
  });

function extractLayout(layoutPath) {
  const home = fs.readFileSync(layoutPath, 'utf8');
  const take = (re, label) => {
    const found = home.match(re)?.[0];
    if (!found) throw new Error(`No encontré ${label} en ${layoutPath}`);
    return found;
  };
  return {
    themeScript: take(/<script>[\s\S]*?<\/script>/, 'el script del tema'),
    // Los enlaces del menú que apuntan a anclas de la home ("#casos") vuelven a la home: "../#casos".
    header: take(/<header class="c-nav">[\s\S]*?<\/header>/, 'la cabecera')
      .replace(/href="#([^"]*)"/g, `href="${PREFIX}#$1"`)
      .replace(/\bhref="(?!https?:|mailto:|tel:|#|\.\.\/)([^"]*)"/g, (m, url) => (url === './' ? `href="${PREFIX}"` : `href="${PREFIX}${url}"`))
      .replace(/ js-spy/g, ''),
    footer: rebase(take(/<footer class="c-footer"[\s\S]*?<\/footer>/, 'el pie')),
  };
}

// La imagen de cada caso sale de sus datos publicos: la primera pieza de su fondo (imagen o poster de video).
function casoImagen(slug) {
  const data = JSON.parse(fs.readFileSync(path.join('data', 'casos', `${slug}.json`), 'utf8'));
  const item = (data.card?.media ?? []).find((m) => m.src || m.poster);
  if (!item) throw new Error(`El caso ${slug} no tiene imagen de tarjeta`);
  return { src: item.src ?? item.poster, width: item.width, height: item.height };
}

// La maqueta del hero: el contorno de una landing que se arma bloque por bloque (x, y, ancho y alto en % de su caja de 4:3).
// Es decorativa: nada de esto se lee ni se enfoca. El bloque `acento` es el boton.
const MAQUETA = [
  [0, 0, 100, 9],
  [3, 2.2, 10, 4.6],
  [60, 3.6, 8, 1.8],
  [71, 3.6, 8, 1.8],
  [82, 3.6, 8, 1.8],
  [6, 16, 58, 6],
  [6, 25, 42, 6],
  [6, 36, 50, 2.2],
  [6, 40, 44, 2.2],
  [6, 47, 20, 6, 'acento'],
  [66, 14, 28, 36],
  [6, 62, 28, 26],
  [36, 62, 28, 26],
  [66, 62, 28, 26],
  [10, 66, 14, 8],
  [40, 66, 14, 8],
  [70, 66, 14, 8],
  [0, 93, 100, 7],
];
const renderMaqueta = () =>
  `<span class="c-promo__maqueta">${MAQUETA.map(([x, y, w, h, extra], i) => `<i${extra ? ` class="is-${extra}"` : ''} style="--i: ${i}; --x: ${x}; --y: ${y}; --w: ${w}; --h: ${h}"></i>`).join('')}</span>`;

// El plano aureo del fondo del body: los mismos rectangulos y la misma espiral del favicon (61.8 / 38.2 / 23.6 / 14.6), en una sola capa fija.
const AUREO = `<svg viewBox="0 0 161.8 100" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke">
          <rect x="0" y="0" width="100" height="100" vector-effect="non-scaling-stroke"/>
          <rect x="100" y="0" width="61.8" height="61.8" vector-effect="non-scaling-stroke"/>
          <rect x="123.6" y="61.8" width="38.2" height="38.2" vector-effect="non-scaling-stroke"/>
          <rect x="100" y="76.4" width="23.6" height="23.6" vector-effect="non-scaling-stroke"/>
          <path d="M0,100 A100,100 0 0 1 100,0 A61.8,61.8 0 0 1 161.8,61.8 A38.2,38.2 0 0 1 123.6,100 A23.6,23.6 0 0 1 100,76.4 A14.6,14.6 0 0 1 114.6,61.8 A9,9 0 0 1 123.6,70.8" vector-effect="non-scaling-stroke"/>
        </g>
      </svg>`;

// Numero gigante en contorno detras de una seccion (decorativo).
const fantasma = (texto, lado) => `<span class="c-promo__fantasma c-promo__fantasma--${lado}" aria-hidden="true">${esc(texto)}</span>`;

const renderPlan = (p, precios) => {
  const dias = `Entrega en ${p.dias} días hábiles`;
  return `<li class="c-promo__plan" data-plataforma="${esc(p.id)}" data-avisame="${esc(whatsappUrl(promo.cierre.avisameMensaje(p.nombre)))}">
            <h3 class="c-promo__plan-nombre">${esc(p.nombre)}</h3>
            <p class="c-promo__precio"><span class="c-promo__monto" style="min-inline-size: ${p.precio.length}ch">${esc(p.precio)}</span> <span class="c-promo__iva">IVA incluido</span></p>
            <p class="c-promo__dias">${dias}</p>
            <p class="c-promo__lugares" data-lugares role="status">${esc(promo.hero.resumenFijo)}</p>
            <span class="c-promo__medidor" aria-hidden="true">${Array.from({ length: LIMITES[p.id] }, (_, i) => `<i style="--i: ${i}"></i>`).join('')}</span>
            <p class="c-promo__resumen-plan">${esc(p.resumen)}</p>
            <ul class="c-promo__detalle">
              <li><strong>Para quién:</strong> ${esc(p.paraQuien)}</li>
              <li><strong>Se paga aparte:</strong> ${esc(p.aparte)}</li>
              <li><strong>Cambios:</strong> ${esc(p.edicion)}</li>
            </ul>
            <a class="c-button" href="${BRIEF_URL}" data-promo-cta>${icon('tag')}${esc(precios.boton)}</a>
          </li>`;
};

export function renderPromo(content, { layoutPath = 'index.html' } = {}) {
  const layout = extractLayout(layoutPath);
  const { hero, pasos, precios, alcance, casos, faq, cierre, cinta, fantasmas } = content;
  const lista = (items) => items.map((t) => `<li>${esc(t)}</li>`).join('\n              ');
  const wa = whatsappUrl(hero.whatsappMensaje);
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(content.title)} | Lex Mendoza</title>
    <meta name="description" content="${esc(content.description)}">
${seoTags({ path: `/${content.slug}/`, title: `${content.title} | Lex Mendoza`, description: content.description, image: '/assets/img/og/promo.jpg', imageAlt: 'Promo de fin de año de Lex Mendoza: tu página web desde $549' })}
${promoJsonLd('    ')}
    ${layout.themeScript}
${tagsHead()}
    <link rel="expect" href="#contenido" blocking="render">
    <link rel="preload" href="${PREFIX}assets/fonts/plex/ibm-plex-sans-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="${PREFIX}assets/fonts/plex/ibm-plex-sans-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="${PREFIX}assets/fonts/plex/ibm-plex-mono-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="${PREFIX}assets/fonts/plex/ibm-plex-mono-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="icon" href="${PREFIX}assets/icons/favicon.svg" type="image/svg+xml" sizes="any">
    <link rel="icon" href="${PREFIX}favicon.ico" sizes="48x48">
    <link rel="apple-touch-icon" href="${PREFIX}assets/icons/apple-touch-icon.png">
    <link rel="manifest" href="${PREFIX}site.webmanifest">
    <meta name="theme-color" content="#0a0a0a">
    <script type="speculationrules">
      {"prefetch":[{"where":{"and":[{"href_matches":"/*"},{"not":{"selector_matches":"[data-soon], [aria-disabled='true'], [target=_blank]"}}]},"eagerness":"moderate"}]}
    </script>
    <link rel="stylesheet" href="${PREFIX}assets/css/main.min.css">
    <link rel="modulepreload" href="${PREFIX}assets/js/theme.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/scrollspy.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/reveal.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/media.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/sky.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/hero-fx.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/reticle.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/ornaments.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/decode.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/leave.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/promo.js">
    <link rel="modulepreload" href="${PREFIX}assets/js/cupos.js">
    <script type="module" src="${PREFIX}assets/js/main.js"></script>
  </head>
  <body>
    <a class="u-visually-hidden u-visually-hidden--focusable" href="#contenido">Saltar al contenido</a>
    <div class="c-progress" aria-hidden="true"></div>

    ${layout.header}

    <main id="contenido" class="c-promo" data-promo data-fin="${esc(FIN_PROMO)}" data-terminada-wa="${esc(whatsappUrl(cierre.terminadaMensaje))}" data-terminada-boton="${esc(cierre.terminadaBoton)}" data-avisame-texto="${esc(cierre.avisame)}">
      <div class="c-promo__fondo" aria-hidden="true">
      ${AUREO}
      </div>

      <section class="c-hero c-promo__hero" id="inicio" aria-labelledby="promo-titulo">
        <div class="c-hero__backdrop" aria-hidden="true">
          <span class="c-hero__grid"></span>
          ${renderMaqueta()}
        </div>
        <div class="o-container o-stack c-hero__inner">
          <p class="c-eyebrow">// ${esc(hero.eyebrow)}</p>
          <h1 data-reveal="title" id="promo-titulo">${esc(hero.titulo)} <span class="c-chameleon-title">${esc(hero.palabra)}</span></h1>
          <p class="c-section__lead" data-reveal="text">${esc(hero.lead)}</p>
          <p class="c-promo__resumen" data-promo-resumen role="status"><span class="c-promo__vivo" aria-hidden="true"></span><span data-promo-resumen-texto>${esc(hero.resumenFijo)}</span></p>
          <p class="c-promo__terminada" data-promo-terminada>${esc(cierre.terminada)}</p>
          <p class="c-promo__acciones">
            <a class="c-button" href="${BRIEF_URL}" data-promo-cta data-promo-vigente>${icon('tag')}${esc(hero.boton)}</a>
            <a class="c-button c-button--ghost" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icon('message')}${esc(hero.whatsapp)}</a>
          </p>
          <p class="c-promo__nota" data-promo-vigente>${esc(hero.nota)}</p>
          <p class="c-promo__cierre" data-promo-vigente>${esc(hero.cierre)}</p>
        </div>
      </section>

      <div class="c-ticker" aria-hidden="true">
        <div class="c-ticker__track">
          <div class="c-ticker__group">${cinta.map((t) => `<span>${esc(t)}</span><span class="c-ticker__mark">//</span>`).join('')}</div>
          <div class="c-ticker__group">${cinta.map((t) => `<span>${esc(t)}</span><span class="c-ticker__mark">//</span>`).join('')}</div>
        </div>
      </div>

      <section class="c-section c-promo__seccion" id="como-funciona" aria-labelledby="pasos-titulo">
        ${fantasma(fantasmas.pasos, 'der')}
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="pasos-titulo">${esc(pasos.titulo)}</h2>
          <ol class="c-promo__pasos">
            ${pasos.items.map((s, i) => `<li class="c-promo__paso"><span class="c-promo__paso-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></li>`).join('\n            ')}
          </ol>
          <div class="c-promo__video" aria-hidden="true">
            <video class="c-promo__video-el" muted loop playsinline preload="none" poster="${PREFIX}assets/video/plan/brief-h-poster.webp" data-src="${PREFIX}assets/video/plan/brief-h.mp4" data-src-mobile="${PREFIX}assets/video/plan/brief-v.mp4" data-poster-mobile="${PREFIX}assets/video/plan/brief-v-poster.webp"></video>
          </div>
        </div>
      </section>

      <section class="c-section c-promo__seccion" id="precios" aria-labelledby="precios-titulo">
        ${fantasma(fantasmas.precios, 'izq')}
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="precios-titulo">${esc(precios.titulo)}</h2>
          <p class="c-section__lead" data-reveal="text">${esc(precios.lead)}</p>
          <ul class="c-promo__planes">
          ${precios.plataformas.map((p) => renderPlan(p, precios)).join('\n          ')}
          </ul>
          <p class="c-promo__extra"><strong>${esc(precios.extra.nombre)} (+${esc(precios.extra.precio)}):</strong> ${esc(precios.extra.texto)}</p>
        </div>
      </section>

      <section class="c-section" id="alcance" aria-labelledby="alcance-titulo">
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="alcance-titulo">${esc(alcance.incluye.titulo)} y qué no</h2>
          <div class="c-promo__alcance">
            <div>
              <h3>${esc(alcance.incluye.titulo)}</h3>
              <ul class="c-promo__lista c-promo__lista--si">
              ${lista(alcance.incluye.items)}
              </ul>
            </div>
            <div>
              <h3>${esc(alcance.noIncluye.titulo)}</h3>
              <ul class="c-promo__lista c-promo__lista--no">
              ${lista(alcance.noIncluye.items)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="c-section c-promo__seccion" id="casos" aria-labelledby="casos-titulo">
        ${fantasma(fantasmas.casos, 'der')}
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="casos-titulo">${esc(casos.titulo)}</h2>
          <p class="c-section__lead" data-reveal="text">${esc(casos.lead)}</p>
          <ul class="c-promo__casos">
          ${casos.items
            .map((c) => {
              const img = casoImagen(c.slug);
              return `<li class="c-promo__caso"><a href="${PREFIX}casos/${esc(c.slug)}/"><img src="${PREFIX}${esc(img.src)}" width="${img.width}" height="${img.height}" alt="" loading="lazy" decoding="async"><span class="c-promo__caso-etiqueta">${esc(c.etiqueta)}</span><span class="c-promo__caso-titulo">${esc(c.titulo)}</span><span class="c-promo__caso-texto">${esc(c.texto)}</span><span class="c-promo__caso-cta">${esc(casos.verCaso)}${icon('arrow-right')}</span></a></li>`;
            })
            .join('\n          ')}
          </ul>
        </div>
      </section>

      <section class="c-section c-promo__seccion" id="preguntas" aria-labelledby="preguntas-titulo">
        ${fantasma(fantasmas.preguntas, 'izq')}
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="preguntas-titulo">Preguntas frecuentes</h2>
          <div class="c-promo__faq">
          ${faq.map((f) => `<details class="c-promo__pregunta"><summary>${esc(f.pregunta)}</summary><p>${f.respuesta}</p></details>`).join('\n          ')}
          </div>
        </div>
      </section>

      <section class="c-section c-section--plan c-promo__seccion" id="aparta" aria-labelledby="aparta-titulo">
        ${fantasma(fantasmas.cierre, 'der')}
        <div class="o-container o-stack">
          <p class="c-eyebrow">// ${esc(hero.eyebrow)}</p>
          <h2 data-reveal="title" id="aparta-titulo">${esc(cierre.titulo)}</h2>
          <p class="c-section__lead" data-reveal="text" data-promo-vigente>${esc(cierre.lead)}</p>
          <p class="c-promo__terminada" data-promo-terminada>${esc(cierre.terminada)}</p>
          <p class="c-promo__acciones">
            <a class="c-button" href="${BRIEF_URL}" data-promo-cta data-promo-vigente>${icon('tag')}${esc(hero.boton)}</a>
            <a class="c-button c-button--ghost" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icon('message')}${esc(hero.whatsapp)}</a>
          </p>
        </div>
      </section>
    </main>

    ${layout.footer}
  </body>
</html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync('promo', { recursive: true });
  fs.writeFileSync(path.join('promo', 'index.html'), renderPromo(promo));
  console.log('promo/index.html');
}
