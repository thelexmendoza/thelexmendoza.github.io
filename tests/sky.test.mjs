import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedSky, stepSky } from '../assets/js/sky.js';

// Generador determinista para que las pruebas no dependan del azar.
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

test('la cantidad de estrellas sigue el area del fondo, entre 26 y 95', () => {
  assert.equal(seedSky(300, 200, seeded()).stars.length, 26, 'un fondo chico no baja de 26');
  assert.equal(seedSky(1440, 600, seeded()).stars.length, 58);
  assert.equal(seedSky(3000, 2000, seeded()).stars.length, 95, 'un fondo enorme no pasa de 95');
});

test('en pantalla chica hay menos destellos y adornos, y las lineas entre estrellas son mas cortas', () => {
  const small = seedSky(390, 800, seeded());
  const wide = seedSky(1440, 600, seeded());
  assert.equal(small.sparks.length, 6);
  assert.equal(small.orns.length, 4);
  assert.equal(small.link, 84);
  assert.equal(wide.sparks.length, 11);
  assert.equal(wide.orns.length, 8);
  assert.equal(wide.link, 112);
});

test('todo se siembra dentro del fondo y los destellos alternan verde CiiSA y rojo Adobe', () => {
  const sky = seedSky(1440, 600, seeded(7));
  for (const star of sky.stars) {
    assert.ok(star.x >= 0 && star.x <= 1440 && star.y >= 0 && star.y <= 600);
    assert.ok(star.r >= 0.9 && star.r <= 2.1);
  }
  assert.deepEqual([...new Set(sky.sparks.map((s) => s.c))].sort(), ['188,242,0', '248,105,86']);
  assert.ok(sky.orns.every((o) => ['circle', 'square', 'plus'].includes(o.t)));
});

test('al moverse, lo que sale por un borde reaparece por el opuesto', () => {
  const sky = { stars: [{ x: 1439, y: 10, vx: 6, vy: 0 }, { x: 100, y: -3, vx: 0, vy: -5 }], orns: [{ x: -29, y: 50, vx: -4, vy: 0, rot: 0, vr: 0.1 }] };
  stepSky(sky, 1, 1440, 600);
  assert.equal(sky.stars[0].x, -4, 'sale por la derecha y entra por la izquierda');
  assert.equal(sky.stars[1].y, 604, 'sale por arriba y entra por abajo');
  assert.equal(sky.orns[0].x, 1470, 'los adornos tienen un margen mayor');
  assert.ok(Math.abs(sky.orns[0].rot - 0.1) < 1e-9, 'los adornos giran');
});

import * as sass from 'sass';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;

test('el cielo llena su fondo con el degradado navy de Adobe y una vineta que oscurece los bordes', () => {
  assert.match(css, /\.c-sky\s*\{[^}]*position:\s*absolute;[^}]*overflow:\s*hidden;[^}]*linear-gradient\(160deg,\s*#00030f/);
  assert.match(css, /\.c-sky::after\s*\{[^}]*radial-gradient/);
  assert.match(css, /\.c-sky__stars\s*\{[^}]*inline-size:\s*100%;[^}]*block-size:\s*100%/);
});

test('la aurora deriva despacio solo si la persona acepta movimiento', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.c-sky__aurora\s*\{[^}]*animation:\s*c-sky-aurora 38s/);
  assert.match(css, /@keyframes c-sky-aurora/);
});

test('el cielo entra en el ciclo de fondos como un video: se funde y no hace zoom', () => {
  assert.match(css, /\.c-case-card__media \.c-sky,[\s\S]*?\{[^}]*opacity:\s*0/);
  assert.match(css, /\.c-case-card__media \.c-sky:first-child[\s\S]*?\{[^}]*opacity:\s*1/);
  assert.match(css, /\.c-case-hero__media \.c-sky,\s*\.c-case-hero__media video\s*\{[^}]*animation-name:\s*c-card-bg-flat/);
  assert.match(css, /\[data-count="?3"?\] :is\(video, \.c-sky\)[\s\S]*?\{[^}]*animation-name:\s*c-card-bg-flat-n3/);
});
