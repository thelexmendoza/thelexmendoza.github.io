import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { renderCardMedia } from '../scripts/render-case.mjs';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const home = fs.readFileSync('index.html', 'utf8');
const card = home.match(/<a class="c-case-card" data-case="valtre"[\s\S]*?<\/a>/)[0];

test('la tarjeta de Valtre trae cinco imagenes de VALKYRIA decorativas y sin texto propio', () => {
  const media = card.match(/<span class="c-case-card__media"[\s\S]*?<\/span>/)[0];
  const imgs = media.match(/<img[^>]*>/g) ?? [];
  assert.equal(imgs.length, 5);
  for (const img of imgs) {
    assert.match(img, /alt=""/);
    assert.match(img, /loading="lazy"/);
    assert.match(img, /width="\d+"/);
    assert.match(img, /height="\d+"/);
  }
  assert.match(card, /<span class="c-case-card__veil" aria-hidden="true">/);
  assert.match(card, /data-media/);
});

test('solo las tarjetas con imagenes (Valtre y CiiSA | PSW) cambian al pasar el cursor', () => {
  assert.equal((home.match(/c-case-card__media/g) ?? []).length, 2);
});

test('al pasar el cursor, al enfocar o al llegar al centro en movil, aparece la imagen con su velo', () => {
  assert.match(css, /\.c-case-card\[data-media\]:hover\s*\{[^}]*--peek:\s*1/);
  assert.match(css, /\.c-case-card\[data-media\]\.is-peek\s*\{[^}]*--peek:\s*1/);
  assert.match(css, /\.c-case-card\[data-media\]:focus-visible\s*\{[^}]*--peek:\s*1/);
  assert.match(css, /\.c-case-card__media,\s*\.c-case-card\[data-media\] \.c-case-card__veil\s*\{[^}]*opacity:\s*var\(--peek\)|\.c-case-card__media,\s*\.c-case-card__veil\s*\{[^}]*opacity:\s*var\(--peek\)/);
  assert.match(css, /\.c-case-card__veil\s*\{[^}]*background:/);
});

test('la barra se comprime hacia arriba y el contenido sube sin cambiar su alineacion a la izquierda', () => {
  assert.match(css, /@property --peek\s*\{[^}]*syntax:\s*"<number>"/);
  assert.match(css, /\.c-case-card\[data-media\]\s*\{[^}]*grid-template-rows:\s*calc\(var\(--bar-h\) \* \(1 - var\(--peek\)\)\) auto auto auto 1fr/);
  assert.match(css, /\.c-case-card__text\s*\{[^}]*color:\s*color-mix\([^;]*var\(--peek\)/, 'el color de la descripcion tambien sale de --peek');
  assert.match(css, /\.c-case-card\[data-media\] \.c-case-card__bar\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.c-case-card\[data-media\] \.c-case-card__bar\s*\{[^}]*background:\s*var\(--color-bg\)/);
  assert.doesNotMatch(css, /\.c-case-card\[data-media\]\.is-peek \.c-case-card__bar[^{]*\{[^}]*opacity/, 'el texto de la barra se recorta, no se desvanece');
  assert.doesNotMatch(css, /\.c-case-card\[data-media\][^{]*\{[^}]*text-align:\s*center/);
});

test('las cinco imagenes se alternan solo si la persona acepta movimiento', () => {
  const animated = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?c-case-card__media img[\s\S]*?animation:[^;]*c-card-bg/);
  assert.ok(animated, 'la animacion de las imagenes va dentro de no-preference');
  assert.match(css, /@keyframes c-card-bg/);
  assert.match(css, /\.c-case-card__media img:first-child\s*\{[^}]*opacity:\s*1/);
});

test('la linea, el titulo y la descripcion suben con una sola transicion, y al salir se deshace igual', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.c-case-card\[data-media\]\s*\{[^}]*transition:[^;]*--peek 0\.35s/);
  assert.doesNotMatch(css, /\.c-case-card\[data-media\][^{]*\{[^}]*transition-delay/, 'ida y vuelta son simetricas');
});

test('"Ver caso" tiene la caja de la tarjeta hermana, transparente en reposo y del color de la marca con el efecto', () => {
  assert.match(css, /\.c-case-card\[data-media\] > \.c-case-card__cta\s*\{[^}]*border:\s*1px solid color-mix\([^;]*var\(--peek\)/);
  assert.match(css, /\.c-case-card\[data-media\] > \.c-case-card__cta\s*\{[^}]*background:\s*color-mix\([^;]*var\(--peek\)/);
  assert.match(css, /\.c-case-card\[data-media\] > \.c-case-card__cta\s*\{[^}]*padding:\s*0 var\(--space-1\)/);
});

test('con el efecto el cuadro de "Ver caso" se alinea con el margen izquierdo, y en reposo el texto no se mueve', () => {
  assert.match(css, /\.c-case-card\[data-media\] > \.c-case-card__cta\s*\{[^}]*margin-inline-start:\s*calc\(var\(--gutter\) - \(var\(--space-1\) \+ 1px\) \* \(1 - var\(--peek\)\)\)/);
});

test('el hero de Valtre usa las mismas cinco imagenes que su tarjeta, en el mismo orden', () => {
  const data = JSON.parse(fs.readFileSync('data/casos/valtre.json', 'utf8'));
  const fromCard = [...card.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(data.card.images.map((i) => i.src), fromCard);
});

test('la tarjeta y el hero comparten nombre de transicion para morfar de una a otro, de ida y de vuelta', () => {
  const block = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@view-transition[\s\S]*?\n\}(?:\n|$)/)?.[0] ?? '';
  assert.match(block, /\.c-case-card\[data-media\],\s*\.c-case-hero\[data-media\]\s*\{[^}]*view-transition-name:\s*var\(--vt-hero\);[^}]*view-transition-class:\s*case-hero/);
  assert.match(block, /::view-transition-group\(\*\.case-hero\)\s*\{[^}]*animation-duration:\s*0\.\d+s/);
  assert.match(block, /::view-transition-old\(\*\.case-hero\),\s*::view-transition-new\(\*\.case-hero\)\s*\{[^}]*object-fit:\s*cover/);
});

test('el hero con fondo alterna las imagenes solo si la persona acepta movimiento y deja el texto por encima', () => {
  assert.match(css, /\.c-case-hero\[data-media\]\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden/);
  assert.match(css, /\.c-case-hero__media img:first-child\s*\{[^}]*opacity:\s*1/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.c-case-hero__media img\s*\{[^}]*animation:[^;]*c-card-bg/);
  assert.match(css, /\.c-case-hero__veil\s*\{[^}]*background:/);
  assert.match(css, /\.c-case-hero\[data-media\] \.o-container\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1/);
});

test('las imagenes de fondo alternan zoom out y zoom in, igual en la tarjeta y en el hero', () => {
  assert.match(css, /@keyframes c-card-bg-in\s*\{\s*0%\s*\{[^}]*transform:\s*scale\(1\)[^}]*\}[\s\S]*?24%\s*\{[^}]*transform:\s*scale\(1\.08\)/);
  assert.match(css, /@keyframes c-card-bg\s*\{\s*0%\s*\{[^}]*transform:\s*scale\(1\.08\)[^}]*\}[\s\S]*?24%\s*\{[^}]*transform:\s*scale\(1\)/);
  assert.match(css, /\.c-case-card__media img:nth-child\(2\),\s*\.c-case-card__media img:nth-child\(4\)\s*\{[^}]*animation-name:\s*c-card-bg-in/);
  assert.match(css, /\.c-case-hero__media img:nth-child\(2\),\s*\.c-case-hero__media img:nth-child\(4\)\s*\{[^}]*animation-name:\s*c-card-bg-in/);
});

test('cada tarjeta con imagenes nombra sus transiciones con la clave de su caso, sin repetir nombres en la home', () => {
  const cards = [...home.matchAll(/<a class="c-case-card" data-case="(\w+)" data-media[^>]*>/g)];
  assert.ok(cards.length >= 2);
  const names = new Set();
  for (const [tag, key] of cards) {
    assert.ok(tag.includes(`style="--vt-hero: hero-${key}; --vt-title: title-${key}"`), `${key}: nombres de transicion`);
    names.add(key);
  }
  assert.equal(names.size, cards.length);
});

test('la tarjeta de CiiSA | PSW abre su caso, ya no dice proximamente y repite el fondo del hero (videos e imagenes) en el mismo orden', () => {
  const ciisa = home.match(/<a class="c-case-card" data-case="ciisa"[\s\S]*?<\/a>/)[0];
  assert.match(ciisa, /href="casos\/ciisa-psw\/"/);
  assert.doesNotMatch(ciisa, /Próximamente|aria-disabled|data-soon/);
  assert.match(ciisa, /<span class="c-case-card__line c-case-card__title"><span class="c-case-card__word">CiiSA \| PSW<\/span><\/span>/);
  assert.match(ciisa, /class="c-case-card__cta">Ver sitios →/);
  const data = JSON.parse(fs.readFileSync('data/casos/ciisa-psw.json', 'utf8'));
  const media = ciisa.match(/<span class="c-case-card__media"[\s\S]*?\n {16}<\/span>/)[0];
  const count = data.card.media.length === 5 ? '' : ` data-count="${data.card.media.length}"`;
  assert.equal(media, `<span class="c-case-card__media" aria-hidden="true"${count}>\n${renderCardMedia(data.card.media)}\n                </span>`);
  assert.ok(data.card.media.some((m) => m.type === 'video'), 'el fondo de CiiSA trae videos');
});

test('la tarjeta de CiiSA | PSW tiene su version: barra de una sola linea, con la altura original en cualquier ancho', () => {
  const ciisa = home.match(/<a class="c-case-card" data-case="ciisa"[^>]*>/)[0];
  assert.match(ciisa, /data-bar="single"/);
  assert.match(css, /\.c-case-card\[data-media\]\[data-bar=single\]\s*\{[^}]*--bar-h:\s*2\.3625rem/);
  assert.match(css, /\.c-case-card\[data-media\]\[data-bar=single\] \.c-case-card__bar\s*\{[^}]*flex-wrap:\s*nowrap/);
  const wide = css.indexOf('.c-case-card[data-media][data-bar=single] {');
  const narrow = css.indexOf('@container (max-width: 28rem)');
  assert.ok(narrow > -1 && wide > narrow, 'la version de una linea va despues de la de dos lineas, para ganar en tarjetas angostas');
});

test('los videos de fondo no hacen zoom: solo se funden, y las imagenes conservan su zoom', () => {
  const flat = [...css.matchAll(/@keyframes (c-card-bg-flat[\w-]*)\s*\{([\s\S]*?)\n  \}\n/g)];
  assert.ok(flat.length >= 4, 'una animacion plana por cada cantidad de elementos (5, 2, 3 y 4)');
  for (const [, name, body] of flat) assert.doesNotMatch(body, /transform|scale/, `${name} no lleva zoom`);
  assert.match(css, /\.c-case-card__media video,\s*\.c-case-hero__media \.c-sky,\s*\.c-case-hero__media video\s*\{[^}]*animation-name:\s*c-card-bg-flat/);
  assert.match(css, /\.c-case-card__media\[data-count="?3"?\] :is\(video, \.c-sky\),\s*\.c-case-hero__media\[data-count="?3"?\] :is\(video, \.c-sky\)\s*\{[^}]*animation-name:\s*c-card-bg-flat-n3/);
  assert.doesNotMatch(css, /\.c-case-(?:card|hero)__media video:nth-child\((?:2|4)\)[^{]*\{[^}]*animation-name:\s*c-card-bg-in/, 'los videos no alternan al zoom in');
  assert.match(css, /\.c-case-card__media img:nth-child\(2\),\s*\.c-case-card__media img:nth-child\(4\)\s*\{[^}]*animation-name:\s*c-card-bg-in/);
});

test('el marcado de cada tarjeta del home esta balanceado y el canvas del cielo vive dentro de su .c-sky', () => {
  for (const [card] of home.matchAll(/<a class="c-case-card"[\s\S]*?<\/a>/g)) {
    const key = card.match(/data-case="(\w+)"/)[1];
    const opens = (card.match(/<span\b/g) ?? []).length;
    const closes = (card.match(/<\/span>/g) ?? []).length;
    assert.equal(opens, closes, `${key}: <span> abiertos y cerrados`);
    const canvases = card.match(/<canvas\b/g) ?? [];
    const insideSky = card.match(/<span class="c-sky"[^>]*>[\s\S]*?<canvas\b[^>]*><\/canvas><\/span>/g) ?? [];
    assert.equal(canvases.length, insideSky.length, `${key}: cada canvas va dentro de su .c-sky`);
  }
});

test('sync-home-card reemplaza el fondo completo aunque contenga spans anidados, y repetirlo no cambia nada', async () => {
  const { execFileSync } = await import('node:child_process');
  const before = fs.readFileSync('index.html', 'utf8');
  execFileSync('node', ['scripts/sync-home-card.mjs', 'ciisa-psw', 'ciisa']);
  const after = fs.readFileSync('index.html', 'utf8');
  assert.equal(after, before, 'sincronizar de nuevo deja el home igual');
});

test('la tarjeta no cambia de alto al activarse: lo que el contenido pierde lo recupera con relleno abajo', () => {
  // El fondo llena la tarjeta con object-fit: cover; si la tarjeta se encoge al hacer hover, el video se vuelve a encuadrar
  // y se ve moverse. La barra baja el 100 % de --bar-h y el titulo sube el --lift (70 %): la diferencia se devuelve abajo.
  assert.match(css, /\.c-case-card\[data-media\]\s*\{[^}]*--lift:\s*0\.7/);
  assert.match(css, /\.c-case-card\[data-media\] > \.c-case-card__title\s*\{[^}]*margin-block-start:\s*calc\(var\(--bar-h\) \* var\(--lift\) \* var\(--peek\)\)/);
  assert.match(css, /\.c-case-card\[data-media\]\s*\{[^}]*padding-block-end:\s*calc\(var\(--bar-h\) \* \(1 - var\(--lift\)\) \* var\(--peek\)\)/);
});
