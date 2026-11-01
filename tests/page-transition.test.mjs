import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { renderCase } from '../scripts/render-case.mjs';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const block = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@view-transition[\s\S]*?\n\}(?:\n|$)/)?.[0] ?? '';

test('la navegacion entre paginas se anima solo si la persona acepta movimiento', () => {
  assert.ok(block, 'las reglas de transicion entre paginas van dentro de no-preference');
  assert.match(block, /@view-transition\s*\{\s*navigation:\s*auto/);
});

test('el menu se queda quieto y el resto se anima como un solo cuadro del tamano de la pantalla', () => {
  assert.match(block, /\.c-nav\s*\{[^}]*view-transition-name:\s*nav/);
  assert.doesNotMatch(block, /main\s*\{[^}]*view-transition-name/, 'un <main> de miles de px no se puede capturar de forma fiable');
});

test('la pagina que sale y la que entra tienen su propio fundido con un pequeno desplazamiento', () => {
  assert.match(block, /::view-transition-old\(root\)\s*\{[^}]*animation:[^;]*c-page-out/);
  assert.match(block, /::view-transition-new\(root\)\s*\{[^}]*animation:[^;]*c-page-in/);
  assert.match(block, /@keyframes c-page-out[\s\S]*?translateY/);
  assert.match(block, /@keyframes c-page-in[\s\S]*?translateY/);
});

test('la pagina nueva espera a tener su contenido antes de pintarse, en el home y en los casos', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const tag = '<link rel="expect" href="#contenido" blocking="render">';
  assert.ok(home.includes(tag), 'el home');
  assert.match(home, /<main id="contenido"/);
  const page = renderCase({ slug: 'x', key: 'valtre', title: 'X', eyebrow: 'x', meta: 'x', summary: 'x', teaser: { chapter: 'a', text: 'x' }, chapters: [{ id: 'a', title: 'A', eyebrow: 'a', text: ['t'], groups: [] }] });
  assert.ok(page.includes(tag), 'las paginas de caso');
  assert.match(page, /<main id="contenido"/);
});

const theming = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:root\.is-theming[\s\S]*?\n\}(?:\n|$)/)?.[0] ?? '';

test('el cambio de tema se anima solo si la persona acepta movimiento', () => {
  assert.ok(theming, 'las reglas del cambio de tema van dentro de no-preference');
});

test('al cambiar de tema la pantalla vieja se queda debajo y la nueva se funde encima, menu incluido, sin el desplazamiento de las paginas', () => {
  assert.match(theming, /:root\.is-theming::view-transition-old\(root\),\s*:root\.is-theming::view-transition-old\(nav\)\s*\{[^}]*animation:\s*none/);
  assert.match(theming, /:root\.is-theming::view-transition-new\(root\),\s*:root\.is-theming::view-transition-new\(nav\)\s*\{[^}]*animation:\s*c-theme-in 0\.5s/);
  assert.match(theming, /@keyframes c-theme-in\s*\{\s*from\s*\{\s*opacity:\s*0;?\s*\}\s*\}/);
  assert.doesNotMatch(theming.match(/@keyframes c-theme-in[\s\S]*?\n  \}/)?.[0] ?? '', /translate/);
});

test('sin View Transitions, los colores se transicionan con CSS durante el cambio', () => {
  assert.match(theming, /:root\.is-theming-css,\s*:root\.is-theming-css \*[^{]*\{[^}]*transition:[^;]*background-color 0\.5s[^;]*color 0\.5s[^;]*border-color 0\.5s/);
});

const caseData = { slug: 'x', key: 'valtre', title: 'Valtre', eyebrow: 'x', meta: 'x', summary: 'x', teaser: { chapter: 'a', text: 'x' }, card: { images: [{ id: 'a', src: 'a-640.webp', full: 'a-1200.webp', width: 640, height: 400 }] }, chapters: [{ id: 'a', title: 'A', eyebrow: 'a', text: ['t'], groups: [] }] };

test('al llegar con una transicion, la tarjeta y el hero ya vienen revelados para que haya algo que morfar', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const page = renderCase(caseData);
  for (const [name, html] of [['home', home], ['caso', page]]) {
    const script = html.match(/<script>[\s\S]*?<\/script>/)[0];
    assert.match(script, /addEventListener\('pagereveal'/, name);
    assert.match(script, /e\.viewTransition/, name);
    assert.match(script, /\.c-case-hero \[data-reveal\][^)]*\.c-case-card\[data-media\]|\.c-case-card\[data-media\][^)]*\.c-case-hero \[data-reveal\]/, name);
    assert.match(script, /classList\.add\('is-revealed'\)/, name);
  }
});

test('el titulo de la tarjeta y el del hero son el mismo texto para la transicion, medido solo por su texto', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  assert.match(home, /<span class="c-case-card__line c-case-card__title"><span class="c-case-card__word">Valtre<\/span><\/span>/);
  assert.match(block, /\.c-case-card\[data-media\] \.c-case-card__word,\s*\.c-case-hero\[data-media\] \.c-chameleon-title\s*\{[^}]*display:\s*inline-block;[^}]*view-transition-name:\s*case-title/);
  assert.match(block, /::view-transition-group\(case-title\)\s*\{[^}]*animation-duration:\s*0\.55s/);
  assert.match(block, /::view-transition-old\(case-title\),\s*::view-transition-new\(case-title\)\s*\{[^}]*object-fit:\s*contain/);
});
