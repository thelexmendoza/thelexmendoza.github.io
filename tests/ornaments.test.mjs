import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { GLYPHS, decodeFrame, magnetOffset, spotAt } from '../assets/js/decode.js';

const seeded = (seed = 5) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

test('el decodificado empieza revuelto, termina igual al texto y no cambia el largo ni los signos', () => {
  const text = '// elige una, o las dos';
  const start = decodeFrame(text, 0, seeded());
  assert.equal(start.length, text.length);
  assert.notEqual(start, text);
  assert.equal(decodeFrame(text, 1, seeded()), text);
  for (const frame of [0, 0.25, 0.5, 0.75]) {
    const out = decodeFrame(text, frame, seeded(3));
    [...text].forEach((char, i) => {
      if (!/[\p{L}\p{N}]/u.test(char)) assert.equal(out[i], char, 'espacios y signos no se mueven');
    });
  }
});

test('el decodificado avanza de izquierda a derecha: cada cuadro revela al menos tantas letras como el anterior', () => {
  const text = 'trabajo real, con clientes reales';
  let previous = -1;
  for (let i = 0; i <= 10; i++) {
    const out = decodeFrame(text, i / 10, () => 0.99);
    const right = [...text].filter((char, k) => /[\p{L}\p{N}]/u.test(char) && out[k] === char).length;
    assert.ok(right >= previous, 'nunca se desdecodifica');
    previous = right;
  }
  assert.equal(previous, [...text].filter((c) => /[\p{L}\p{N}]/u.test(c)).length);
});

test('los símbolos del decodificado son ASCII, para que la fuente monoespaciada no cambie el ancho', () => {
  assert.match(GLYPHS, /^[\x20-\x7e]+$/);
});

test('el botón magnético se acerca al cursor, más cuanto más cerca, con tope y sin efecto fuera de alcance', () => {
  assert.deepEqual(magnetOffset(500, 0), { x: 0, y: 0 });
  assert.deepEqual(magnetOffset(0, 0), { x: 0, y: 0 });
  const near = magnetOffset(20, 0);
  const mid = magnetOffset(50, 0);
  assert.ok(near.x > 0 && near.y === 0, 'va hacia el cursor');
  assert.ok(Math.abs(magnetOffset(-30, 0).x) > 0 && magnetOffset(-30, 0).x < 0, 'y en sentido contrario si el cursor está del otro lado');
  assert.ok(Math.hypot(near.x, near.y) <= 9 && Math.hypot(mid.x, mid.y) <= 9, 'nunca más de 9 px');
});

test('el foco de luz se queda dentro de la tarjeta', () => {
  const rect = { left: 100, top: 40, width: 300, height: 200 };
  assert.deepEqual(spotAt(150, 90, rect), { x: 50, y: 50 });
  assert.deepEqual(spotAt(0, 0, rect), { x: 0, y: 0 });
  assert.deepEqual(spotAt(999, 999, rect), { x: 300, y: 200 });
});

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const home = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('assets/js/ornaments.js', 'utf8');

test('la cinta es decorativa (aria-hidden), tiene su copia para el bucle y se detiene con menos movimiento', () => {
  const ticker = home.match(/<div class="c-ticker"[\s\S]*?<\/div>\n {6}<\/div>/)[0];
  assert.match(ticker, /aria-hidden="true"/);
  assert.equal((ticker.match(/class="c-ticker__group"/g) ?? []).length, 2, 'dos grupos iguales para que el bucle no tenga costura');
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{[^}]*\.c-ticker__track\s*\{[^}]*animation:\s*c-ticker/s);
  assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\n\}\n/g, ''), /animation:\s*c-ticker/, 'fuera de no-preference no hay animación');
});

test('los detalles no mueven nada con menos movimiento ni sin cursor fino', () => {
  assert.match(js, /function setupDecode\(\) \{\s*if \(reduce\(\)/);
  assert.match(js, /function setupSpotlight\(\) \{\s*if \(reduce\(\) \|\| !finePointer\(\)\) return;/);
  assert.match(js, /function setupMagnet\(\) \{\s*if \(reduce\(\) \|\| !finePointer\(\)\) return;/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.c-button\s*\{[^}]*translate:\s*var\(--mag-x, 0\) var\(--mag-y, 0\)/);
});

test('el decodificado deja el texto real a los lectores de pantalla y lo restaura al terminar', () => {
  assert.match(js, /real\.className = 'u-visually-hidden'/);
  assert.match(js, /fake\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js, /else el\.textContent = text;/);
});

test('las tarjetas de servicio llevan marcas de registro y foco de luz sin tapar su texto', () => {
  assert.match(css, /\.c-service::before\s*\{[^}]*z-index:\s*-1[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.c-service::after\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.c-service\s*\{[^}]*isolation:\s*isolate/s);
  assert.match(css, /\.c-service--featured\s*\{[^}]*--mark:\s*var\(--color-accent\)/s);
});
