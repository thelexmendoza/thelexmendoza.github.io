import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkHtml } from '../scripts/check-html.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-html-'));
const write = (name, html) => {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, html);
  return file;
};

const good = `<!doctype html><html lang="es"><head><title>Hola</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Descripcion"></head>
<body><h1>Uno</h1><img src="a.png" alt="Una imagen"></body></html>`;

test('un HTML bien formado no tiene problemas', () => {
  assert.deepEqual(checkHtml(write('good.html', good)), []);
});

test('detecta idioma, titulo, h1 y alt faltantes o repetidos', () => {
  const bad = '<!doctype html><html><head></head><body><h1>A</h1><h1>B</h1><img src="a.png"></body></html>';
  const problems = checkHtml(write('bad.html', bad)).join('\n');
  assert.match(problems, /lang="es"/);
  assert.match(problems, /<title>/);
  assert.match(problems, /un solo h1/);
  assert.match(problems, /alt/);
});

test('detecta enlaces internos rotos y referencias a bootstrap', () => {
  const bad = good.replace('<h1>', '<link href="bootstrap.min.css"><a href="no-existe/">x</a><h1>');
  const problems = checkHtml(write('links.html', bad)).join('\n');
  assert.match(problems, /no-existe\//);
  assert.match(problems, /bootstrap/i);
});

test('un enlace rotado con aria-disabled y "Proximamente" se acepta', () => {
  const soon = good.replace('<h1>', '<a href="aun-no/" aria-disabled="true">Próximamente</a><h1>');
  assert.deepEqual(checkHtml(write('soon.html', soon)), []);
});

test('index.html no tiene problemas', () => {
  assert.deepEqual(checkHtml('index.html'), []);
});
