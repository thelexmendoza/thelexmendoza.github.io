import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sass from 'sass';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const block = (selector) => {
  const match = css.match(new RegExp(`(?:^|\\n)\\s*${selector}\\s*(?:,[^{]*)?\\{([^}]*)\\}`));
  assert.ok(match, `no existe el bloque ${selector}`);
  return Object.fromEntries([...match[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
};

const themeSelector = (theme) => `\\[data-theme="?${theme}"?\\]`;
const caseSelector = (theme, name) => `${themeSelector(theme)}\\[data-case="?${name}"?\\]`;

for (const theme of ['dark', 'light']) {
  test(`tema ${theme}: texto, secundario y acento cumplen contraste`, () => {
    const t = block(themeSelector(theme));
    assert.ok(contrast(t['--color-text'], t['--color-bg']) >= 4.5, 'texto');
    assert.ok(contrast(t['--color-text-muted'], t['--color-bg']) >= 4.5, 'texto secundario');
    assert.ok(contrast(t['--color-on-accent'], t['--color-accent']) >= 4.5, 'texto sobre acento');
    assert.ok(contrast(t['--color-accent'], t['--color-bg']) >= 3, 'acento sobre fondo (texto grande e interfaz)');
    assert.ok(contrast(t['--color-accent-text'], t['--color-bg']) >= 4.5, 'texto pequeno en acento');
  });
}

for (const name of ['bmw', 'daniel', 'etics', 'moto']) {
  for (const theme of ['dark', 'light']) {
    test(`caso ${name} en ${theme}: acento y degradado se leen sobre el fondo`, () => {
      const bg = block(themeSelector(theme))['--color-bg'];
      const c = block(caseSelector(theme, name));
      for (const key of ['--color-accent', '--gradient-a', '--gradient-b']) {
        assert.ok(c[key], `falta ${key}`);
        assert.ok(contrast(c[key], bg) >= 3, `${key} sobre el fondo ${theme}`);
      }
    });
  }
}

test('sin JavaScript el tema sigue la preferencia del sistema', () => {
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /:root:not\(\[data-theme="?light"?\]\)/);
});

test('las tarjetas dentro de la pagina tambien reciben la paleta del caso en oscuro', () => {
  assert.match(css, /\[data-theme="?dark"?\] \[data-case="?bmw"?\]/);
  assert.match(css, /:root:not\(\[data-theme="?light"?\]\) \[data-case="?bmw"?\]/);
});
