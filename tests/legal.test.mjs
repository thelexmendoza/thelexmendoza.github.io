import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkHtml } from '../scripts/check-html.mjs';
import { PAGES, renderLegal } from '../scripts/render-legal.mjs';

const leer = (f) => fs.readFileSync(f, 'utf8');
const sitio = ['index.html', ...fs.readdirSync('casos').map((d) => `casos/${d}/index.html`)];

test('las páginas legales publicadas coinciden con lo que genera el script (no se editan a mano)', () => {
  for (const p of PAGES) assert.equal(leer(`${p.slug}/index.html`), renderLegal(p), `${p.slug}/ está desactualizada: corre npm run legal`);
});

test('las páginas legales no tienen problemas de HTML ni enlaces rotos', () => {
  for (const p of PAGES) assert.deepEqual(checkHtml(`${p.slug}/index.html`), [], p.slug);
});

test('no se publica ningún texto de borrador: sin huecos entre corchetes ni notas de verificación', () => {
  for (const p of PAGES) {
    const html = leer(`${p.slug}/index.html`);
    assert.doesNotMatch(html, /\[[A-ZÁÉÍÓÚ][^\]]{3,}\]/, `${p.slug}: hueco por llenar`);
    assert.doesNotMatch(html, /VERIFICAR|BORRADOR PARA|CONFIRMAR CON TU|PLAZO.|SI AGREGAS/, `${p.slug}: nota de borrador`);
  }
});

test('el aviso trae lo que la ley espera: responsable, domicilio, datos, finalidades, derechos ARCO, proveedores y autoridad', () => {
  const html = leer('privacidad/index.html');
  for (const frase of ['Manuel Alejandro Mendoza León', 'Fresnos 931', 'San Nicolás de los Garza', '66495', 'lex.mendozaleon@gmail.com', 'Finalidades necesarias', 'Finalidades voluntarias', 'acceso, rectificación, cancelación y oposición', '20 días hábiles', 'Supabase', 'Cloudflare', 'Secretaría Anticorrupción y Buen Gobierno', 'no emito facturas', 'comprobante']) {
    assert.ok(html.includes(frase), `falta «${frase}»`);
  }
});

test('el RFC no aparece en ninguna página pública', () => {
  for (const f of [...sitio, 'privacidad/index.html', 'cookies/index.html']) assert.doesNotMatch(leer(f), /MELM\d{6}/i, f);
});

test('la política de cookies describe exactamente lo que el sitio y el formulario guardan', () => {
  const html = leer('cookies/index.html');
  assert.ok(html.includes('<code>theme</code>'));
  assert.ok(html.includes('landing-express-borrador'));
  // El sitio de verdad solo escribe estas claves de almacenamiento (si aparece otra, la política debe actualizarse).
  const codigo = ['assets/js/main.js', 'assets/js/theme.js'].map(leer).join('\n');
  const claves = [...codigo.matchAll(/(?:setItem|getItem)\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const clave of new Set(claves)) assert.ok(html.includes(`<code>${clave}</code>`), `la política no menciona la clave «${clave}»`);
  assert.doesNotMatch(codigo, /document\.cookie\s*=/, 'el sitio no debe escribir cookies sin actualizar la política');
});

test('el pie de toda página enlaza el aviso y las cookies, y ya no dice «Próximamente»', () => {
  for (const f of [...sitio, 'privacidad/index.html', 'cookies/index.html']) {
    const html = leer(f);
    assert.match(html, /href="[^"]*privacidad\/"/, `${f}: falta el aviso`);
    assert.match(html, /href="[^"]*cookies\/"/, `${f}: falta cookies`);
    assert.doesNotMatch(html, /data-soon="[^"]*privacidad\//, `${f}: el aviso sigue como próximamente`);
  }
});

test('las páginas legales siguen las reglas de navegación del sitio: expect, precargas y speculation rules', () => {
  const imports = [...leer('assets/js/main.js').matchAll(/from '\.\/([a-z-]+\.js)'/g)].map((m) => m[1]);
  for (const p of PAGES) {
    const html = leer(`${p.slug}/index.html`);
    assert.match(html, /<link rel="expect" href="#contenido" blocking="render">/);
    assert.match(html, /<main id="contenido"/);
    assert.match(html, /speculationrules/);
    for (const m of imports) assert.ok(html.includes(`<link rel="modulepreload" href="../assets/js/${m}">`), `${p.slug}: falta precargar ${m}`);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  }
});

test('las páginas legales no usan el león ni imágenes grandes (el león es solo el favicon)', () => {
  for (const p of PAGES) assert.doesNotMatch(leer(`${p.slug}/index.html`), /<img\b/i);
});
