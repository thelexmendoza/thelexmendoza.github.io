import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { privacidad } from './legal/privacidad.mjs';
import { cookies } from './legal/cookies.mjs';
import { seoTags } from './seo.mjs';
import { tagsHead } from './tags.mjs';

// Genera las páginas legales (aviso de privacidad y política de cookies) con el mismo molde que los casos:
// cabecera y script del tema salen de index.html, así que cualquier cambio del menú se refleja al regenerarlas.
// Uso: npm run legal

const PREFIX_DEFAULT = '../';

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rebase = (html, PREFIX) =>
  html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, url) => {
    if (/^(https?:|mailto:|tel:|data:|\/\/|#)/.test(url)) return match;
    if (url === './') return `${attr}="${PREFIX}"`;
    return `${attr}="${PREFIX}${url}"`;
  });

function extractLayout(layoutPath, PREFIX) {
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
  };
}

function footer(current, PREFIX) {
  const link = (slug, label) => `<a href="${PREFIX}${slug}/"${current === slug ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<footer class="c-footer">
      <div class="o-container o-stack">
        <p class="c-footer__actions"><a class="c-button c-button--ghost" href="${PREFIX}">Volver al inicio</a></p>
        <p class="c-footer__legal">© 2026 Lex Mendoza · ${link('privacidad', 'Aviso de privacidad')} · ${link('cookies', 'Política de cookies')} · <a href="#" data-tagorq-prefs>Preferencias de cookies</a></p>
      </div>
    </footer>`;
}

export function renderLegal(page, { layoutPath = 'index.html', prefix = PREFIX_DEFAULT } = {}) {
  const PREFIX = prefix;
  const layout = extractLayout(layoutPath, PREFIX);
  const title = esc(page.title).replace(esc(page.word), `<span class="c-chameleon-title">${esc(page.word)}</span>`);
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(page.title)} | Lex Mendoza</title>
    <meta name="description" content="${esc(page.description)}">
${seoTags({ path: page.path ?? `/${page.slug}/`, title: `${page.title} | Lex Mendoza`, description: page.description })}${page.jsonLd ? `
${page.jsonLd}` : ''}
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

    <main id="contenido">
      <article class="c-legal o-container">
        <header class="c-legal__header o-stack">
          <p class="c-eyebrow">// ${esc(page.eyebrow)}</p>
          <h1 data-reveal="title">${title}</h1>
          <p class="c-section__lead">${esc(page.lead)}</p>
          <p class="c-legal__meta">${page.metaHtml ?? `Última actualización: ${esc(page.updated)}`}</p>
        </header>
        <div class="c-legal__body">${page.body}</div>${page.after ? `
        ${page.after}` : ''}
      </article>
    </main>

    ${footer(page.slug, PREFIX)}
  </body>
</html>
`;
}

export const PAGES = [privacidad, cookies];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const page of PAGES) {
    const dir = path.join(page.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderLegal(page));
    console.log(`${page.slug}/index.html`);
  }
}
