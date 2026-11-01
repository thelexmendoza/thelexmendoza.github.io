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

test('un enlace a un ancla inexistente se reporta', () => {
  const bad = good.replace('<h1>', '<a href="#nada">x</a><h1>');
  assert.match(checkHtml(write('anchor.html', bad)).join('\n'), /#nada/);
});

test('un enlace a un ancla existente se acepta', () => {
  const ok = good.replace('<h1>', '<a href="#aqui">x</a><h1 id="aqui">');
  assert.deepEqual(checkHtml(write('anchor-ok.html', ok)), []);
});

test('la home enlaza los seis casos y el plan', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const href of ['casos/valtre/', 'casos/ciisa-web/', 'casos/bmw-mini/', 'casos/daniel-abrego/', 'casos/etics-live/', 'casos/motociclismo/', 'plan/']) {
    assert.ok(html.includes(`href="${href}"`), `falta el enlace a ${href}`);
  }
});

test('cada tarjeta de caso declara su paleta con data-case', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const name of ['valtre', 'ciisa', 'bmw', 'daniel', 'etics', 'moto']) {
    assert.ok(html.includes(`data-case="${name}"`), `falta data-case="${name}"`);
  }
});

test('el contacto usa el WhatsApp y el correo de Lex', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /href="https:\/\/wa\.me\/528129043592/);
  assert.match(html, /href="mailto:lex\.mendozaleon@gmail\.com"/);
});

test('la home no contiene precios', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /\$\s?\d/);
});
