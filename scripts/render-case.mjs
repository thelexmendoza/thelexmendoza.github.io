import fs from 'node:fs';

// Genera la pagina de un caso a partir de sus datos. Es una funcion pura de texto: no toca imagenes.
// El relato va primero: cada capitulo es titulo, texto y luego sus galerias. Los botones de vista
// solo afectan a las imagenes, nunca al texto.

const PREFIX = '../../';
const LENS_LABELS = { disenos: 'Diseños', fotos: 'Fotos', iconos: 'Iconos' };
const LENS_ORDER = ['disenos', 'fotos', 'iconos'];

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lensOf = (kind) => (kind === 'publicaciones' || kind === 'logos' ? 'disenos' : kind);
const FORMATS = [['carousel', 'Carrusel'], ['grid', 'Cuadrícula']];

// Las rutas de los datos son desde la raiz del sitio; la pagina vive dos carpetas mas adentro.
const rebase = (html) =>
  html.replace(/\b(href|src)="([^"]*)"/g, (match, attr, url) => {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(url)) return match;
    if (url === './') return `${attr}="${PREFIX}"`;
    return `${attr}="${PREFIX}${url}"`;
  });

function extractLayout(layoutPath) {
  const home = fs.readFileSync(layoutPath, 'utf8');
  const take = (re, label) => {
    const found = home.match(re)?.[0];
    if (!found) throw new Error(`No encontre ${label} en ${layoutPath}`);
    return found;
  };
  return {
    themeScript: take(/<script>[\s\S]*?<\/script>/, 'el script del tema'),
    header: rebase(take(/<header class="c-nav">[\s\S]*?<\/header>/, 'la cabecera')).replace(/ js-spy/g, ''),
    footer: rebase(take(/<footer class="c-footer"[\s\S]*?<\/footer>/, 'el pie')),
  };
}

const img = (item, extra = '') =>
  `<img src="${esc(PREFIX + item.src)}" width="${item.width}" height="${item.height}" alt="${esc(item.alt)}" loading="lazy" decoding="async"${extra}>`;

const text = (value, cls) => `<p class="${cls}" data-reveal="text">${esc(value)}</p>`;

function head(group) {
  return `<h3 class="c-gallery__topic">${esc(group.topic)}</h3>${group.ai ? '<span class="c-gallery__badge">Creada con IA</span>' : ''}${
    group.note ? `\n    ${text(group.note, 'c-gallery__note')}` : ''
  }`;
}

const opener = (item, group, cls) =>
  `<button class="${cls} js-open" type="button" data-full="${esc(PREFIX + item.full)}" data-caption="${esc(item.caption ?? item.alt)}">${img(item)}</button>`;

function renderGroup(group) {
  const kind = lensOf(group.kind);
  if (group.kind === 'iconos') {
    const items = group.items.map((item) => `<li class="c-icons__item" title="${esc(item.alt)}">${img(item)}</li>`).join('\n      ');
    return `<div class="c-icons" data-kind="iconos">
    ${head(group)}
    <ul class="c-icons__grid">
      ${items}
    </ul>
  </div>`;
  }
  const logos = group.kind === 'logos';
  const format = group.kind === 'publicaciones' ? 'grid' : 'carousel';
  const slides = group.items
    .map((item) => {
      const cls = logos ? 'c-gallery__slide c-gallery__slide--logo' : 'c-gallery__slide';
      const tone = logos && item.tone ? ` data-tone="${esc(item.tone)}"` : '';
      return `<figure class="${cls}"${tone} data-reveal="card">${opener(item, group, 'c-gallery__open')}${
        item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''
      }</figure>`;
    })
    .join('\n      ');
  return `<div class="c-gallery${logos ? ' c-gallery--logos' : ''}" data-kind="${kind}" data-format="${format}" data-gallery>
    ${head(group)}
    <div class="c-gallery__track" tabindex="0" role="group" aria-label="${esc(group.topic)}">
      ${slides}
    </div>
  </div>`;
}

function renderChapter(chapter) {
  const paragraphs = chapter.text.map((p) => text(p, 'c-chapter__text')).join('\n    ');
  const groups = chapter.groups.map(renderGroup).join('\n  ');
  return `<section class="c-chapter" id="${esc(chapter.id)}" aria-labelledby="${esc(chapter.id)}-titulo">
  <div class="o-container o-stack">
    <p class="c-eyebrow">// ${esc(chapter.eyebrow)}</p>
    <h2 id="${esc(chapter.id)}-titulo" data-reveal="title">${esc(chapter.title)}</h2>
    ${paragraphs}
    ${groups}
  </div>
</section>`;
}

// Fondo del hero: las mismas imagenes que la tarjeta del home, para que la tarjeta se transforme en el hero.
function renderHeroMedia(card) {
  if (!card?.images?.length) return '';
  const imgs = card.images
    .map((item, i) => `<img src="${esc(PREFIX + item.full)}" alt="" width="${item.width}" height="${item.height}" decoding="async"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>`)
    .join('\n            ');
  return `<span class="c-case-hero__media" aria-hidden="true">
            ${imgs}
          </span>
          <span class="c-case-hero__veil" aria-hidden="true"></span>
          `;
}

function renderBar(chapters) {
  const groups = chapters.flatMap((chapter) => chapter.groups);
  const kinds = new Set(groups.map((group) => lensOf(group.kind)));
  const parts = [];
  if (kinds.size >= 2) {
    const buttons = [['todo', 'Todo'], ...LENS_ORDER.filter((kind) => kinds.has(kind)).map((kind) => [kind, LENS_LABELS[kind]])]
      .map(([kind, label]) => `<button class="c-lens__button" type="button" data-lens="${kind}" aria-pressed="${kind === 'todo'}">${label}</button>`)
      .join('\n      ');
    parts.push(`<div class="c-lens" role="group" aria-label="Qué quieres ver">
      ${buttons}
    </div>`);
  }
  if (groups.some((group) => group.kind !== 'iconos')) {
    const buttons = FORMATS.map(([format, label]) => `<button class="c-format__button" type="button" data-format="${format}" aria-pressed="false">${label}</button>`).join('\n      ');
    parts.push(`<div class="c-format" role="group" aria-label="Cómo verlo">
      ${buttons}
    </div>`);
  }
  if (!parts.length) return '';
  return `<div class="c-bar">
    ${parts.join('\n    ')}
  </div>`;
}

export function renderCase(data, { layoutPath = 'index.html' } = {}) {
  const layout = extractLayout(layoutPath);
  const rail = `<nav class="c-rail" aria-label="Capítulos">
${data.chapters
  .map((chapter, i) => `      <a class="c-rail__link js-spy" href="#${esc(chapter.id)}"><span class="c-rail__num">${String(i + 1).padStart(2, '0')}</span><span class="c-rail__label">${esc(chapter.title)}</span></a>`)
  .join('\n')}
    </nav>`;

  return `<!doctype html>
<html lang="es" data-case="${esc(data.key)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(data.title)} | Lex Mendoza</title>
    <meta name="description" content="${esc(data.summary)}">
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
    <link rel="stylesheet" href="${PREFIX}assets/css/main.min.css">
    <script type="module" src="${PREFIX}assets/js/main.js"></script>
  </head>
  <body>
    <a class="u-visually-hidden u-visually-hidden--focusable" href="#contenido">Saltar al contenido</a>
    <div class="c-progress" aria-hidden="true"></div>

    ${layout.header}

    ${rail}

    <main id="contenido" data-lens="todo">
      <section class="c-case-hero" id="caso-inicio"${data.card?.images?.length ? ' data-media' : ''} aria-labelledby="caso-titulo">
        ${renderHeroMedia(data.card)}<div class="o-container o-stack">
          <p class="c-eyebrow">// ${esc(data.eyebrow)}</p>
          <h1 class="c-case-hero__title" id="caso-titulo" data-reveal="title"><span class="c-chameleon-title">${esc(data.title)}</span></h1>
          ${text(data.meta, 'c-case-hero__meta')}
          ${text(data.summary, 'c-case-hero__summary')}
          <p class="c-case-hero__teaser" data-reveal="text"><a href="#${esc(data.teaser.chapter)}">${esc(data.teaser.text)}</a></p>
        </div>
      </section>

      ${renderBar(data.chapters)}

      ${data.chapters.map(renderChapter).join('\n\n      ')}

      <section class="c-section c-section--plan" aria-labelledby="cierre-titulo">
        <div class="o-container o-stack">
          <h2 id="cierre-titulo" data-reveal="title">¿Te late este tipo de trabajo?</h2>
          ${text('Cuéntame qué necesitas y armamos tu plan, paso a paso, sin compromiso.', 'c-section__lead')}
          <p><a class="c-button" data-soon="${PREFIX}plan/" aria-disabled="true">Arma tu plan <span class="c-nav__soon">Próximamente</span></a></p>
        </div>
      </section>
    </main>

    ${layout.footer}

    <dialog class="c-lightbox" aria-label="Imagen ampliada">
      <form method="dialog"><button class="c-lightbox__close" type="submit" aria-label="Cerrar">Cerrar</button></form>
      <figure class="c-lightbox__figure"></figure>
      <button class="c-lightbox__nav c-lightbox__nav--prev" type="button" aria-label="Anterior">‹</button>
      <button class="c-lightbox__nav c-lightbox__nav--next" type="button" aria-label="Siguiente">›</button>
    </dialog>

    <a class="c-to-top js-to-top" href="#caso-inicio" aria-label="Volver al inicio del caso"></a>

    <script type="module" src="${PREFIX}assets/js/case.js"></script>
  </body>
</html>
`;
}
