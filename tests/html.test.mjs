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

test('un enlace "Proximamente" con href se reporta: llevaria a un 404', () => {
  const soon = good.replace('<h1>', '<a href="aun-no/" aria-disabled="true">Próximamente</a><h1>');
  assert.match(checkHtml(write('soon.html', soon)).join(' | '), /deshabilitado/);
});

test('un enlace "Proximamente" sin href se acepta', () => {
  const soon = good.replace('<h1>', '<a data-soon="aun-no/" aria-disabled="true">Próximamente</a><h1>');
  assert.deepEqual(checkHtml(write('soon-ok.html', soon)), []);
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

test('la home enlaza los seis casos y el plan (con href o declarados como proximos)', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const dest of ['casos/valtre/', 'casos/ciisa-web/', 'casos/bmw-mini/', 'casos/daniel-abrego/', 'casos/etics-live/', 'casos/motociclismo/', 'plan/']) {
    assert.ok(html.includes(`href="${dest}"`) || html.includes(`data-soon="${dest}"`), `falta ${dest}`);
  }
});

test('el enlace de saltar al contenido usa la variante con foco visible', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /class="u-visually-hidden u-visually-hidden--focusable" href="#contenido"/);
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

test('cada seccion tiene un comentario que complementa el titulo, sin numeracion', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const comments = ['Diseño + web', 'elige una, o las dos', 'trabajo real, con clientes reales', 'sin compromiso, a tu ritmo', 'la versión corta', 'WhatsApp o correo, como prefieras'];
  for (const text of comments) {
    assert.ok(html.includes('// ' + text + '<'), 'falta el comentario "// ' + text + '"');
  }
  assert.doesNotMatch(html, /[/][/] 0[0-9]/, 'los comentarios no llevan numeracion');
  for (const redundant of ['// servicios<', '// casos<', '// plan<', '// sobre mí<', '// contacto<']) {
    assert.ok(!html.includes(redundant), 'el comentario repite el titulo: ' + redundant);
  }
});

test('el texto de sobre mi dice que le gusta reirse de lo simple y sencillo', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('reírme de lo simple y sencillo'));
  assert.ok(!html.includes('reírme de mí mismo'));
});

test('cada tarjeta de caso tiene barra con el archivo, titulo, texto y su etiqueta de estado', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const file of ['ciisa-psw.caso', 'valtre.caso', 'bmw-mini.caso', 'daniel-abrego.caso', 'etics-live.caso', 'motociclismo.caso']) {
    assert.ok(html.includes(`>${file}<`), `falta la barra con ${file}`);
  }
  assert.equal((html.match(/class="c-case-card__line/g) ?? []).length, 12);
  assert.equal((html.match(/class="c-case-card__soon"/g) ?? []).length, 6);
});

test('el riel de secciones enlaza las seis secciones en orden', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const rail = html.match(/<nav class="c-rail"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const hrefs = [...rail.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ['inicio', 'servicios', 'casos', 'plan', 'sobre-mi', 'contacto']);
});

test('el script de la cabecera marca has-js y tiene respaldo para mostrar todo', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /classList\.add\('has-js'\)/);
  assert.match(html, /reveal-all/);
  assert.match(html, /__revealReady/);
});

test('las tarjetas y los titulos se revelan al entrar en pantalla', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok((html.match(/data-reveal="card"/g) ?? []).length >= 6, 'faltan tarjetas con data-reveal');
  assert.ok((html.match(/data-reveal="title"/g) ?? []).length >= 4, 'faltan titulos con data-reveal');
});

test('el hero tiene una capa decorativa de puntos, sin columna de numeros', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /class="c-hero__backdrop" aria-hidden="true"/);
  assert.match(html, /class="c-hero__grid"/);
  assert.doesNotMatch(html, /c-hero__lines/, 'la columna de numeros del hero ya no existe');
});

test('el leon es solo un icono pequeno: nunca se usa como imagen en la pagina', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /<img[^>]*icons[/]/, 'el leon no debe aparecer como imagen dentro de la pagina');
  assert.doesNotMatch(html, /c-hero__mark/);
  const css = fs.readFileSync('assets/css/main.min.css', 'utf8');
  assert.doesNotMatch(css, /c-hero__mark/, 'no debe quedar estilo de una marca grande');
  assert.doesNotMatch(css, /icons[/]/, 'el CSS no debe cargar el icono del leon como fondo');
});

test('las tarjetas no llevan numerales de linea', () => {
  const css = fs.readFileSync('assets/css/main.min.css', 'utf8');
  assert.doesNotMatch(css, /counter(line)/);
  assert.doesNotMatch(css, /counter-increment:s*line/);
});
