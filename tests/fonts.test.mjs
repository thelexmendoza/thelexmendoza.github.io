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

test('cada familia tiene un respaldo con las medidas de Plex, para que el texto no se reacomode al llegar la fuente', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  for (const [family, base] of [['IBM Plex Sans Fallback', 'Arial'], ['IBM Plex Sans Condensed Fallback', 'Arial'], ['IBM Plex Mono Fallback', 'Courier New']]) {
    const face = scss.match(new RegExp(`@font-face \{[^}]*font-family: "${family}";[^}]*\}`))?.[0] ?? '';
    assert.ok(face, `falta ${family}`);
    assert.ok(face.includes(`src: local("${base}");`), `${family} debe usar ${base}`);
    for (const prop of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) assert.match(face, new RegExp(`${prop}: [0-9.]+%`), `${family} sin ${prop}`);
  }
});

test('las pilas ponen el respaldo con medidas justo despues de Plex', () => {
  const scss = fs.readFileSync(scssPath, 'utf8');
  assert.match(scss, /\$font-sans: "IBM Plex Sans", "IBM Plex Sans Fallback",/);
  assert.match(scss, /\$font-condensed: "IBM Plex Sans Condensed", "IBM Plex Sans Condensed Fallback",/);
  assert.match(scss, /\$font-mono: "IBM Plex Mono", "IBM Plex Mono Fallback",/);
});

test('el home y los casos precargan las cuatro caras que se usan arriba del pliegue', async () => {
  const { renderCase } = await import('../scripts/render-case.mjs');
  const faces = ['ibm-plex-sans-latin-300-normal', 'ibm-plex-sans-condensed-latin-700-normal', 'ibm-plex-mono-latin-300-normal', 'ibm-plex-mono-latin-500-normal'];
  const home = fs.readFileSync('index.html', 'utf8');
  const page = renderCase({ slug: 'x', key: 'valtre', title: 'X', eyebrow: 'x', meta: 'x', summary: 'x', teaser: { chapter: 'a', text: 'x' }, chapters: [{ id: 'a', title: 'A', eyebrow: 'a', text: ['t'], groups: [] }] });
  for (const [html, prefix] of [[home, ''], [page, '../../']]) {
    for (const face of faces) {
      assert.ok(html.includes(`<link rel="preload" href="${prefix}assets/fonts/plex/${face}.woff2" as="font" type="font/woff2" crossorigin>`), `${prefix || 'home'}: falta precargar ${face}`);
      assert.ok(fs.existsSync(`assets/fonts/plex/${face}.woff2`));
    }
  }
});
