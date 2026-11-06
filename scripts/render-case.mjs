import fs from 'node:fs';

// Genera la pagina de un caso a partir de sus datos. Es una funcion pura de texto: no toca imagenes.
// El relato va primero: cada capitulo es titulo, texto y luego sus galerias. Los botones de vista
// solo afectan a las imagenes, nunca al texto.

const PREFIX = '../../';
const LENS_LABELS = { disenos: 'Diseños', fotos: 'Fotos', videos: 'Videos', iconos: 'Iconos' };
const LENS_ORDER = ['disenos', 'fotos', 'videos', 'iconos'];

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

// Sitios publicados: cada uno es una tarjeta con la vista previa de su hero, el color del sitio y un
// llamado a visitarlo. La vista previa cambia de proporcion segun la pantalla (movil, tablet o escritorio).
function renderSites(group) {
  const cards = group.items
    .map((site) => {
      const sources = [
        ['(max-width: 30em)', site.shots?.mobile],
        ['(max-width: 60em)', site.shots?.tablet],
      ]
        .filter(([, shot]) => shot)
        .map(([media, shot]) => `<source media="${media}" srcset="${esc(PREFIX + shot.src)}">`)
        .join('');
      return `<li class="c-sites__item" data-reveal="card">
        <a class="c-site-card" href="${esc(site.url)}" target="_blank" rel="noopener noreferrer" style="--site-color: ${esc(site.color)}">
          <span class="c-site-card__bar"><span class="c-site-card__domain">${esc(site.domain)}</span><span class="c-site-card__tags">${esc(site.tags)}</span></span>
          <picture class="c-site-card__preview">${sources}<img src="${esc(PREFIX + site.full)}" width="${site.width}" height="${site.height}" alt="${esc(site.alt)}" loading="lazy" decoding="async"></picture>
          <span class="c-site-card__title">${esc(site.title)}</span>
          <span class="c-site-card__text">${esc(site.text)}</span>
          <span class="c-site-card__cta">Visita el sitio ↗<span class="u-visually-hidden">(se abre en otra pestaña)</span></span>
        </a>
      </li>`;
    })
    .join('\n      ');
  return `<div class="c-sites" data-kind="sitios">
    ${head(group)}
    <ul class="c-sites__grid">
      ${cards}
    </ul>
  </div>`;
}

const brandAttr = (group) => (group.brand ? ` data-brand="${esc(group.brand)}"` : '');

// Videos de YouTube: miniatura con boton de reproducir. El reproductor (youtube-nocookie) solo se carga al tocarla.
function renderVideos(group) {
  const slides = group.items
    .map((item) => {
      const label = esc(item.caption ?? item.alt);
      return `<figure class="c-gallery__slide c-gallery__slide--video" data-reveal="card"><button class="c-gallery__play js-play" type="button" data-video="${esc(item.videoId)}" data-title="${label}" aria-label="Reproducir: ${label}">${img(item)}<span class="c-gallery__play-icon" aria-hidden="true"></span></button>${
        item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''
      }</figure>`;
    })
    .join('\n      ');
  return `<div class="c-gallery c-gallery--videos" data-kind="videos" data-format="grid"${brandAttr(group)} data-gallery>
    ${head(group)}
    <div class="c-gallery__track" tabindex="0" role="group" aria-label="${esc(group.topic)}">
      ${slides}
    </div>
  </div>`;
}

function renderGroup(group) {
  if (group.kind === 'sitios') return renderSites(group);
  if (group.kind === 'videos') return renderVideos(group);
  const kind = lensOf(group.kind);
  if (group.kind === 'iconos') {
    const items = group.items.map((item) => `<li class="c-icons__item" title="${esc(item.alt)}">${img(item)}</li>`).join('\n      ');
    return `<div class="c-icons" data-kind="iconos"${brandAttr(group)}>
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
  return `<div class="c-gallery${logos ? ' c-gallery--logos' : ''}" data-kind="${kind}" data-format="${format}"${brandAttr(group)} data-gallery>
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

// Fondo del hero: los mismos elementos que la tarjeta del home (imagenes y videos del caso), para que la tarjeta
// se transforme en el hero. Los videos no llevan `autoplay`: los reproduce el JavaScript, solo si la persona
// acepta movimiento (si no, se queda el poster). La version vertical se elige en el navegador (`data-src-mobile`).
const cardMedia = (card) => card?.media ?? (card?.images ?? []).map((item) => ({ type: 'image', ...item }));

// Fondo de la tarjeta del home: los mismos elementos que el hero. Aqui los videos no traen `src` ni se descargan
// hasta que la tarjeta se activa (`preload="none"`, con su poster); las imagenes cargan perezosas.
export function renderCardMedia(media, prefix = '') {
  const pad = ' '.repeat(18);
  return media
    .map((item) => {
      if (item.type === 'sky') return `${pad}<span class="c-sky" data-sky="${esc(item.id)}" aria-hidden="true"><span class="c-sky__aurora"></span><canvas class="c-sky__stars"></canvas></span>`;
      if (item.type === 'video') {
        const mobile = item.mobile ? ` data-src-mobile="${esc(prefix + item.mobile)}" data-poster-mobile="${esc(prefix + item.posterMobile)}"` : '';
        return `${pad}<video class="c-case-card__video" data-src="${esc(prefix + item.desktop)}"${mobile} poster="${esc(prefix + item.poster)}" width="${item.width}" height="${item.height}" muted loop playsinline preload="none"></video>`;
      }
      return `${pad}<img src="${esc(prefix + item.src)}" alt="" width="${item.width}" height="${item.height}" loading="lazy" decoding="async">`;
    })
    .join('\n');
}

function renderHeroMedia(card) {
  const media = cardMedia(card);
  if (!media.length) return '';
  const items = media
    .map((item, i) => {
      if (item.type === 'sky') return `<span class="c-sky" data-sky="${esc(item.id)}" aria-hidden="true"><span class="c-sky__aurora"></span><canvas class="c-sky__stars"></canvas></span>`;
      if (item.type === 'video') {
        const mobile = item.mobile ? ` data-src-mobile="${esc(PREFIX + item.mobile)}" data-poster-mobile="${esc(PREFIX + item.posterMobile)}"` : '';
        return `<video class="c-case-hero__video" src="${esc(PREFIX + item.desktop)}" poster="${esc(PREFIX + item.poster)}"${mobile} width="${item.width}" height="${item.height}" muted loop playsinline preload="metadata"></video>`;
      }
      return `<img src="${esc(PREFIX + item.full)}" alt="" width="${item.width}" height="${item.height}" decoding="async"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
    })
    .join('\n            ');
  const count = media.length === 5 ? '' : ` data-count="${media.length}"`;
  return `<span class="c-case-hero__media" aria-hidden="true"${count}>
            ${items}
          </span>
          <span class="c-case-hero__veil" aria-hidden="true"></span>
          `;
}

function renderBar(chapters, brands = []) {
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
  const used = new Set(groups.map((group) => group.brand).filter(Boolean));
  const brandList = brands.filter((brand) => used.has(brand.id));
  if (brandList.length >= 2) {
    const buttons = [{ id: 'todas', label: 'Todas' }, ...brandList]
      .map((brand) => `<button class="c-lens__button" type="button" data-brand-filter="${esc(brand.id)}" aria-pressed="${brand.id === 'todas'}">${esc(brand.label)}</button>`)
      .join('\n      ');
    parts.push(`<div class="c-lens c-lens--brand" role="group" aria-label="Qué marca quieres ver">
      ${buttons}
    </div>`);
  }
  if (groups.some((group) => group.kind !== 'iconos' && group.kind !== 'sitios')) {
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
  // Un riel de un solo capitulo no sirve para navegar: solo aparece desde dos.
  const rail = data.chapters.length < 2 ? '' : `<nav class="c-rail" aria-label="Capítulos">
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
    <script type="module" src="${PREFIX}assets/js/main.js"></script>
  </head>
  <body>
    <a class="u-visually-hidden u-visually-hidden--focusable" href="#contenido">Saltar al contenido</a>
    <div class="c-progress" aria-hidden="true"></div>

    ${layout.header}

    ${rail}

    <main id="contenido" data-lens="todo">
      <section class="c-case-hero" id="caso-inicio"${cardMedia(data.card).length ? ` data-media style="--vt-hero: hero-${esc(data.key)}; --vt-title: title-${esc(data.key)}"` : ''} aria-labelledby="caso-titulo">
        ${renderHeroMedia(data.card)}<div class="o-container o-stack">
          <p class="c-eyebrow">// ${esc(data.eyebrow)}</p>
          <h1 class="c-case-hero__title" id="caso-titulo" data-reveal="title"><span class="c-chameleon-title">${esc(data.title)}</span></h1>
          ${text(data.meta, 'c-case-hero__meta')}
          ${text(data.summary, 'c-case-hero__summary')}
          <p class="c-case-hero__teaser" data-reveal="text"><a href="#${esc(data.teaser.chapter)}">${esc(data.teaser.text)}</a></p>
        </div>
      </section>

      ${renderBar(data.chapters, data.brands)}

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
