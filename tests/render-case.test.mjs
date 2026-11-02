import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCase, renderCardMedia } from '../scripts/render-case.mjs';

const item = (id, extra = {}) => ({ id, src: `assets/img/casos/demo/${id}-640.webp`, full: `assets/img/casos/demo/${id}-1200.webp`, width: 640, height: 800, alt: `Pieza ${id}`, ...extra });

const data = {
  slug: 'demo',
  key: 'valtre',
  title: 'Demo',
  eyebrow: 'identidad y contenido',
  meta: '2024–2026 · Diseñador multimedia',
  summary: 'Resumen del caso.',
  teaser: { chapter: 'valkyria', text: 'Al final: VALKYRIA, un agente de IA para QA.' },
  chapters: [
    {
      id: 'identidad',
      title: 'Identidad',
      eyebrow: 'una marca, varios centros',
      text: ['Primer párrafo del capítulo.', 'Segundo párrafo.'],
      groups: [
        { kind: 'iconos', topic: 'Iconos de Software Solutions', items: [item('i1'), item('i2'), item('i3')] },
        { kind: 'disenos', topic: 'Logotipos', note: 'Nota del grupo.', items: [item('d1'), item('d2'), item('d3'), item('d4')] },
      ],
    },
    {
      id: 'eventos',
      title: 'Eventos y contenido',
      eyebrow: 'del stand a la pantalla',
      text: ['Texto de eventos.'],
      groups: [{ kind: 'publicaciones', topic: 'Parrillas de contenido', items: [item('p1'), item('p2'), item('p3')] }],
    },
    {
      id: 'valkyria',
      title: 'VALKYRIA',
      eyebrow: 'un agente de IA para QA',
      text: ['Texto de VALKYRIA.'],
      groups: [{ kind: 'disenos', topic: 'Campaña', ai: true, items: [item('v1'), item('v2')] }],
    },
  ],
};

const html = renderCase(data);

test('abre con el titulo, el resumen y el gancho que enlaza al capitulo final', () => {
  assert.match(html, /<h1[^>]*>[\s\S]*Demo/);
  assert.match(html, /Resumen del caso\./);
  assert.match(html, /href="#valkyria"[^>]*>[^<]*VALKYRIA/);
});

test('los capitulos salen en el orden del relato y el ultimo es VALKYRIA', () => {
  const ids = [...html.matchAll(/<section class="c-chapter" id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['identidad', 'eventos', 'valkyria']);
});

test('cada capitulo trae su texto antes de sus galerias', () => {
  const chapter = html.match(/<section class="c-chapter" id="identidad"[\s\S]*?<\/section>/)[0];
  assert.ok(chapter.indexOf('Primer párrafo del capítulo.') < chapter.indexOf('c-icons'), 'el texto va antes de la galeria');
  assert.ok(chapter.indexOf('Segundo párrafo.') < chapter.indexOf('c-gallery'), 'el texto va antes del carrusel');
});

test('los botones de vista solo existen para los tipos que hay y no llevan cantidades', () => {
  const lens = html.match(/<div class="c-lens"[\s\S]*?<\/div>/)[0];
  const labels = [...lens.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1].trim());
  assert.deepEqual(labels, ['Todo', 'Diseños', 'Iconos']);
  assert.doesNotMatch(lens, /\d/);
  assert.doesNotMatch(lens, /aria-pressed="true"[^>]*>(?!Todo)/);
});

test('con fotos aparece el boton de fotos', () => {
  const withPhotos = renderCase({
    ...data,
    chapters: [{ ...data.chapters[0], groups: [{ kind: 'fotos', topic: 'Evento', items: [item('f1')] }, ...data.chapters[0].groups] }],
  });
  assert.match(withPhotos, />Fotos</);
});

test('con un solo tipo de imagen no hay selector de vista', () => {
  const single = renderCase({ ...data, chapters: [{ ...data.chapters[0], groups: [{ kind: 'disenos', topic: 'Solo', items: [item('s1')] }] }] });
  assert.doesNotMatch(single, /class="c-lens"/);
});

test('la pagina no muestra cantidades de piezas en ningun lado', () => {
  const visible = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /\d+\s*(piezas|imágenes|imagenes|archivos|fotos|diseños|iconos)/i);
  assert.doesNotMatch(visible, /\b(piezas|archivos)\b/i);
});

test('los carruseles son contenedores desplazables con una diapositiva por pieza y datos para el lightbox', () => {
  const gallery = html.match(/<div class="c-gallery"[\s\S]*?<\/div>\s*<\/div>/)[0];
  assert.match(gallery, /data-kind="disenos"/);
  assert.equal((gallery.match(/<figure class="c-gallery__slide"/g) ?? []).length, 4);
  assert.match(gallery, /data-full="\.\.\/\.\.\/assets\/img\/casos\/demo\/d1-1200\.webp"/);
});

test('las imagenes cargan perezosas, con tamano declarado y texto alternativo', () => {
  for (const img of html.match(/<img[^>]*>/g) ?? []) {
    if (img.includes('c-hero')) continue;
    assert.match(img, /loading="lazy"/, img);
    assert.match(img, /decoding="async"/, img);
    assert.match(img, /width="\d+"/, img);
    assert.match(img, /height="\d+"/, img);
    assert.match(img, /alt="[^"]+"/, img);
  }
});

test('la hoja de iconos tiene su marcado y las publicaciones son una galeria en formato cuadricula', () => {
  assert.match(html, /<ul class="c-icons__grid"/);
  assert.match(html, /data-kind="iconos"/);
  assert.match(html, /<div class="c-gallery" data-kind="disenos" data-format="grid"/);
  assert.doesNotMatch(html, /c-posts/);
});

test('un grupo de logotipos lleva casillas con margen y el tono de cada logo', () => {
  const logos = renderCase({
    ...data,
    chapters: [{ ...data.chapters[0], groups: [{ kind: 'logos', topic: 'Logotipos', items: [item('l1', { tone: 'light' }), item('l2', { tone: 'dark' }), item('l3')] }] }],
  });
  assert.match(logos, /<div class="c-gallery c-gallery--logos" data-kind="disenos" data-format="carousel"/);
  assert.match(logos, /<figure class="c-gallery__slide c-gallery__slide--logo" data-tone="light"/);
  assert.match(logos, /<figure class="c-gallery__slide c-gallery__slide--logo" data-tone="dark"/);
  assert.match(logos, /<figure class="c-gallery__slide c-gallery__slide--logo" data-reveal="card"/, 'sin tono medido queda neutro');
});

test('hay un selector de formato con carrusel y cuadricula, sin ninguno elegido de inicio y sin numeros', () => {
  const format = html.match(/<div class="c-format"[\s\S]*?<\/div>/)[0];
  const labels = [...format.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1].trim());
  assert.deepEqual(labels, ['Carrusel', 'Cuadrícula']);
  assert.equal((format.match(/aria-pressed="false"/g) ?? []).length, 2);
  assert.doesNotMatch(format, /\d/);
  assert.match(html, /<div class="c-bar"/);
});

test('con solo iconos no hay selector de formato', () => {
  const onlyIcons = renderCase({ ...data, chapters: [{ ...data.chapters[0], groups: [{ kind: 'iconos', topic: 'Solo iconos', items: [item('x1')] }] }] });
  assert.doesNotMatch(onlyIcons, /class="c-format"/);
});

test('las piezas creadas con IA llevan la etiqueta', () => {
  const chapter = html.match(/<section class="c-chapter" id="valkyria"[\s\S]*?<\/section>/)[0];
  assert.match(chapter, /Creada con IA/);
  const other = html.match(/<section class="c-chapter" id="identidad"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(other, /Creada con IA/);
});

test('la pagina usa la paleta del caso, enlaza las rutas hacia la raiz y mantiene la navegacion', () => {
  assert.match(html, /<html lang="es" data-case="valtre"/);
  assert.match(html, /href="\.\.\/\.\.\/assets\/css\/main\.min\.css"/);
  assert.match(html, /src="\.\.\/\.\.\/assets\/js\/main\.js"/);
  assert.match(html, /class="c-nav__brand" href="\.\.\/\.\.\/"/);
  assert.doesNotMatch(html, /href="#casos"/, 'los enlaces de la home deben apuntar a la home');
});

test('el riel enlaza los capitulos y el menu de la home no participa del scroll-spy', () => {
  const rail = html.match(/<nav class="c-rail"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...rail.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]), ['identidad', 'eventos', 'valkyria']);
  const nav = html.match(/<header class="c-nav">[\s\S]*?<\/header>/)[0];
  assert.doesNotMatch(nav, /js-spy/);
});

test('cierra con la invitacion a armar el plan, marcada como proxima mientras plan/ no exista', () => {
  assert.match(html, /class="c-button"[^>]*data-soon="\.\.\/\.\.\/plan\/"/);
  assert.match(html, /Arma tu plan/);
});

test('hay un solo h1, el lightbox existe y los textos se escapan', () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(html, /<dialog class="c-lightbox"/);
  const risky = renderCase({ ...data, title: 'A <b>&</b> B' });
  assert.doesNotMatch(risky, /<b>&<\/b>/);
  assert.match(risky, /A &lt;b&gt;&amp;&lt;\/b&gt; B/);
});

test('hay un boton para volver al hero del caso, que es un enlace al inicio', () => {
  assert.match(html, /<section class="c-case-hero" id="caso-inicio"/);
  assert.match(html, /<a class="c-to-top js-to-top" href="#caso-inicio" aria-label="Volver al inicio del caso">/);
});

test('con imagenes de tarjeta, el hero lleva el mismo fondo (imagenes en ciclo y velo) y se marca para la transicion compartida', () => {
  const card = { images: [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, src: `assets/img/casos/demo/c${n}-640.webp`, full: `assets/img/casos/demo/c${n}-1200.webp`, width: 640, height: 400 })) };
  const withCard = renderCase({ ...data, card });
  const hero = withCard.match(/<section class="c-case-hero"[\s\S]*?<\/section>/)[0];
  assert.match(hero, /<section class="c-case-hero" id="caso-inicio" data-media style="--vt-hero: hero-valtre; --vt-title: title-valtre" aria-labelledby="caso-titulo">/);
  const media = hero.match(/<span class="c-case-hero__media" aria-hidden="true">[\s\S]*?<\/span>/)[0];
  const imgs = media.match(/<img[^>]*>/g) ?? [];
  assert.equal(imgs.length, 5);
  for (const [i, img] of imgs.entries()) {
    assert.match(img, new RegExp(`src="\.\./\.\./assets/img/casos/demo/c${i + 1}-1200\.webp"`));
    assert.match(img, /alt=""/);
    assert.match(img, i === 0 ? /decoding="async"/ : /loading="lazy"/);
  }
  assert.match(hero, /<span class="c-case-hero__veil" aria-hidden="true"><\/span>/);
  assert.doesNotMatch(html, /c-case-hero__media/, 'sin imagenes de tarjeta no hay fondo');
});

const siteItem = (slug, extra = {}) => ({
  id: slug, title: `Sitio ${slug}`, url: `https://${slug}.example.com/`, domain: `${slug}.example.com`, tags: 'Evento · 2026', text: `Texto de ${slug}.`, color: '#b7ec04', alt: `Vista previa de Sitio ${slug}`,
  src: `assets/img/casos/demo/${slug}-640.webp`, full: `assets/img/casos/demo/${slug}-1200.webp`, width: 640, height: 400,
  shots: { tablet: { src: `assets/img/casos/demo/${slug}-tablet-820.webp`, width: 820, height: 1180 }, mobile: { src: `assets/img/casos/demo/${slug}-mobile-390.webp`, width: 390, height: 844 } },
  ...extra,
});
const sitesCase = renderCase({
  ...data,
  chapters: [{ id: 'sitios', title: 'Sitios', eyebrow: 'publicados', text: ['Entra y recorrelos.'], groups: [{ kind: 'sitios', topic: 'Sitios publicados', items: [siteItem('uno'), siteItem('dos', { shots: {} })] }] }],
  teaser: { chapter: 'sitios', text: 'Visita los sitios.' },
});

test('cada sitio es una tarjeta que se abre en otra pestana, con su color, su dominio y un llamado a visitarlo', () => {
  const card = sitesCase.match(/<a class="c-site-card"[\s\S]*?<\/a>/)[0];
  assert.match(card, /href="https:\/\/uno\.example\.com\/" target="_blank" rel="noopener noreferrer" style="--site-color: #b7ec04"/);
  assert.match(card, /<span class="c-site-card__domain">uno\.example\.com<\/span>/);
  assert.match(card, /<span class="c-site-card__tags">Evento · 2026<\/span>/);
  assert.match(card, /<span class="c-site-card__title">Sitio uno<\/span>/);
  assert.match(card, /<span class="c-site-card__text">Texto de uno\.<\/span>/);
  assert.match(card, /<span class="c-site-card__cta">Visita el sitio[^<]*<span class="u-visually-hidden">\(se abre en otra pestaña\)<\/span><\/span>/);
});

test('la vista previa cambia de proporcion segun la pantalla: movil, tablet y escritorio', () => {
  const picture = sitesCase.match(/<picture class="c-site-card__preview">[\s\S]*?<\/picture>/)[0];
  assert.match(picture, /<source media="\(max-width: 30em\)" srcset="\.\.\/\.\.\/assets\/img\/casos\/demo\/uno-mobile-390\.webp">/);
  assert.match(picture, /<source media="\(max-width: 60em\)" srcset="\.\.\/\.\.\/assets\/img\/casos\/demo\/uno-tablet-820\.webp">/);
  assert.match(picture, /<img src="\.\.\/\.\.\/assets\/img\/casos\/demo\/uno-1200\.webp" width="640" height="400" alt="Vista previa de Sitio uno" loading="lazy" decoding="async">/);
});

test('un sitio sin capturas de tablet o movil usa solo la de escritorio', () => {
  const second = sitesCase.match(/<a class="c-site-card"[\s\S]*?<\/a>/g)[1];
  assert.doesNotMatch(second, /<source/);
  assert.match(second, /dos-1200\.webp/);
});

test('con solo sitios no hay barra de vistas ni selector de formato, y con un solo capitulo no hay riel', () => {
  assert.doesNotMatch(sitesCase, /class="c-bar"/);
  assert.doesNotMatch(sitesCase, /class="c-rail"/);
  assert.match(sitesCase, /<div class="c-sites" data-kind="sitios">/);
});

test('cada caso nombra sus transiciones con su propia clave, para que dos tarjetas del home no repitan nombre', () => {
  const card = { images: [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, src: `a${n}-640.webp`, full: `a${n}-1200.webp`, width: 640, height: 400 })) };
  assert.match(renderCase({ ...data, key: 'valtre', card }), /<section class="c-case-hero" id="caso-inicio" data-media style="--vt-hero: hero-valtre; --vt-title: title-valtre" aria-labelledby="caso-titulo">/);
  assert.match(renderCase({ ...data, key: 'ciisa', card }), /style="--vt-hero: hero-ciisa; --vt-title: title-ciisa"/);
});

const mixedCard = {
  media: [
    { type: 'video', id: 'beyond', desktop: 'assets/video/casos/demo/beyond-h.mp4', mobile: 'assets/video/casos/demo/beyond-v.mp4', poster: 'assets/video/casos/demo/beyond-h-poster.webp', posterMobile: 'assets/video/casos/demo/beyond-v-poster.webp', width: 1280, height: 722 },
    { type: 'image', id: 'adobe', src: 'assets/img/casos/demo/adobe-640.webp', full: 'assets/img/casos/demo/adobe-1200.webp', width: 640, height: 400 },
    { type: 'video', id: 'solo', desktop: 'assets/video/casos/demo/solo-h.mp4', poster: 'assets/video/casos/demo/solo-h-poster.webp', width: 1280, height: 720 },
  ],
};

test('el hero reproduce los videos del caso: sin sonido, en bucle, con poster y con la version vertical para movil', () => {
  const hero = renderCase({ ...data, key: 'ciisa', card: mixedCard }).match(/<section class="c-case-hero"[\s\S]*?<\/section>/)[0];
  assert.match(hero, /<span class="c-case-hero__media" aria-hidden="true" data-count="3">/);
  const video = hero.match(/<video[^>]*beyond-h\.mp4[^>]*><\/video>/)[0];
  assert.match(video, /class="c-case-hero__video"/);
  for (const attr of ['muted', 'loop', 'playsinline', 'preload="metadata"']) assert.ok(video.includes(attr), attr);
  assert.doesNotMatch(video, /\bautoplay\b/, 'lo reproduce el JavaScript, solo si la persona acepta movimiento');
  assert.match(video, /poster="\.\.\/\.\.\/assets\/video\/casos\/demo\/beyond-h-poster\.webp"/);
  assert.match(video, /data-src-mobile="\.\.\/\.\.\/assets\/video\/casos\/demo\/beyond-v\.mp4"/);
  assert.match(video, /data-poster-mobile="\.\.\/\.\.\/assets\/video\/casos\/demo\/beyond-v-poster\.webp"/);
  assert.match(video, /width="1280" height="722"/);
  assert.match(hero, /<img src="\.\.\/\.\.\/assets\/img\/casos\/demo\/adobe-1200\.webp"/);
  const solo = hero.match(/<video[^>]*solo-h\.mp4[^>]*><\/video>/)[0];
  assert.doesNotMatch(solo, /data-src-mobile/, 'sin version vertical no hay atributo movil');
  assert.match(hero, /<section class="c-case-hero" id="caso-inicio" data-media/);
});

test('un fondo de cinco elementos no lleva data-count (es el ciclo original)', () => {
  const card = { images: [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, src: `a${n}-640.webp`, full: `a${n}-1200.webp`, width: 640, height: 400 })) };
  assert.doesNotMatch(renderCase({ ...data, card }), /data-count/);
});

test('el cielo animado se dibuja en un canvas dentro del fondo, igual en el hero y en la tarjeta', () => {
  const card = { media: [{ type: 'video', id: 'a', desktop: 'a-h.mp4', poster: 'a.webp', width: 10, height: 10 }, { type: 'sky', id: 'adobe' }] };
  const hero = renderCase({ ...data, card }).match(/<span class="c-case-hero__media"[\s\S]*?<\/span>\s*<span class="c-case-hero__veil"/)[0];
  assert.match(hero, /data-count="2"/);
  assert.match(hero, /<span class="c-sky" data-sky="adobe" aria-hidden="true"><span class="c-sky__aurora"><\/span><canvas class="c-sky__stars"><\/canvas><\/span>/);
  assert.match(renderCardMedia(card.media), /<span class="c-sky" data-sky="adobe" aria-hidden="true"><span class="c-sky__aurora"><\/span><canvas class="c-sky__stars"><\/canvas><\/span>/);
});

test('con dos o mas marcas aparece el filtro por marca y cada galeria lleva su marca', () => {
  const branded = renderCase({
    ...data,
    brands: [{ id: 'bmw', label: 'BMW' }, { id: 'mini', label: 'MINI' }, { id: 'motorrad', label: 'Motorrad' }],
    chapters: [{
      ...data.chapters[0],
      groups: [
        { kind: 'fotos', topic: 'Autos BMW', brand: 'bmw', items: [item('b1')] },
        { kind: 'fotos', topic: 'Autos MINI', brand: 'mini', items: [item('m1')] },
      ],
    }],
  });
  const bar = branded.match(/<div class="c-lens c-lens--brand"[\s\S]*?<\/div>/)[0];
  const labels = [...bar.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((m) => m[1].trim());
  assert.deepEqual(labels, ['Todas', 'BMW', 'MINI'], 'solo salen las marcas que tienen galerias');
  assert.match(bar, /data-brand-filter="todas" aria-pressed="true"/);
  assert.match(branded, /data-kind="fotos" data-format="carousel" data-brand="bmw"/);
  assert.match(branded, /data-brand="mini"/);
  assert.doesNotMatch(bar, /\d/);
});

test('sin marcas o con una sola no hay filtro por marca', () => {
  assert.doesNotMatch(html, /c-lens--brand|data-brand/);
  const one = renderCase({ ...data, brands: [{ id: 'bmw', label: 'BMW' }], chapters: [{ ...data.chapters[0], groups: [{ kind: 'fotos', topic: 'Solo', brand: 'bmw', items: [item('b1')] }] }] });
  assert.doesNotMatch(one, /c-lens--brand/);
});

test('los videos de YouTube salen como miniatura con boton de reproducir, sin cargar el reproductor', () => {
  const video = item('yt-abcdefghijk', { videoId: 'abcdefghijk', caption: 'Banda: Tema | México Metal Fest', width: 640, height: 360 });
  const page = renderCase({
    ...data,
    chapters: [{ ...data.chapters[0], groups: [{ kind: 'videos', topic: 'México Metal Fest', items: [video] }, ...data.chapters[0].groups] }],
  });
  const group = page.match(/<div class="c-gallery c-gallery--videos"[\s\S]*?<\/div>\n/)[0];
  assert.match(group, /data-kind="videos" data-format="grid"/);
  assert.match(group, /<button class="c-gallery__play js-play" type="button" data-video="abcdefghijk"/);
  assert.match(group, /aria-label="Reproducir: Banda: Tema \| México Metal Fest"/);
  assert.doesNotMatch(page, /<iframe|youtube\.com|youtube-nocookie|ytimg/, 'el reproductor y YouTube solo se tocan al hacer clic (case.js)');
  assert.match(page, />Videos</, 'con otros tipos hay boton de vista para los videos');
});
