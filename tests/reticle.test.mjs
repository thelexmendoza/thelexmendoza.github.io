import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { SPACING, smoothSpeed, radiusFor, levelFor, alphaFor, reticlePoints, pointerOffset, shuffle, collageSlots, pickTiles } from '../assets/js/reticle.js';

// Azar determinista para que las pruebas no dependan de la suerte.
const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

test('el alcance de los retículos crece en proporción a la velocidad, con mínimo y máximo', () => {
  assert.equal(radiusFor(0), 96);
  assert.equal(radiusFor(1.6), 280);
  assert.equal(radiusFor(9), 280);
  assert.ok(radiusFor(0.8) > radiusFor(0.4) && radiusFor(0.4) > radiusFor(0.1));
  assert.equal(radiusFor(0.8), 188);
});

test('la velocidad se suaviza: un salto no dispara el alcance de golpe', () => {
  const first = smoothSpeed(0, 80, 16);
  assert.ok(first > 0 && first < 5 * 0.2 + 1e-9);
  assert.equal(smoothSpeed(1, 0, 0), 1, 'sin tiempo transcurrido no se inventa velocidad');
});

test('la densidad sube hacia el cursor: cuartos en el centro, mitades en medio, nada fuera', () => {
  assert.equal(levelFor(10, 100), 2);
  assert.equal(levelFor(50, 100), 1);
  assert.equal(levelFor(90, 100), 0);
  assert.equal(levelFor(100, 100), -1);
  assert.ok(alphaFor(0, 100) === 1 && alphaFor(50, 100) < 1 && alphaFor(100, 100) === 0);
});

test('hay más puntos cuanto mayor es el alcance, y ninguno cae sobre la retícula base', () => {
  const small = reticlePoints(300, 300, 96);
  const large = reticlePoints(300, 300, 280);
  assert.ok(large.length > small.length * 3, 'el conteo crece con el área del alcance');
  const origin = { x: 5, y: 9 };
  for (const p of reticlePoints(300, 300, 200, origin)) {
    const rx = (p.x - origin.x) / SPACING;
    const ry = (p.y - origin.y) / SPACING;
    const base = Math.abs(rx - Math.round(rx)) < 1e-6 && Math.abs(ry - Math.round(ry)) < 1e-6;
    assert.ok(!base, 'un punto nuevo nunca se encima a uno de la base');
  }
});

test('los puntos de cuarto solo aparecen cerca del cursor y los de mitad un poco más lejos', () => {
  const R = 200;
  for (const p of reticlePoints(400, 400, R)) {
    const d = Math.hypot(p.x - 400, p.y - 400);
    assert.ok(d < R);
    const half = Math.abs((p.x / (SPACING / 2)) % 1) < 1e-6 && Math.abs((p.y / (SPACING / 2)) % 1) < 1e-6;
    if (!half) assert.ok(d < R * 0.38, 'los de cuarto, solo en el centro');
    else assert.ok(d < R * 0.72, 'los de mitad, en el centro y alrededor');
  }
});

test('el número de puntos tiene tope para no ahogar el dibujo', () => {
  assert.ok(reticlePoints(500, 500, 5000).length <= 1400);
});

test('el parallax se mide de -1 a 1 desde el centro de la caja y no se pasa', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };
  assert.deepEqual(pointerOffset(300, 150, rect), { x: 0, y: 0 });
  assert.deepEqual(pointerOffset(100, 50, rect), { x: -1, y: -1 });
  assert.deepEqual(pointerOffset(900, 900, rect), { x: 1, y: 1 });
});

test('el collage se mezcla de verdad, no pierde piezas y las casillas no se repiten', () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8];
  const mixed = shuffle(list, seeded(3));
  assert.deepEqual([...mixed].sort(), list);
  assert.notDeepEqual(mixed, list);
  assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8], 'no toca la lista original');
  assert.notDeepEqual(shuffle(list, seeded(11)), mixed, 'otro azar, otro orden');

  const slots = collageSlots(12, 6, 3, seeded(5));
  assert.equal(slots.length, 12);
  assert.equal(new Set(slots.map((s) => `${Math.round(s.x / 16)}:${Math.round(s.y / 33)}`)).size > 6, true);
  assert.ok(slots.every((s) => s.x > 0 && s.x < 100 && s.y > 0 && s.y < 100 && Math.abs(s.rotate) <= 4));
});

test('cada caso aparece en el collage, con a lo más las piezas pedidas', () => {
  const byCase = {
    valtre: [{ src: 'v1' }, { src: 'v2' }, { src: 'v3' }, { src: 'v4' }],
    bmw: [{ src: 'b1' }, { src: 'b2' }],
    ciisa: [{ src: 'c1' }],
  };
  const tiles = pickTiles(byCase, 3, seeded(9));
  assert.equal(tiles.length, 3 + 2 + 1);
  assert.deepEqual([...new Set(tiles.map((t) => t.key))].sort(), ['bmw', 'ciisa', 'valtre']);
  assert.equal(tiles.filter((t) => t.key === 'valtre').length, 3);
});

// Contrato del CSS y del módulo: lo decorativo no cambia la lectura y respeta el movimiento reducido.
const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const fx = fs.readFileSync('assets/js/hero-fx.js', 'utf8');

test('el collage y los retículos no reciben el puntero ni tapan el texto', () => {
  assert.match(css, /\.c-hero__backdrop\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.c-hero__reticles\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.c-hero__inner\s*\{[^}]*z-index:\s*1/);
  assert.match(css, /\.c-hero__collage\s*\{[^}]*mask-image:\s*linear-gradient/);
});

test('el parallax usa translate, para convivir con el parallax del scroll (transform)', () => {
  assert.match(css, /\.c-hero__grid\s*\{[^}]*translate:\s*calc\(var\(--px, 0\) \* -10px\)/);
  assert.match(css, /\.c-hero__collage\s*\{[^}]*translate:\s*calc\(var\(--px, 0\) \* -26px\)/);
});

test('la pieza destacada recupera el color y la palabra toma la identidad del caso', () => {
  assert.match(css, /\.c-hero__tile\.is-hot\s*\{[^}]*filter:\s*none/);
  assert.match(css, /\.c-chameleon-title--spectrum\[data-case\]\s*\{[^}]*linear-gradient\(90deg, var\(--gradient-a\), var\(--gradient-b\)/);
});

test('con menos movimiento no hay parallax ni retículos ni transiciones nuevas', () => {
  assert.match(fx, /prefers-reduced-motion: reduce/);
  assert.match(fx, /if \(!hover \|\| reduce\) return;/, 'sin cursor fino o con menos movimiento no se enlaza el puntero');
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{[^}]*\.c-hero__tile\s*\{[^}]*transition:/s);
});
