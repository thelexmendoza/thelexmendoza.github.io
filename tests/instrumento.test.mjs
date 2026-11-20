import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { mergeColumns, shouldBoot, parallaxOffset, scrollProgress } from '../assets/js/instrumento.js';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const js = fs.readFileSync('assets/js/instrumento.js', 'utf8');
const main = fs.readFileSync('assets/js/main.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');

test('mergeColumns ordena, redondea y une las x que quedan a 2 px o menos', () => {
  assert.deepEqual(mergeColumns([896, 57, 455.4, 476, 455, 57.9]), [57, 455, 476, 896]);
  assert.deepEqual(mergeColumns([]), []);
  assert.deepEqual(mergeColumns([10, 12, 15], 2), [10, 15]);
});

test('shouldBoot: solo al entrar desde fuera o al recargar, y nunca con menos movimiento ni en páginas calmas', () => {
  const origin = 'https://lexmendoza.com';
  assert.equal(shouldBoot({ referrer: '', origin }), true, 'entrada directa');
  assert.equal(shouldBoot({ referrer: 'https://www.google.com/', origin }), true, 'desde otro sitio');
  assert.equal(shouldBoot({ referrer: 'https://lexmendoza.com/promo/', origin }), false, 'desde otra página del sitio');
  assert.equal(shouldBoot({ referrer: '', origin, navType: 'reload' }), true);
  assert.equal(shouldBoot({ referrer: '', origin, navType: 'back_forward' }), false);
  assert.equal(shouldBoot({ referrer: '', origin, reduce: true }), false);
  assert.equal(shouldBoot({ referrer: '', origin, calm: true }), false);
  assert.equal(shouldBoot({ referrer: 'no es una url', origin }), true);
});

test('el parallax de mouse de las guías de columnas solo es vertical; progreso de la regla entre 0 y 1', () => {
  assert.deepEqual(parallaxOffset({ x: 1, y: 0.5 }, 10, true), { x: 0, y: -5 });
  assert.deepEqual(parallaxOffset({ x: 1, y: 0.5 }, 10, false), { x: -10, y: -5 });
  assert.equal(scrollProgress(0, 2000, 800), 0);
  assert.equal(scrollProgress(600, 2000, 800), 0.5);
  assert.equal(scrollProgress(9999, 2000, 800), 1);
  assert.equal(scrollProgress(-5, 2000, 800), 0);
});

test('el instrumento vive solo en la home y no corre en páginas calmas', () => {
  assert.match(js, /root\.dataset\.page !== 'home' \|\| root\.hasAttribute\('data-calm'\)/);
  assert.match(main, /dataset\.page === 'home'\) import\('\.\/instrumento\.js'\)/, 'se pide bajo demanda y solo en la home');
  assert.doesNotMatch(main, /^import .*instrumento/m, 'ninguna página lo importa de forma estática');
  assert.match(home, /<html lang="es" data-page="home">/);
  for (const page of ['privacidad', 'cookies', 'promo', 'guia-dominio-hosting', '404.html', 'casos/valtre']) {
    const file = page.endsWith('.html') ? page : `${page}/index.html`;
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /data-page="home"/, `${file} no es la home`);
    assert.doesNotMatch(html, /c-boot/, `${file} no lleva el arranque`);
    assert.doesNotMatch(html, /instrumento\.js/, `${file} no precarga el instrumento`);
  }
});

test('la home precarga el módulo, lleva el arranque oculto y lo decide sin guardar nada', () => {
  assert.match(home, /<link rel="modulepreload" href="assets\/js\/instrumento\.js">/);
  assert.match(home, /class="c-boot" aria-hidden="true" hidden>/, 'sin JavaScript el arranque no tapa la página');
  assert.ok(home.indexOf('rel="modulepreload"') < home.indexOf('assets/js/main.js"'));
  assert.doesNotMatch(js + home.match(/<div class="c-boot"[\s\S]*?<\/script>/)[0], /localStorage|sessionStorage|document\.cookie|indexedDB/, 'no guarda nada en el navegador (la política de cookies lo cubre)');
  const primero = home.match(/<script>[\s\S]*?<\/script>/)[0];
  assert.match(primero, /localStorage\.getItem\('theme'\)/, 'el primer <script> sin atributos sigue siendo el del tema');
});

test('todo lo decorativo del instrumento es aria-hidden y no crea elementos enfocables', () => {
  assert.match(js, /bg\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js, /ruler\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js, /readout\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js, /brk\.setAttribute\('aria-hidden', 'true'\)/);
  assert.doesNotMatch(js, /tabindex|createElement\('(a|button|input)'\)/);
  assert.doesNotMatch(js, /innerHTML/);
});

test('el cursor es de todo el sitio (sin alcance de la home), solo con cursor fino, por tema, y los campos de texto lo conservan', () => {
  const svg = css.replace(/data:image\/svg\+xml[^"]*/g, 'SVG');
  assert.match(svg, /@media \(hover: hover\) and \(pointer: fine\) \{\s*:root \{\s*cursor: url\("SVG"\) 12 12, auto;/);
  assert.match(svg, /:root :is\(a, button, summary, \[role=button\], label, \.c-button, \.c-case-card\) \{\s*cursor: url\("SVG"\) 16 16, pointer;/);
  assert.match(css, /:root\[data-theme=dark\] \{\s*cursor: url\("data:image\/svg\+xml[^"]*%23fafafa/);
  assert.match(css, /:root:not\(\[data-theme=light\]\) \{\s*cursor: url\("data:image\/svg\+xml[^"]*%23fafafa/);
  assert.match(css, /textarea \{\s*cursor: text;/);
  const desde = css.indexOf('@media (hover: hover) and (pointer: fine) {\n  :root {');
  assert.doesNotMatch(css.slice(desde, desde + 1800), /data-page/);
});

test('lo demás del instrumento está atado a la home y todo movimiento va dentro de no-preference', () => {
  for (const selector of ['[data-page=home] .c-button', '[data-page=home] .c-service', '[data-page=home] #servicios']) assert.ok(css.includes(selector), `falta ${selector}`);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{\s*\[data-page=home\] \.c-button \{\s*transition:/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\) \{\s*@media \(prefers-reduced-motion: no-preference\) \{\s*\.c-bg__layer--far \{/);
  const primero = css.indexOf('animation: c-bg-far');
  const bloque = css.slice(css.lastIndexOf('@supports', primero), primero);
  assert.match(bloque, /^@supports \(animation-timeline: view\(\)\) \{\s*@media \(prefers-reduced-motion: no-preference\)/, 'el parallax de scroll solo con movimiento permitido');
  assert.equal(css.split('animation: c-bg-').length - 1, 3);
});

test('el vidrio del instrumento usa los mixins, tiene versión sólida con «reducir transparencia» y el fondo va detrás sin tocar a los hijos', () => {
  assert.match(css, /\.c-service \{[^}]*background: var\(--color-bg\);\s*\}\s*@supports \(backdrop-filter: blur\(1px\)\)/);
  assert.match(css, /\.c-readout \{\s*background: color-mix\(in srgb, var\(--color-bg\) 90%, transparent\);\s*-webkit-backdrop-filter: blur\(24px\) saturate\(1\.5\);/);
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\) \{\s*\.c-service \{\s*background: var\(--color-bg\);/);
  assert.match(css, /\.c-bg \{[^}]*z-index: -1;[^}]*overflow: clip;/);
  assert.match(css, /\.has-bg \{[^}]*isolation: isolate;/);
});
