import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sass from 'sass';

const css = () => sass.compile('src/scss/main.scss', { style: 'expanded' }).css;

test('el espaciado sigue Fibonacci en rem', () => {
  const out = css();
  const expected = {
    '--space-1': '0.5rem',
    '--space-2': '0.8125rem',
    '--space-3': '1.3125rem',
    '--space-4': '2.125rem',
    '--space-5': '3.4375rem',
    '--space-6': '5.5625rem',
    '--space-7': '9rem',
  };
  for (const [name, value] of Object.entries(expected)) {
    assert.match(out, new RegExp(`${name}:\\s*${value};`), `${name} deberia ser ${value}`);
  }
});

test('la escala tipografica usa razon aurea desde 16px', () => {
  const out = css();
  assert.match(out, /--step--1:\s*0\.8125rem;/);
  assert.match(out, /--step-0:\s*1rem;/);
});

test('los pasos grandes son fluidos entre movil y escritorio', () => {
  const out = css();
  assert.match(out, /--step-1:\s*clamp\(1\.25rem,[^;]*1\.625rem\);/);
  assert.match(out, /--step-2:\s*clamp\(1\.625rem,[^;]*2\.625rem\);/);
  assert.match(out, /--step-3:\s*clamp\(2\.0625rem,[^;]*4\.25rem\);/);
  assert.match(out, /--step-4:\s*clamp\(2\.625rem,[^;]*6\.875rem\);/);
});
