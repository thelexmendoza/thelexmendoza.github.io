import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderGuia, minutosDeLectura } from '../scripts/render-guia.mjs';
import { guia } from '../scripts/guia/guia.mjs';

const html = fs.readFileSync('guia-dominio-hosting/index.html', 'utf8');

test('guia-dominio-hosting/index.html coincide con lo que genera el script (no se edita a mano): corre npm run guia', () => {
  assert.equal(html, renderGuia(guia));
});

test('la guia no se indexa, tiene un solo h1 y ocho capitulos con su indice', () => {
  assert.match(html, /name="robots" content="noindex"/);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.equal(guia.capitulos.length, 8);
  for (const c of guia.capitulos) {
    assert.ok(html.includes(`id="${c.id}"`), `falta el capitulo ${c.id}`);
    assert.ok(html.includes(`href="#${c.id}"`), `el indice no enlaza a ${c.id}`);
    assert.ok(html.includes(`id="${c.id}-titulo"`), `${c.id}: el titulo no esta ligado a la seccion`);
  }
  assert.equal((html.match(/class="c-guia__encorto"/g) ?? []).length, 8, 'cada capitulo lleva su «En corto»');
});

test('todo enlace a una ancla de la pagina apunta a algo que existe', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, ancla] of html.matchAll(/href="#([^"]+)"/g)) {
    if (ancla) assert.ok(ids.has(ancla), `ancla rota: #${ancla}`);
  }
});

test('es una guia sin precios, sin medicion y sin enlace de preferencias de cookies (no hay nada que reabrir)', () => {
  const cuerpo = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.doesNotMatch(cuerpo, /\$\s?\d/, 'la guia no lleva cifras de precio');
  assert.doesNotMatch(html, /tagorq|tag-orquestador|fbq\(|connect\.facebook|googletagmanager/i);
  assert.ok(!html.includes('data-tagorq-prefs'));
  assert.ok(html.includes('privacidad/') && html.includes('cookies/'), 'el pie conserva el aviso de privacidad y la politica de cookies');
});

test('los enlaces que salen del sitio abren en otra pestana sin dar acceso a la pagina y el WhatsApp lleva un mensaje ya escrito', () => {
  const cuerpo = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  let externos = 0;
  for (const [tag] of cuerpo.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
    const host = new URL(tag.match(/href="([^"]+)"/)[1]).hostname;
    if (host === 'lexmendoza.com' || host.endsWith('.lexmendoza.com')) continue;
    externos += 1;
    assert.match(tag, /target="_blank"/, `falta target=_blank en ${tag}`);
    assert.match(tag, /rel="noopener noreferrer"/, `falta rel=noopener noreferrer en ${tag}`);
  }
  assert.ok(externos >= 20, `solo ${externos} enlaces externos revisados`);
  assert.ok((cuerpo.match(/\(se abre en otra pestaña\)/g) ?? []).length >= 20, 'cada enlace externo avisa a los lectores de pantalla');
  const tags = [...html.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)].map((m) => m[0]);
  for (const tag of tags.filter((t) => /instagram\.com|linkedin\.com/.test(t))) assert.match(tag, /target="_blank"/);
  assert.match(html, /href="https:\/\/wa\.me\/528129043592\?text=[^"]+"/);
});

test('las ilustraciones son SVG propios con titulo y descripcion para lectores de pantalla', () => {
  const svgs = [...html.matchAll(/<svg class="c-guia__svg[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
  assert.equal(svgs.length, 3);
  for (const svg of svgs) {
    assert.match(svg, /role="img"/);
    assert.match(svg, /<title id="[^"]+">/);
    assert.match(svg, /<desc id="[^"]+">/);
  }
});

test('la lectura estimada es razonable y el hero la muestra', () => {
  const min = minutosDeLectura(guia);
  assert.ok(min >= 5 && min <= 25, `lectura de ${min} min`);
  assert.ok(html.includes(`Lectura de ${min} min`));
});

test('la lista de verificacion usa casillas de verdad con su texto asociado', () => {
  const lista = html.match(/<ul class="c-guia__verificacion">[\s\S]*?<\/ul>/)?.[0] ?? '';
  assert.equal((lista.match(/<input type="checkbox">/g) ?? []).length, 8);
  assert.equal((lista.match(/<label>/g) ?? []).length, 8);
});

test('la barra de capitulos tiene un enlace por capitulo, marcado para el scroll-spy, y sigue al activo en pantallas angostas', () => {
  const barra = html.match(/<nav class="c-guia__nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.ok(barra.includes('aria-label="Capítulos de la guía"'));
  assert.ok(barra.includes('data-spy-follow'));
  for (const c of guia.capitulos) {
    assert.ok(barra.includes(`class="c-guia__nav-link js-spy" href="#${c.id}"`), `la barra no enlaza a ${c.id}`);
    assert.ok(barra.includes(`<span>${c.nav}</span>`), `falta la etiqueta corta de ${c.id}`);
  }
  assert.equal((barra.match(/js-spy/g) ?? []).length, 8);
  const main = fs.readFileSync('assets/js/main.js', 'utf8');
  assert.ok(main.includes('data-spy-follow') && main.includes('function followSpy'), 'main.js debe mover la barra hacia el capitulo activo');
});

test('cada tarjeta del indice avisa que es un enlace y cada capitulo trae anterior y siguiente', () => {
  assert.equal((html.match(/class="c-guia__ir"/g) ?? []).length, 8);
  const indice = html.match(/<ol class="c-guia__indice">[\s\S]*?<\/ol>/)?.[0] ?? '';
  assert.equal((indice.match(/Ir al capítulo/g) ?? []).length, 8);
  assert.equal((html.match(/<nav class="c-guia__pasar"/g) ?? []).length, 8);
  guia.capitulos.forEach((c, i) => {
    const desde = html.indexOf(`<section class="c-section c-promo__seccion c-guia__capitulo" id="${c.id}"`);
    const seccion = html.slice(desde, html.indexOf('</section>', desde));
    assert.ok(desde > 0, `no encontre la seccion de ${c.id}`);
    const anterior = i === 0 ? '#capitulos' : `#${guia.capitulos[i - 1].id}`;
    const siguiente = i === guia.capitulos.length - 1 ? '#que-sigue' : `#${guia.capitulos[i + 1].id}`;
    assert.ok(seccion.includes(`href="${anterior}" rel="prev"`), `${c.id}: falta el enlace anterior`);
    assert.ok(seccion.includes(`href="${siguiente}" rel="next"`), `${c.id}: falta el enlace siguiente`);
  });
});

test('la animacion del hero es decorativa, de ejemplo (direcciones reservadas) y no corre con menos movimiento', () => {
  const flujo = html.match(/<div class="c-guia__flujo"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/)?.[0] ?? html.slice(html.indexOf('c-guia__flujo'), html.indexOf('c-guia__flujo') + 1800);
  assert.ok(html.includes('<div class="c-guia__flujo" aria-hidden="true">'));
  assert.ok(flujo.includes('192.0.2.'), 'las direcciones de ejemplo son del bloque reservado 192.0.2.x');
  assert.doesNotMatch(flujo, /<a |<button|tabindex/, 'la animacion no lleva nada interactivo');
  const css = fs.readFileSync('src/scss/5-components/_c-guia.scss', 'utf8');
  const antes = css.slice(0, css.indexOf('@media (prefers-reduced-motion: no-preference)'));
  assert.doesNotMatch(antes, /animation|@keyframes/, 'todo el movimiento del hero va dentro de prefers-reduced-motion: no-preference');
});

test('la tabla de registros DNS no parte los tipos (CNAME) ni encoge su columna, y avisa que se desliza en pantallas angostas', () => {
  const css = fs.readFileSync('src/scss/5-components/_c-guia.scss', 'utf8');
  const tabla = css.slice(css.indexOf('&__tabla {'), css.indexOf('// Pista de que la tabla'));
  assert.match(tabla, /td:first-child,\s*th:first-child\s*\{[^}]*white-space: nowrap/, 'la columna del tipo no debe partirse');
  assert.match(tabla, /td code\s*\{[^}]*overflow-wrap: normal/, 'con overflow-wrap: anywhere la columna se encoge a una letra');
  assert.match(tabla, /overflow-x: auto/, 'en pantallas angostas la tabla se desplaza de lado');
  assert.ok(html.includes('class="c-guia__desliza"'), 'falta la pista de desplazamiento');
});

test('hay un boton fijo que regresa al indice (la seccion despues del hero) y solo aparece al pasarlo', () => {
  assert.match(html, /<a class="c-to-top js-guia-top" href="#capitulos" aria-label="Volver al índice de capítulos"/);
  assert.ok(html.includes('id="capitulos"'));
  const main = fs.readFileSync('assets/js/main.js', 'utf8');
  assert.ok(main.includes('.js-guia-top') && main.includes('guiaIndice.getBoundingClientRect().bottom < 0'), 'main.js debe mostrar el boton solo cuando el indice ya quedo arriba');
  assert.ok(!/IntersectionObserver[^;]*guiaIndice/.test(main), 'un observador no detecta saltos directos que no cruzan el indice: se mide en cada scroll');
  assert.ok(!main.includes("'.js-to-top'"), 'no debe chocar con el boton de los casos (.js-to-top, case.js)');
});
