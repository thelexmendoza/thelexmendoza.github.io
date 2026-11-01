import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sass from 'sass';

const compile = (source) =>
  sass.compileString(source, { loadPaths: ['src/scss'], style: 'expanded' }).css;

const widths = {
  'phone-s': '20rem',
  phone: '23.4375rem',
  'phone-l': '26.875rem',
  tablet: '48rem',
  'laptop-s': '64rem',
  laptop: '80rem',
  desktop: '90rem',
  wide: '120rem',
  tv: '160rem',
};

for (const [name, width] of Object.entries(widths)) {
  test(`respond-to(${name}) emite min-width ${width}`, () => {
    const css = compile(`@use "1-tools/mixins" as m; .t { @include m.respond-to(${name}) { color: red; } }`);
    assert.match(css, new RegExp(`@media \\(min-width: ${width.replace('.', '\\.')}\\)`));
  });
}

test('respond-to con un nombre desconocido falla', () => {
  assert.throws(
    () => compile('@use "1-tools/mixins" as m; .t { @include m.respond-to(nope) { color: red; } }'),
    /desconocido/,
  );
});

test('touch-target solo aplica con puntero tactil y mide 55px', () => {
  const css = compile('@use "1-tools/mixins" as m; .t { @include m.touch-target; }');
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /min-block-size:\s*3\.4375rem/);
});

test('on-hover solo aplica cuando el dispositivo tiene hover', () => {
  const css = compile('@use "1-tools/mixins" as m; .t { @include m.on-hover { color: red; } }');
  assert.match(css, /@media \(hover: hover\)/);
});
