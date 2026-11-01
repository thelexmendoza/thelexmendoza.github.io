import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCase } from '../scripts/render-case.mjs';

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
  assert.match(hero, /<section class="c-case-hero" id="caso-inicio" data-media aria-labelledby="caso-titulo">/);
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
