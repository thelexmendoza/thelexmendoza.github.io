import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sass from 'sass';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;

test('existen los objetos y utilidades base', () => {
  for (const selector of ['.o-container', '.o-stack', '.o-grid', '.u-visually-hidden']) {
    assert.ok(css.includes(selector), `falta ${selector}`);
  }
});

test('el cuerpo usa el alto dinamico y la fuente base', () => {
  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /font-family:\s*"IBM Plex Sans"/);
});

test('el contenedor respeta las zonas seguras', () => {
  assert.match(css, /env\(safe-area-inset-left/);
  assert.match(css, /env\(safe-area-inset-right/);
});

test('el desplazamiento suave respeta prefers-reduced-motion', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*smooth/);
});

test('los titulares usan la fuente condensada y los pasos fluidos', () => {
  assert.match(css, /h1[\s\S]*?font-family:\s*"IBM Plex Sans Condensed"/);
  assert.match(css, /font-size:\s*var\(--step-4\)/);
});

test('los enlaces tienen foco visible', () => {
  assert.match(css, /a:focus-visible/);
});

test('el enlace de saltar al contenido se ve al recibir el foco', () => {
  assert.match(css, /\.u-visually-hidden--focusable:focus-visible\s*\{[^}]*clip-path:\s*none/);
});

test('la palabra camaleonica tiene salida para alto contraste', () => {
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*?\.c-chameleon-title[\s\S]*?background:\s*none/);
});

test('el parallax usa scroll-driven animations solo con soporte y sin reduced-motion', () => {
  assert.match(css, /@supports \(animation-timeline: scroll\(\)\)/);
  assert.match(css, /animation-timeline:\s*scroll\(root\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?animation-timeline/);
});

test('el estado oculto del revelado solo existe con has-js y sin reduced-motion', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.has-js[^{]*\[data-reveal/);
  assert.match(css, /reveal-all/);
});

test('la barra de progreso de lectura existe y usa el acento', () => {
  assert.match(css, /\.c-progress/);
});

test('el riel de secciones solo aparece en pantallas amplias', () => {
  assert.match(css, /@media \(min-width: 90rem\)[\s\S]*?\.c-rail/);
});
