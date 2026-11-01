import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepIndex, nextFormat, showMore, showLess } from '../assets/js/gallery.js';

test('stepIndex avanza y retrocede dando la vuelta en los extremos', () => {
  assert.equal(stepIndex(0, 1, 5), 1);
  assert.equal(stepIndex(4, 1, 5), 0);
  assert.equal(stepIndex(0, -1, 5), 4);
  assert.equal(stepIndex(2, -1, 5), 1);
});

test('stepIndex con una sola imagen o sin imagenes no se mueve', () => {
  assert.equal(stepIndex(0, 1, 1), 0);
  assert.equal(stepIndex(0, -1, 1), 0);
  assert.equal(stepIndex(0, 1, 0), 0);
});

test('nextFormat elige un formato, y volver a pulsarlo regresa al de cada galeria', () => {
  assert.equal(nextFormat(null, 'grid'), 'grid');
  assert.equal(nextFormat(null, 'carousel'), 'carousel');
  assert.equal(nextFormat('grid', 'carousel'), 'carousel');
  assert.equal(nextFormat('grid', 'grid'), null);
  assert.equal(nextFormat('carousel', 'carousel'), null);
});

test('nextFormat ignora un formato desconocido', () => {
  assert.equal(nextFormat('grid', 'otro'), 'grid');
  assert.equal(nextFormat(null, 'otro'), null);
});

test('showMore revela otra pagina sin pasarse del total, y showLess vuelve a la primera', () => {
  assert.equal(showMore(9, 68), 18);
  assert.equal(showMore(63, 68), 68);
  assert.equal(showMore(68, 68), 68);
  assert.equal(showLess(), 9);
});
