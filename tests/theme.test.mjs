import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, readStoredTheme, saveTheme, nextTheme } from '../assets/js/theme.js';

const throwingStorage = {
  getItem() {
    throw new Error('bloqueado');
  },
  setItem() {
    throw new Error('bloqueado');
  },
};

test('el guardado manda sobre el sistema', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('sin guardado sigue al sistema', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
});

test('un valor guardado invalido se ignora', () => {
  assert.equal(resolveTheme('banana', true), 'dark');
  assert.equal(resolveTheme('', false), 'light');
});

test('readStoredTheme no lanza si el storage lanza y devuelve null', () => {
  assert.equal(readStoredTheme(throwingStorage), null);
});

test('readStoredTheme devuelve null si storage es undefined', () => {
  assert.equal(readStoredTheme(undefined), null);
});

test('readStoredTheme lee el valor guardado', () => {
  const storage = { getItem: (key) => (key === 'theme' ? 'dark' : null) };
  assert.equal(readStoredTheme(storage), 'dark');
});

test('saveTheme no lanza si storage es undefined o falla', () => {
  assert.doesNotThrow(() => saveTheme(undefined, 'dark'));
  assert.doesNotThrow(() => saveTheme(throwingStorage, 'dark'));
});

test('saveTheme guarda bajo la clave theme', () => {
  const saved = {};
  saveTheme({ setItem: (key, value) => (saved[key] = value) }, 'light');
  assert.deepEqual(saved, { theme: 'light' });
});

test('nextTheme alterna entre claro y oscuro', () => {
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('light'), 'dark');
});
