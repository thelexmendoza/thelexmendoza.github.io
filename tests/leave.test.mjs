import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sass from 'sass';
import { isPageLink, LEAVE_TIMEOUT_MS } from '../assets/js/leave.js';

const here = 'https://thelexmendoza.github.io/';
const click = (extra = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...extra });
const link = (href, attrs = {}) => ({
  href: new URL(href, here).href,
  target: attrs.target ?? '',
  hasAttribute: (name) => name in attrs,
  getAttribute: (name) => attrs[name] ?? null,
});

test('un enlace a otra página del sitio es salir de la página', () => {
  assert.equal(isPageLink(link('casos/valtre/'), click(), here), true);
  assert.equal(isPageLink(link('/casos/valtre/#vision'), click(), here), true);
  assert.equal(isPageLink(link('../../'), click(), 'https://thelexmendoza.github.io/casos/valtre/'), true);
});

test('no es salir: anclas de la misma página, otros sitios, correo o teléfono', () => {
  assert.equal(isPageLink(link('#casos'), click(), here), false);
  assert.equal(isPageLink(link('/#casos'), click(), here), false);
  assert.equal(isPageLink(link('https://wa.me/528129043592'), click(), here), false);
  assert.equal(isPageLink(link('mailto:lex.mendozaleon@gmail.com'), click(), here), false);
  assert.equal(isPageLink(null, click(), here), false);
});

test('no es salir: pestaña nueva, modificadores, descargas ni enlaces «próximamente»', () => {
  assert.equal(isPageLink(link('casos/valtre/', { target: '_blank' }), click(), here), false);
  assert.equal(isPageLink(link('casos/valtre/'), click({ ctrlKey: true }), here), false);
  assert.equal(isPageLink(link('casos/valtre/'), click({ metaKey: true }), here), false);
  assert.equal(isPageLink(link('casos/valtre/'), click({ shiftKey: true }), here), false);
  assert.equal(isPageLink(link('casos/valtre/'), click({ button: 1 }), here), false);
  assert.equal(isPageLink(link('x.pdf', { download: '' }), click(), here), false);
  assert.equal(isPageLink(link('plan/', { 'aria-disabled': 'true', 'data-soon': 'plan/' }), click(), here), false);
});

test('el aviso se suelta solo si la navegación no ocurre (no deja la página trabada)', () => {
  assert.ok(LEAVE_TIMEOUT_MS >= 5000 && LEAVE_TIMEOUT_MS <= 15000);
});

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;
const js = fs.readFileSync('assets/js/leave.js', 'utf8');

test('un segundo clic al mismo enlace se ignora mientras se sale, y el aviso se limpia al volver del caché', () => {
  assert.match(js, /leaving && leaving\.href === link\.href/);
  assert.match(js, /event\.preventDefault\(\)/);
  assert.match(js, /addEventListener\('pageshow', clear\)/);
});

test('la barra de carga va abajo (no choca con la barra de lectura de arriba) y solo avanza con movimiento permitido', () => {
  assert.match(css, /html\.is-leaving::after\s*\{[^}]*inset:\s*auto 0 0 0/s);
  assert.match(css, /html\.is-leaving\s*\{[^}]*cursor:\s*progress/s);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{[^}]*html\.is-leaving::after\s*\{[^}]*animation:\s*c-leaving/s);
  assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\n\}\n/g, ''), /animation:\s*c-leaving/);
});

test('todas las páginas precargan al pasar el cursor y excluyen enlaces deshabilitados y pestañas nuevas', () => {
  const pages = ['index.html', ...fs.readdirSync('casos').map((d) => `casos/${d}/index.html`)];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const rules = JSON.parse(html.match(/<script type="speculationrules">\s*([\s\S]*?)\s*<\/script>/)[1]);
    assert.equal(rules.prefetch[0].eagerness, 'moderate', page);
    assert.equal(rules.prefetch[0].where.and[0].href_matches, '/*', page);
    assert.match(JSON.stringify(rules), /data-soon/, page);
    assert.match(JSON.stringify(rules), /_blank/, page);
  }
});

// Los módulos que main.js importa en cascada se precargan en paralelo: si se agrega uno nuevo y se olvida aquí, el sitio
// vuelve a cargarlo de a uno por viaje de red.
test('cada página precarga todos los módulos que main.js importa, directos e indirectos', () => {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = fs.readFileSync(`assets/js/${file}`, 'utf8');
    for (const [, spec] of src.matchAll(/from\s+'(\.\/[\w-]+\.js)'/g)) walk(spec.slice(2));
  };
  walk('main.js');
  seen.delete('main.js');
  const pages = ['index.html', ...fs.readdirSync('casos').map((d) => `casos/${d}/index.html`)];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const preloaded = new Set([...html.matchAll(/<link rel="modulepreload" href="[^"]*assets\/js\/([\w-]+\.js)">/g)].map((m) => m[1]));
    for (const file of seen) assert.ok(preloaded.has(file), `${page} no precarga ${file}`);
    assert.ok(html.indexOf('rel="modulepreload"') < html.indexOf('assets/js/main.js"'), 'las precargas van antes del script');
  }
});
