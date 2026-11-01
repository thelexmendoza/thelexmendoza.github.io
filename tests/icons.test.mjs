import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRID } from '../scripts/build-icons.mjs';

const read = (file) => fs.readFileSync(file);
const pngSize = (file) => {
  const data = read(file);
  assert.equal(data.subarray(1, 4).toString(), 'PNG', `${file} no es PNG`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

test('la cuadricula es de 20x20', () => {
  assert.equal(GRID.length, 20);
  for (const row of GRID) assert.equal(row.length, 20);
});

test('las orejas son puntiagudas: la punta mide 1 pixel y se ensancha hacia la base', () => {
  const ear = (row) => [...row].filter((c) => c === 'E' || c === 'e').length;
  assert.equal(ear(GRID[0].slice(0, 10)), 1, 'la punta debe ser de un pixel');
  assert.ok(ear(GRID[1].slice(0, 10)) > ear(GRID[0].slice(0, 10)), 'la oreja debe ensancharse');
  assert.equal(GRID[0], [...GRID[0]].reverse().join(''), 'la cuadricula debe ser simetrica');
});

test('el favicon SVG usa la cuadricula de 20 y la nariz roja', () => {
  const svg = read('assets/icons/favicon.svg').toString();
  assert.match(svg, /viewBox="0 0 20 20"/);
  assert.match(svg, /#e10600/i);
});

test('el .ico trae 16, 32 y 48 px', () => {
  const ico = read('assets/icons/favicon.ico');
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48]);
});

test('los PNG miden lo que dicen', () => {
  assert.deepEqual(pngSize('assets/icons/apple-touch-icon.png'), [180, 180]);
  assert.deepEqual(pngSize('assets/icons/icon-192.png'), [192, 192]);
  assert.deepEqual(pngSize('assets/icons/icon-512.png'), [512, 512]);
});

test('el manifest declara los iconos de 192 y 512', () => {
  const manifest = JSON.parse(read('site.webmanifest').toString());
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(manifest.theme_color && manifest.name);
});

test('la home enlaza favicon, icono de iPhone y manifest', () => {
  const html = read('index.html').toString();
  assert.match(html, /rel="icon"[^>]*favicon\.svg/);
  assert.match(html, /rel="icon"[^>]*favicon\.ico/);
  assert.match(html, /rel="apple-touch-icon"[^>]*apple-touch-icon\.png/);
  assert.match(html, /rel="manifest"[^>]*site\.webmanifest/);
});

test('los pomulos se distinguen: una zona iluminada con sombra justo debajo', () => {
  const cols = (row, ch) => [...row].map((c, i) => (c === ch ? i : -1)).filter((i) => i >= 0);
  const lit = GRID.findIndex((row) => row.includes('H'));
  const eyes = GRID.findIndex((row) => row.includes('K'));
  assert.ok(lit > eyes, 'el pomulo va debajo de los ojos');
  const below = GRID[lit + 1];
  assert.ok(cols(GRID[lit], 'H').some((i) => below[i] === 'S'), 'debe haber sombra bajo el pomulo');
});

test('toda la cuadricula es simetrica', () => {
  for (const row of GRID) assert.equal(row, [...row].reverse().join(''));
});

test('la frente no es un bloque liso: tiene un surco central y los ojos son cunas de varios pixeles', () => {
  assert.ok(GRID.some((row) => row.slice(9, 11) === 'ww'), 'falta el surco central de la frente');
  const eyeRow = GRID.find((row) => row.includes('KKKK'));
  assert.ok(eyeRow, 'el ojo debe medir al menos 4 pixeles de ancho en su fila mas ancha');
});

test('las orejas miden al menos 4 filas de alto', () => {
  const rows = GRID.filter((row) => /[Ee]/.test(row.slice(0, 4)));
  assert.ok(rows.length >= 4, 'orejas demasiado bajas');
});

test('hay un favicon.ico en la raiz, que es donde los navegadores lo piden por defecto', () => {
  assert.ok(fs.existsSync('favicon.ico'), 'falta favicon.ico en la raiz');
  assert.deepEqual(read('favicon.ico'), read('assets/icons/favicon.ico'));
});

test('el enlace del favicon SVG declara sizes="any" para que Chrome lo prefiera sobre el .ico', () => {
  const html = read('index.html').toString();
  assert.match(html, /rel="icon"[^>]*favicon\.svg[^>]*sizes="any"/);
});

test('el servidor local entrega el .ico y el manifest con su tipo correcto', () => {
  const serve = read('scripts/serve.mjs').toString();
  assert.match(serve, /'\.ico':\s*'image\/x-icon'/);
  assert.match(serve, /'\.webmanifest':\s*'application\/manifest\+json/);
});
