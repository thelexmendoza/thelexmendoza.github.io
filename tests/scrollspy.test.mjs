import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickActive } from '../assets/js/scrollspy.js';

const sections = [
  { id: 'inicio', top: -400, bottom: 300 },
  { id: 'servicios', top: 300, bottom: 900 },
  { id: 'casos', top: 900, bottom: 1700 },
];

test('devuelve la seccion que contiene la linea de lectura', () => {
  assert.equal(pickActive(sections, 500), 'servicios');
  assert.equal(pickActive(sections, 100), 'inicio');
});

test('la linea justo en el borde pertenece a la seccion que empieza ahi', () => {
  assert.equal(pickActive(sections, 900), 'casos');
});

test('antes de la primera seccion no hay activa', () => {
  assert.equal(pickActive([{ id: 'inicio', top: 200, bottom: 800 }], 100), null);
});

test('despues de la ultima seccion queda la ultima', () => {
  assert.equal(pickActive(sections, 5000), 'casos');
});

test('no depende del orden en que lleguen las secciones', () => {
  assert.equal(pickActive([...sections].reverse(), 500), 'servicios');
});

test('sin secciones no falla', () => {
  assert.equal(pickActive([], 100), null);
});
