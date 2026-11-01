import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const scssPath = 'src/scss/0-settings/_fonts.scss';
const cssDir = 'assets/css';

test('cada url() de _fonts.scss apunta a un archivo existente', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  const urls = [...scss.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'no hay ningun url()');
  for (const url of urls) {
    const file = path.resolve(cssDir, url);
    assert.ok(fs.existsSync(file), `no existe ${url}`);
  }
});

test('declara las cuatro familias', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  for (const family of ['IBM Plex Sans', 'IBM Plex Sans Condensed', 'IBM Plex Serif', 'IBM Plex Mono']) {
    assert.ok(scss.includes(`font-family: "${family}"`), `falta ${family}`);
  }
});

test('declara pesos 100 a 700 en normal e italica', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  for (const weight of [100, 200, 300, 400, 500, 600, 700]) {
    assert.ok(scss.includes(`font-weight: ${weight};`), `falta el peso ${weight}`);
  }
  assert.ok(scss.includes('font-style: italic;'), 'faltan cursivas');
});

test('define las pilas de respaldo', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  for (const name of ['$font-sans', '$font-condensed', '$font-serif', '$font-mono']) {
    assert.ok(scss.includes(`${name}:`), `falta ${name}`);
  }
});
