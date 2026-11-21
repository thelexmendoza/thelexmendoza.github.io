import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Enlaces cortos (lexmendoza.com/wa, /ig, /r/ig-promo-549, etc.): páginas de redirección que genera el repo maquetador-redes y que se
// aplican con private/content/lex/aplicar-enlaces.mjs a partir de docs/enlaces/plantilla-redireccion.html. GitHub Pages no tiene
// redirecciones de servidor, así que cada enlace es una carpeta con un index.html. Si una prueba falla aquí, el enlace dejó de funcionar
// o se podría indexar.

const PLANTILLA = fs.readFileSync('docs/enlaces/plantilla-redireccion.html', 'utf8');

function paginas(dir = '.') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'private', 'docs', 'assets', 'src', 'tests', 'scripts', 'content', 'data'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...paginas(p));
    else if (e.name === 'index.html' && fs.readFileSync(p, 'utf8').includes('name="enlace-corto"')) out.push(p);
  }
  return out;
}

const todas = paginas();

test('la plantilla conserva los marcadores y todo lo que hace funcionar el enlace', () => {
  for (const marca of ['{{DESTINO}}', '{{DESTINO_JS}}', '{{CANONICO}}']) assert.ok(PLANTILLA.includes(marca), `falta ${marca}`);
  assert.match(PLANTILLA, /<meta name="enlace-corto" content="1">/);
  assert.match(PLANTILLA, /<meta name="robots" content="noindex">/);
  assert.match(PLANTILLA, /<meta http-equiv="refresh" content="0;url=\{\{DESTINO\}\}">/);
  assert.match(PLANTILLA, /location\.replace\(\{\{DESTINO_JS\}\}\)/);
  assert.match(PLANTILLA, /<link rel="canonical" href="\{\{CANONICO\}\}">/);
});

test('la plantilla no carga scripts, aviso de cookies ni medición del sitio y respeta menos movimiento', () => {
  assert.doesNotMatch(PLANTILLA, /<script[^>]*\ssrc=/, 'ningún script externo');
  assert.doesNotMatch(PLANTILLA, /tagorq|tag-orquestador|fbq|gtag|main\.js|instrumento/);
  assert.doesNotMatch(PLANTILLA, /localStorage|sessionStorage|document\.cookie/);
  assert.match(PLANTILLA, /prefers-reduced-motion: no-preference/);
  assert.match(PLANTILLA, /prefers-color-scheme: dark/);
});

test('hay enlaces cortos publicados y los cinco manuales existen', () => {
  assert.ok(todas.length >= 5, `solo hay ${todas.length} enlaces cortos`);
  for (const ruta of ['wa', 'ig', 'fb', 'in', 'guia']) assert.ok(fs.existsSync(`${ruta}/index.html`), `falta /${ruta}`);
});

test('cada enlace corto redirige de dos formas a una página de lexmendoza.com, no se indexa y su canonical va sin etiquetas', () => {
  for (const file of todas) {
    const html = fs.readFileSync(file, 'utf8');
    const refresh = html.match(/<meta http-equiv="refresh" content="0;url=([^"]+)">/)?.[1];
    const js = html.match(/location\.replace\(("[^"]+")\)/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.ok(refresh && js && canonical, `${file}: faltan refresh, location.replace o canonical`);
    assert.match(html, /<meta name="robots" content="noindex">/, `${file}: debe llevar noindex`);
    const destino = new URL(refresh.replaceAll('&amp;', '&'));
    assert.equal(destino.origin, 'https://lexmendoza.com', `${file}: el destino debe ser de lexmendoza.com`);
    assert.equal(JSON.parse(js), destino.href, `${file}: el meta refresh y location.replace deben ir al mismo lugar`);
    assert.ok(destino.searchParams.get('utm_source') && destino.searchParams.get('utm_campaign'), `${file}: el destino lleva utm_source y utm_campaign`);
    const c = new URL(canonical);
    assert.equal(c.search, '', `${file}: el canonical va sin etiquetas`);
    assert.equal(c.pathname, destino.pathname, `${file}: el canonical es la misma página que el destino`);
    assert.doesNotMatch(html, /<script[^>]*\ssrc=/, `${file}: no carga scripts del sitio`);
  }
});

test('los enlaces cortos no entran al sitemap ni se bloquean en robots.txt (necesitan que se lea su noindex)', () => {
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  for (const file of todas) {
    const ruta = '/' + path.dirname(file).split(path.sep).join('/') + '/';
    assert.ok(!sitemap.includes(`<loc>https://lexmendoza.com${ruta}</loc>`), `${ruta} no debe estar en el sitemap`);
  }
  assert.doesNotMatch(fs.readFileSync('robots.txt', 'utf8'), /Disallow:\s*\/(r|wa|ig|fb|in|guia)\b/);
});

test('los enlaces cortos no chocan con las carpetas del sitio', () => {
  const del_sitio = ['assets', 'blog', 'casos', 'content', 'cookies', 'data', 'docs', 'guia-dominio-hosting', 'privacidad', 'promo', 'scripts', 'src', 'tests'];
  for (const file of todas) assert.ok(!del_sitio.includes(file.split(path.sep)[0]), `${file} cae dentro de una carpeta del sitio`);
});
