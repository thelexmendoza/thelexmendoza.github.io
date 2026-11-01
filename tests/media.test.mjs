import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseSource } from '../assets/js/media.js';

const both = { desktop: 'h.mp4', mobile: 'v.mp4', poster: 'h.webp', posterMobile: 'v.webp' };

test('en pantalla chica usa el video vertical y su poster; en grande, el horizontal', () => {
  assert.deepEqual(chooseSource(both, true), { src: 'v.mp4', poster: 'v.webp' });
  assert.deepEqual(chooseSource(both, false), { src: 'h.mp4', poster: 'h.webp' });
});

test('sin version vertical, la pantalla chica tambien usa el horizontal', () => {
  const only = { desktop: 'h.mp4', poster: 'h.webp' };
  assert.deepEqual(chooseSource(only, true), { src: 'h.mp4', poster: 'h.webp' });
});

test('si falta el poster vertical se usa el horizontal', () => {
  assert.deepEqual(chooseSource({ ...both, posterMobile: undefined }, true), { src: 'v.mp4', poster: 'h.webp' });
});

import fs from 'node:fs';

test('la tarjeta calienta sus videos antes del hover: asi el hover solo reanuda, sin crear el decodificador en pleno movimiento', () => {
  const code = fs.readFileSync('assets/js/media.js', 'utf8');
  assert.match(code, /IntersectionObserver\([^)]*\)[\s\S]*?rootMargin:\s*'\d+px/, 'se prepara cuando la tarjeta esta cerca de la pantalla');
  assert.match(code, /function warmUp\(/);
  assert.match(code, /addEventListener\(\s*'playing'/);
  assert.match(code, /preload\s*=\s*'auto'/);
  assert.match(code, /if \(!isActive\(\)\)/, 'si ya se activo, no se pausa lo que el hover puso a reproducir');
});
