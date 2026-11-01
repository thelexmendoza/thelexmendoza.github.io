import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { findIcons, iconKey } from '../scripts/find-icons.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-'));
const dir = (...p) => path.join(tmp, ...p);
const svg = (shape) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">${shape}</svg>`;
const raster = (w, h, { alpha = true, color = '#38bdf8' } = {}) =>
  sharp({ create: { width: w, height: h, channels: alpha ? 4 : 3, background: alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : color } })
    .composite(alpha ? [{ input: { create: { width: Math.round(w / 2), height: Math.round(h / 2), channels: 3, background: color } }, left: 0, top: 0 }] : [])
    .png();

before(async () => {
  fs.mkdirSync(dir('CoE - Datos'), { recursive: true });
  fs.mkdirSync(dir('CoE - Redes'), { recursive: true });
  fs.mkdirSync(dir('Types'), { recursive: true });
  fs.writeFileSync(dir('CoE - Datos', 'icono-a.svg'), svg('<circle cx="12" cy="12" r="8"/>'));
  await raster(128, 128).toFile(dir('CoE - Datos', 'icono-a.png'));
  fs.writeFileSync(dir('CoE - Datos', 'z-copia.svg'), svg('<circle cx="12" cy="12" r="8"/>'));
  await raster(96, 96).toFile(dir('CoE - Datos', 'icono-b@2x.png'));
  await raster(144, 144, { color: '#e10600' }).toFile(dir('CoE - Datos', 'icono-b@3x.png'));
  await raster(64, 64, { alpha: false }).toFile(dir('CoE - Datos', 'chiquito-opaco.png'));
  await sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#335577' } }).jpeg().toFile(dir('CoE - Datos', 'foto.jpg'));
  await raster(400, 300, { alpha: false }).toFile(dir('CoE - Datos', 'diagrama.png'));
  await raster(1000, 1000).toFile(dir('CoE - Datos', 'logo-grande.png'));
  fs.writeFileSync(dir('CoE - Datos', 'pesado.svg'), svg('<rect width="24" height="24"/>') + '<!--' + 'x'.repeat(50 * 1024) + '-->');
  fs.writeFileSync(dir('CoE - Datos', 'roto.png'), 'no es una imagen');
  await raster(300, 90).toFile(dir('CoE - Datos', 'etiqueta-ancha.png'));
  fs.writeFileSync(dir('CoE - Redes', 'nodo.svg'), svg('<rect x="4" y="4" width="16" height="16"/>'));
  fs.writeFileSync(dir('Types', 'fuente.svg'), svg('<path d="M0 0h24v24H0z"/>'));
});

const sources = () => [
  { path: dir('CoE - Datos'), topic: 'Datos' },
  { path: dir('CoE - Redes'), topic: 'Redes' },
];
const names = (group) => group.files.map((f) => path.basename(f)).sort();

test('la clave del icono ignora tamano, @2x, extension y mayusculas', () => {
  assert.equal(iconKey('/x/Icono-Nube@2x.png'), 'icono-nube');
  assert.equal(iconKey('/x/ICONO NUBE.svg'), 'icono-nube');
  assert.equal(iconKey('/x/icono-nube_48px.png'), 'icono-nube');
  assert.equal(iconKey('/x/icono-nube-32.svg'), 'icono-nube');
});

test('de un mismo icono se queda el SVG y no el PNG', async () => {
  const [datos] = await findIcons(sources());
  assert.ok(names(datos).includes('icono-a.svg'));
  assert.ok(!names(datos).includes('icono-a.png'));
});

test('entre PNG del mismo icono se queda el mas grande', async () => {
  const [datos] = await findIcons(sources());
  assert.ok(names(datos).includes('icono-b@3x.png'));
  assert.ok(!names(datos).includes('icono-b@2x.png'));
});

test('una copia con otro nombre y el mismo contenido se publica una sola vez', async () => {
  const [datos] = await findIcons(sources());
  assert.ok(!(names(datos).includes('z-copia.svg') && names(datos).includes('icono-a.svg')));
});

test('las fotos, los diagramas y los logos grandes no son iconos', async () => {
  const [datos] = await findIcons(sources());
  for (const nombre of ['foto.jpg', 'diagrama.png', 'logo-grande.png']) assert.ok(!names(datos).includes(nombre), nombre);
});

test('un PNG chiquito sin transparencia si cuenta como icono', async () => {
  const [datos] = await findIcons(sources());
  assert.ok(names(datos).includes('chiquito-opaco.png'));
});

test('un SVG pesado o un archivo roto se descartan sin romper nada', async () => {
  const [datos] = await findIcons(sources());
  assert.ok(!names(datos).includes('pesado.svg'));
  assert.ok(!names(datos).includes('roto.png'));
});

test('los grupos salen en el orden de los origenes y con su tema', async () => {
  const groups = await findIcons(sources());
  assert.deepEqual(groups.map((g) => g.topic), ['Datos', 'Redes']);
  assert.deepEqual(names(groups[1]), ['nodo.svg']);
});

test('un icono repetido en otro origen solo aparece en el primero', async () => {
  fs.copyFileSync(dir('CoE - Datos', 'icono-a.svg'), dir('CoE - Redes', 'icono-a.svg'));
  const groups = await findIcons(sources());
  assert.ok(names(groups[0]).includes('icono-a.svg'));
  assert.ok(!names(groups[1]).includes('icono-a.svg'));
  fs.rmSync(dir('CoE - Redes', 'icono-a.svg'));
});

test('las carpetas excluidas no se recorren', async () => {
  const groups = await findIcons([{ path: tmp, topic: 'Todo', exclude: 'Types|Redes' }]);
  assert.ok(!names(groups[0]).includes('fuente.svg'));
  assert.ok(!names(groups[0]).includes('nodo.svg'));
  assert.ok(names(groups[0]).includes('icono-a.svg'));
});

test('un origen que no existe devuelve un grupo vacio', async () => {
  const [group] = await findIcons([{ path: dir('no-existe'), topic: 'Nada' }]);
  assert.deepEqual(group.files, []);
});

test('una pieza muy ancha (etiqueta de texto, wordmark) no es un icono salvo que se permita', async () => {
  const [normal] = await findIcons([{ path: dir('CoE - Datos'), topic: 'Datos' }]);
  assert.ok(!names(normal).includes('etiqueta-ancha.png'));
  const [permitido] = await findIcons([{ path: dir('CoE - Datos'), topic: 'Datos', maxAspect: Infinity }]);
  assert.ok(names(permitido).includes('etiqueta-ancha.png'));
});

test('el patron de exclusion funciona igual con barras de Windows y de Linux', async () => {
  const [group] = await findIcons([{ path: tmp, topic: 'Todo', exclude: '[\\/]Types[\\/]|/CoE - Redes/' }]);
  assert.ok(!names(group).includes('fuente.svg'));
  assert.ok(!names(group).includes('nodo.svg'));
  const [conBarra] = await findIcons([{ path: tmp, topic: 'Todo', exclude: '/Types/' }]);
  assert.ok(!names(conBarra).includes('fuente.svg'), 'un patron con "/" debe excluir tambien en Windows');
});
