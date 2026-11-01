import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { buildSheet } from '../scripts/contact-sheet.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
const pics = path.join(tmp, 'pics');

const png = (file, color) =>
  sharp({ create: { width: 64, height: 48, channels: 3, background: color } }).png().toFile(file);

before(async () => {
  fs.mkdirSync(path.join(pics, 'Firmas'), { recursive: true });
  fs.mkdirSync(path.join(pics, 'Logos'), { recursive: true });
  await png(path.join(pics, 'Logos', 'uno.png'), '#e10600');
  await png(path.join(pics, 'Logos', 'dos.png'), '#0066b1');
  await png(path.join(pics, 'Logos', 'tres.png'), '#10b981');
  await png(path.join(pics, 'Firmas', 'secreto.png'), '#000000');
  fs.writeFileSync(path.join(pics, 'Logos', 'notas.txt'), 'no es imagen');
  fs.writeFileSync(path.join(pics, 'Logos', 'roto.png'), 'esto no es un png');
});

const config = (source) => ({ title: 'Prueba', sections: [{ title: 'Uno', sources: [source] }] });

test('crea una tarjeta por imagen y una miniatura por cada imagen legible', async () => {
  const out = path.join(tmp, 'out1');
  const result = await buildSheet(config({ path: pics, recursive: true, extensions: ['png'], exclude: 'Firmas' }), out);
  assert.equal(result.cards, 4);
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.equal((html.match(/<figure data-card/g) ?? []).length, 4);
  for (const [, src] of html.matchAll(/<img[^>]*src="(thumbs\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(out, src)), `falta la miniatura ${src}`);
  }
});

test('las carpetas excluidas no aparecen en la hoja', async () => {
  const out = path.join(tmp, 'out2');
  await buildSheet(config({ path: pics, recursive: true, extensions: ['png'], exclude: 'Firmas' }), out);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /secreto|Firmas/);
});

test('solo entran las extensiones pedidas', async () => {
  const out = path.join(tmp, 'out3');
  await buildSheet(config({ path: pics, recursive: true, extensions: ['png'], exclude: 'Firmas' }), out);
  assert.doesNotMatch(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /notas\.txt/);
});

test('respeta el limite por origen', async () => {
  const out = path.join(tmp, 'out4');
  const result = await buildSheet(config({ path: path.join(pics, 'Logos'), extensions: ['png'], limit: 2 }), out);
  assert.equal(result.cards, 2);
});

test('una imagen ilegible se cuenta como fallida y no detiene la hoja', async () => {
  const out = path.join(tmp, 'out5');
  const result = await buildSheet(config({ path: path.join(pics, 'Logos'), extensions: ['png'] }), out);
  assert.equal(result.failed, 1);
  assert.equal(result.cards, 4);
  assert.match(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /roto\.png/);
});

test('un origen que no existe se reporta y no rompe', async () => {
  const out = path.join(tmp, 'out6');
  const result = await buildSheet(config({ path: path.join(tmp, 'no-existe'), extensions: ['png'] }), out);
  assert.equal(result.cards, 0);
  assert.deepEqual(result.missing, [path.join(tmp, 'no-existe')]);
});

test('la hoja guarda la eleccion en el navegador y permite descargarla', async () => {
  const out = path.join(tmp, 'out7');
  await buildSheet(config({ path: path.join(pics, 'Logos'), extensions: ['png'] }), out);
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.match(html, /localStorage/);
  assert.match(html, /seleccion\.json/);
  assert.match(html, /es mío/i);
});

test('un origen puede ser una lista de archivos y mostrar una nota por archivo', async () => {
  const out = path.join(tmp, 'out8');
  const uno = path.join(pics, 'Logos', 'uno.png');
  const dos = path.join(pics, 'Logos', 'dos.png');
  const result = await buildSheet(
    config({ label: 'Elegidas', files: [uno, dos], notes: { [uno]: '+2 parecidas: copia-a.png, copia-b.png' } }),
    out,
  );
  assert.equal(result.cards, 2);
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.match(html, /\+2 parecidas: copia-a\.png, copia-b\.png/);
  assert.match(html, /Elegidas/);
});

test('una lista de archivos ignora los que ya no existen', async () => {
  const out = path.join(tmp, 'out9');
  const result = await buildSheet(config({ files: [path.join(pics, 'Logos', 'uno.png'), path.join(tmp, 'ya-no-esta.png')] }), out);
  assert.equal(result.cards, 1);
});
