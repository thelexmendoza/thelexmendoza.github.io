import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { renderCase } from '../scripts/render-case.mjs';

// Etiquetas, botones y avisos legales no son parrafos de lectura: no se revelan.
const SKIP_CLASS = /c-eyebrow|c-hero__eyebrow|c-footer__legal|c-service__tag|c-footer__actions/;

function paragraphs(html) {
  return [...html.matchAll(/<p((?:\s[^>]*)?)>([\s\S]*?)<\/p>/g)].map((m) => ({ attrs: m[1], inner: m[2].trim() }));
}

const readable = (p) => !SKIP_CLASS.test(p.attrs) && !p.inner.startsWith('<a class="c-button');

test('en la home cada parrafo de lectura se revela, y los titulos conservan su revelado', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const body = html.slice(html.indexOf('<main'));
  const missing = paragraphs(body).filter(readable).filter((p) => !p.attrs.includes('data-reveal="text"'));
  assert.deepEqual(missing.map((p) => p.inner.slice(0, 50)), []);
  assert.ok((body.match(/data-reveal="title"/g) ?? []).length >= 4, 'los titulos siguen revelandose');
});

test('los titulos no usan el revelado de texto', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /<h[1-4][^>]*data-reveal="text"/);
});

test('en la pagina de caso cada parrafo de lectura se revela', () => {
  const html = renderCase({
    slug: 'demo',
    key: 'valtre',
    title: 'Demo',
    eyebrow: 'identidad',
    meta: '2024',
    summary: 'Resumen.',
    teaser: { chapter: 'uno', text: 'Gancho.' },
    chapters: [{ id: 'uno', title: 'Uno', eyebrow: 'x', text: ['A.', 'B.'], groups: [{ kind: 'disenos', topic: 'T', note: 'Nota.', items: [{ id: 'a', src: 'a.webp', full: 'a-big.webp', width: 10, height: 10, alt: 'a' }] }] }],
  });
  const body = html.slice(html.indexOf('<main'));
  const missing = paragraphs(body).filter(readable).filter((p) => !p.attrs.includes('data-reveal="text"'));
  assert.deepEqual(missing.map((p) => p.inner.slice(0, 50)), []);
});

test('el CSS muestra un esqueleto de lineas en lugar de cada parrafo hasta revelarlo, con movimiento permitido y con respaldo', () => {
  const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\[data-reveal=text\][^{]*:not\(\.is-revealed\)[^{]*\{[^}]*color:\s*transparent/);
  assert.match(css, /\[data-reveal=text\][^{]*:not\(\.is-revealed\)[^{]*\{[^}]*repeating-linear-gradient[^}]*1lh/);
  assert.match(css, /\.has-js:not\(\.reveal-all\) \[data-reveal=text\]/);
});

test('el esqueleto del parrafo usa la misma animacion de brillo que las tarjetas', () => {
  const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
  assert.match(css, /\[data-reveal=text\][^{]*:not\(\.is-revealed\)[^{]*\{[^}]*animation:\s*c-skeleton/);
});
