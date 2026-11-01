import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';

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

test('solo la tarjeta con imagenes cambia al pasar el cursor', () => {
  assert.equal((home.match(/c-case-card__media/g) ?? []).length, 1);
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
  assert.match(block, /\.c-case-card\[data-media\],\s*\.c-case-hero\[data-media\]\s*\{[^}]*view-transition-name:\s*case-hero/);
  assert.match(block, /::view-transition-group\(case-hero\)\s*\{[^}]*animation-duration:\s*0\.\d+s/);
  assert.match(block, /::view-transition-old\(case-hero\),\s*::view-transition-new\(case-hero\)\s*\{[^}]*object-fit:\s*cover/);
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
