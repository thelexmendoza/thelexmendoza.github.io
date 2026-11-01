import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { clusterImages } from '../scripts/dedupe.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dedupe-'));
const f = (name) => path.join(tmp, name);

// Dos "fotos" distintas hechas con formas, y dos iconos pequenos distintos.
const scene = (shapes) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#203040"/>${shapes}</svg>`,
  );
const sceneA = scene('<circle cx="250" cy="200" r="150" fill="#e0e0e0"/><rect x="450" y="300" width="300" height="250" fill="#101010"/>');
const sceneB = scene('<rect x="50" y="50" width="700" height="120" fill="#f0f0f0"/><circle cx="600" cy="450" r="100" fill="#050505"/><rect x="60" y="300" width="200" height="250" fill="#aaaaaa"/>');
// Misma plantilla con contenido distinto (como las one-pages de cada area) y mismo diseno en otro color.
const sceneAContenido = scene('<circle cx="250" cy="200" r="150" fill="#e0e0e0"/><rect x="450" y="300" width="300" height="250" fill="#101010"/><rect x="60" y="400" width="320" height="140" fill="#f4f4f4"/>');
const sceneAColor = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#3a3a20"/><circle cx="250" cy="200" r="150" fill="#e0e0c0"/><rect x="450" y="300" width="300" height="250" fill="#101010"/></svg>',
);
const icon = (shape) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">${shape}</svg>`);

before(async () => {
  await sharp(sceneA).png().toFile(f('a.png'));
  fs.copyFileSync(f('a.png'), f('a-copia.png'));
  await sharp(sceneA).resize(400, 300).png().toFile(f('a-pequena.png'));
  await sharp(sceneA).jpeg({ quality: 60 }).toFile(f('a-comprimida.jpg'));
  await sharp(sceneB).png().toFile(f('b.png'));
  await sharp(sceneAContenido).png().toFile(f('a-otro-contenido.png'));
  await sharp(sceneAColor).png().toFile(f('a-otro-color.png'));
  await sharp(icon('<circle cx="12" cy="12" r="8" fill="#000"/>')).png().toFile(f('icono-1.png'));
  fs.copyFileSync(f('icono-1.png'), f('icono-1-copia.png'));
  await sharp(icon('<rect x="4" y="4" width="16" height="16" fill="#000"/>')).png().toFile(f('icono-2.png'));
});

const names = (cluster) => [cluster.representative, ...cluster.variants].map((file) => path.basename(file)).sort();

test('una copia exacta cae en el mismo grupo', async () => {
  const clusters = await clusterImages([f('a.png'), f('a-copia.png'), f('b.png')]);
  const group = clusters.find((c) => names(c).includes('a.png'));
  assert.deepEqual(names(group), ['a-copia.png', 'a.png']);
});

test('la misma imagen reducida o comprimida cae en el mismo grupo', async () => {
  const clusters = await clusterImages([f('a.png'), f('a-pequena.png'), f('a-comprimida.jpg'), f('b.png')]);
  const group = clusters.find((c) => names(c).includes('a.png'));
  assert.deepEqual(names(group), ['a-comprimida.jpg', 'a-pequena.png', 'a.png']);
});

test('una imagen distinta queda sola', async () => {
  const clusters = await clusterImages([f('a.png'), f('a-pequena.png'), f('b.png')]);
  const alone = clusters.find((c) => names(c).includes('b.png'));
  assert.deepEqual(names(alone), ['b.png']);
});

test('la representante es la de mayor resolucion', async () => {
  const clusters = await clusterImages([f('a-pequena.png'), f('a.png'), f('a-comprimida.jpg')]);
  assert.equal(path.basename(clusters[0].representative), 'a.png');
});

test('los iconos pequenos distintos no se confunden entre si', async () => {
  const clusters = await clusterImages([f('icono-1.png'), f('icono-2.png')]);
  assert.equal(clusters.length, 2);
});

test('los iconos pequenos solo se agrupan si son copias exactas', async () => {
  const clusters = await clusterImages([f('icono-1.png'), f('icono-1-copia.png'), f('icono-2.png')]);
  assert.equal(clusters.length, 2);
  const group = clusters.find((c) => names(c).includes('icono-1.png'));
  assert.deepEqual(names(group), ['icono-1-copia.png', 'icono-1.png']);
});

test('un archivo ilegible no detiene el proceso y queda solo', async () => {
  fs.writeFileSync(f('roto.png'), 'no es una imagen');
  const clusters = await clusterImages([f('a.png'), f('roto.png')]);
  assert.equal(clusters.length, 2);
});

test('la misma plantilla con contenido distinto no se agrupa', async () => {
  const clusters = await clusterImages([f('a.png'), f('a-otro-contenido.png')]);
  assert.equal(clusters.length, 2);
});

test('el mismo diseno en otro color no se agrupa', async () => {
  const clusters = await clusterImages([f('a.png'), f('a-otro-color.png')]);
  assert.equal(clusters.length, 2);
});
