import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staggerDelay } from '../assets/js/reveal.js';

test('el primer elemento no espera', () => {
  assert.equal(staggerDelay(0), 0);
});

test('cada elemento espera 80 ms mas que el anterior', () => {
  assert.equal(staggerDelay(1), 80);
  assert.equal(staggerDelay(3), 240);
});

test('la espera tiene tope de 480 ms para no hacer esperar de mas', () => {
  assert.equal(staggerDelay(6), 480);
  assert.equal(staggerDelay(40), 480);
});

test('un indice invalido da 0', () => {
  assert.equal(staggerDelay(-2), 0);
  assert.equal(staggerDelay(Number.NaN), 0);
});
