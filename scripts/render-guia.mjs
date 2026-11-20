import { BOOT_HTML } from './boot-html.mjs';
import { ctaBoletin } from './blog/blog.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLayout } from './render-promo.mjs';
import { guia, guiaWhatsapp } from './guia/guia.mjs';
import { seoTags } from './seo.mjs';

// Genera lexmendoza.com/guia-dominio-hosting/ con el mismo molde que la promo y las páginas legales: cabecera, tema y pie salen de index.html,
// y el fondo (retícula de cruces, brillo rojo, marcas de registro, cifras en contorno) es el de la promo. La guía no vende ni mide nada:
// lleva noindex, no carga el bloque de medición y su pie no trae el enlace de preferencias de cookies (no hay medición que reabrir).
// Uso: npm run guia

const PREFIX = '../';

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name) => `<span class="c-icon c-icon--${name}" aria-hidden="true"></span>`;

const FONDO = `<span class="c-promo__cruces"></span>
        <span class="c-promo__brillo"></span>
        <i class="c-promo__esquina c-promo__esquina--nw"></i>
        <i class="c-promo__esquina c-promo__esquina--ne"></i>
        <i class="c-promo__esquina c-promo__esquina--sw"></i>
        <i class="c-promo__esquina c-promo__esquina--se"></i>`;

const fantasma = (texto, lado) => `<span class="c-promo__fantasma c-promo__fantasma--${lado}" aria-hidden="true">${esc(texto)}</span>`;
const num = (i) => String(i + 1).padStart(2, '0');
const palabras = (html) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

// Minutos de lectura (230 palabras por minuto), redondeados hacia arriba.
export const minutosDeLectura = (content = guia) => Math.ceil(content.capitulos.reduce((a, c) => a + palabras(c.html) + palabras(c.encorto), 0) / 230);

// Los enlaces que salen del sitio se abren en otra pestaña (sin dar acceso a esta página) y lo avisan a los lectores de pantalla.
// Los de lexmendoza.com (incluido brief.lexmendoza.com) y los internos se quedan en la misma pestaña.
const EXTERNO = /<a ([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g;
export function externos(html) {
  return html.replace(EXTERNO, (todo, antes, url, despues, texto) => {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      return todo;
    }
    if (host === 'lexmendoza.com' || host.endsWith('.lexmendoza.com')) return todo;
    const limpio = `${antes} ${despues}`.replace(/\s*\b(rel|target)="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
    const aviso = texto.includes('u-visually-hidden') ? '' : '<span class="u-visually-hidden"> (se abre en otra pestaña)</span>';
    return `<a ${limpio ? `${limpio} ` : ''}href="${url}" target="_blank" rel="noopener noreferrer">${texto}${aviso}</a>`;
  });
}

// Anterior y siguiente al final de cada capítulo: el primero regresa al índice y el último lleva al cierre.
function pasar(capitulos, i) {
  const prev = i > 0 ? { href: `#${capitulos[i - 1].id}`, small: 'Capítulo anterior', texto: capitulos[i - 1].titulo } : { href: '#capitulos', small: 'Volver', texto: 'Índice de capítulos' };
  const next = i < capitulos.length - 1 ? { href: `#${capitulos[i + 1].id}`, small: 'Siguiente capítulo', texto: capitulos[i + 1].titulo } : { href: '#que-sigue', small: 'Para terminar', texto: 'Qué sigue' };
  return `<nav class="c-guia__pasar" aria-label="Anterior y siguiente del capítulo ${num(i)}">
            <a class="c-guia__pasar-link" href="${esc(prev.href)}" rel="prev">${icon('arrow-left')}<span><small>${esc(prev.small)}</small><strong>${esc(prev.texto)}</strong></span></a>
            <a class="c-guia__pasar-link c-guia__pasar-link--sig" href="${esc(next.href)}" rel="next"><span><small>${esc(next.small)}</small><strong>${esc(next.texto)}</strong></span>${icon('arrow-right')}</a>
          </nav>`;
}

// Animación del hero: lo que pasa cuando alguien escribe tu dirección (navegador → DNS → hosting). Es decorativa (aria-hidden) y de ejemplo:
// el dominio y las direcciones son ficticios (192.0.2.x está reservado para ejemplos). Con menos movimiento queda el cuadro final, ya armado.
const FLUJO = `<div class="c-guia__flujo" aria-hidden="true">
            <div class="c-guia__nodo">
              <span class="c-guia__nodo-etq">// navegador</span>
              <div class="c-guia__barra">${icon('lock')}<span class="c-guia__tecleo">tunegocio.com</span></div>
              <i class="c-guia__carga"></i>
              <div class="c-guia__pagina"><i></i><i></i><i></i></div>
            </div>
            <span class="c-guia__via"><i class="c-guia__paquete"></i></span>
            <div class="c-guia__nodo">
              <span class="c-guia__nodo-etq">// DNS · la libreta</span>
              <ul class="c-guia__libreta">
                <li><span>otrositio.mx</span><span>192.0.2.77</span></li>
                <li class="is-hit"><span>tunegocio.com</span><span>192.0.2.10</span></li>
                <li><span>mitienda.com</span><span>192.0.2.31</span></li>
              </ul>
            </div>
            <span class="c-guia__via c-guia__via--2"><i class="c-guia__paquete"></i></span>
            <div class="c-guia__nodo">
              <span class="c-guia__nodo-etq">// hosting · la casa</span>
              <div class="c-guia__rack"><i></i><i></i></div>
              <span class="c-guia__ok">${icon('lock')}HTTPS · listo</span>
            </div>
          </div>`;

export function renderGuia(content = guia, { layoutPath = 'index.html' } = {}) {
  const layout = extractLayout(layoutPath);
  // La guía no tiene medición: el enlace «Preferencias de cookies» del pie no tendría nada que reabrir.
  const footer = layout.footer.replace(/\s*·\s*<a href="#" data-tagorq-prefs>[\s\S]*?<\/a>/, '');
  const { hero, cinta, capitulos, cierre } = content;
  const wa = guiaWhatsapp(cierre.mensaje);
  const minutos = minutosDeLectura(content);
  return `<!doctype html>
<html lang="es-MX" data-page="guia">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(content.title)} | Lex Mendoza</title>
    <meta name="description" content="${esc(content.description)}">
    <meta name="robots" content="noindex">
${seoTags({ path: `/${content.slug}/`, title: `${content.title} | Lex Mendoza`, description: content.description })}
    ${layout.themeScript}
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
    <link rel="modulepreload" href="${PREFIX}assets/js/instrumento.js">
    <script type="module" src="${PREFIX}assets/js/main.js"></script>
  </head>
  <body>
${BOOT_HTML}    <a class="u-visually-hidden u-visually-hidden--focusable" href="#contenido">Saltar al contenido</a>
    <div class="c-progress" aria-hidden="true"></div>

    ${layout.header}
    <main id="contenido" class="c-promo c-guia">
      <div class="c-promo__fondo" aria-hidden="true">
        ${FONDO}
      </div>

      <section class="c-hero c-promo__hero" id="inicio" aria-labelledby="guia-titulo">
        <div class="c-hero__backdrop" aria-hidden="true">
          <span class="c-hero__grid"></span>
        </div>
        <div class="o-container o-stack c-hero__inner">
          <p class="c-eyebrow">// ${esc(hero.eyebrow)}</p>
          <h1 data-reveal="title" id="guia-titulo">${esc(hero.titulo)} <span class="c-chameleon-title">${esc(hero.palabra)}</span></h1>
          <p class="c-section__lead" data-reveal="text">${esc(hero.lead)}</p>
          <p class="c-guia__meta"><span>${icon('list')}Lectura de ${minutos} min</span><span>${icon('checklist')}Sin precios ni capturas de nadie</span><span>${icon('pen')}${esc(hero.actualizada)}</span></p>
          <p class="c-guia__nota c-guia__nota--ico">${icon('search')}<span>${hero.aviso}</span></p>
          <p class="c-promo__acciones">
            <a class="c-button" href="#capitulos">${icon('arrow-down')}Empezar a leer</a>
            <a class="c-button c-button--ghost" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icon('message')}Preguntarme algo</a>
          </p>
          ${FLUJO}
        </div>
      </section>

      <div class="c-ticker" aria-hidden="true">
        <div class="c-ticker__track">
          <div class="c-ticker__group">${cinta.map((t) => `<span>${esc(t)}</span><span class="c-ticker__mark">//</span>`).join('')}</div>
          <div class="c-ticker__group">${cinta.map((t) => `<span>${esc(t)}</span><span class="c-ticker__mark">//</span>`).join('')}</div>
        </div>
      </div>

      <nav class="c-guia__nav" aria-label="Capítulos de la guía">
        <ol class="c-guia__nav-lista" data-spy-follow>
          ${capitulos.map((c, i) => `<li><a class="c-guia__nav-link js-spy" href="#${esc(c.id)}"><span class="c-guia__nav-num" aria-hidden="true">${num(i)}</span><span>${esc(c.nav)}</span></a></li>`).join('\n          ')}
        </ol>
      </nav>

      <section class="c-section c-promo__seccion" id="capitulos" aria-labelledby="indice-titulo">
        ${fantasma('A–Z', 'izq')}
        <div class="o-container o-stack">
          <h2 data-reveal="title" id="indice-titulo">Lo que vas a aprender</h2>
          <p class="c-section__lead" data-reveal="text">Ocho capítulos cortos. Toca uno para ir directo; arriba te queda una barra que marca dónde vas y te deja moverte entre ellos.</p>
          <ol class="c-guia__indice">
            ${capitulos.map((c, i) => `<li><a href="#${esc(c.id)}"><span class="c-guia__indice-cab"><span class="c-guia__num">${num(i)}</span><span class="c-guia__icono">${icon(c.icono)}</span></span><strong>${esc(c.titulo)}</strong><span class="c-guia__corto">${esc(c.corto)}</span><span class="c-guia__ir" aria-hidden="true">Ir al capítulo ${icon('arrow-right')}</span></a></li>`).join('\n            ')}
          </ol>
        </div>
      </section>
${capitulos
  .map(
    (c, i) => `
      <section class="c-section c-promo__seccion c-guia__capitulo" id="${esc(c.id)}" aria-labelledby="${esc(c.id)}-titulo">
        ${fantasma(num(i), i % 2 === 0 ? 'der' : 'izq')}
        <div class="o-container o-stack">
          <p class="c-eyebrow">// Capítulo ${num(i)}</p>
          <div class="c-guia__titulo"><span class="c-guia__icono c-guia__icono--grande">${icon(c.icono)}</span><h2 data-reveal="title" id="${esc(c.id)}-titulo">${esc(c.titulo)}</h2></div>
          <p class="c-guia__encorto"><strong>En corto:</strong> ${esc(c.encorto)}</p>
          <div class="c-guia__cuerpo o-stack">
            ${externos(c.html)}
          </div>
          ${pasar(capitulos, i)}
        </div>
      </section>`
  )
  .join('\n')}

      <section class="c-section c-section--plan c-promo__seccion" id="que-sigue" aria-labelledby="sigue-titulo">
        ${fantasma('→', 'der')}
        <div class="o-container o-stack">
          <p class="c-eyebrow">// ${esc(cierre.eyebrow)}</p>
          <h2 data-reveal="title" id="sigue-titulo">${esc(cierre.titulo)}</h2>
          <p class="c-section__lead" data-reveal="text">${esc(cierre.lead)}</p>
          <p class="c-promo__acciones">
            <a class="c-button" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${icon('message')}${esc(cierre.boton)}</a>
            <a class="c-button c-button--ghost" href="#inicio">${icon('arrow-up')}Volver arriba</a>
          </p>
          ${ctaBoletin('guia-dominio-hosting', 'guia')}
        </div>
      </section>

      <a class="c-to-top js-guia-top" href="#capitulos" aria-label="Volver al índice de capítulos" title="Volver al índice"></a>
    </main>

    ${footer}
  </body>
</html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync('guia-dominio-hosting', { recursive: true });
  fs.writeFileSync(path.join('guia-dominio-hosting', 'index.html'), renderGuia(guia));
  console.log('guia-dominio-hosting/index.html');
}
