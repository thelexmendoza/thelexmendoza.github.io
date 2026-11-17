import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const scss = fs.readFileSync('src/scss/5-components/_c-about.scss', 'utf8') + fs.readFileSync('src/scss/5-components/_c-plan.scss', 'utf8');

test('«¿Te late lo que ves?» enlaza al brief y ya no es «Próximamente»', () => {
  const plan = html.slice(html.indexOf('id="plan"'), html.indexOf('id="sobre-mi"'));
  assert.match(plan, /href="https:\/\/brief\.lexmendoza\.com\/"/);
  assert.doesNotMatch(plan, /data-soon|Próximamente/);
});

test('el video del brief va sin autoplay, con poster y una version vertical para movil', () => {
  const plan = html.slice(html.indexOf('id="plan"'), html.indexOf('id="sobre-mi"'));
  const video = plan.match(/<video[^>]*>/)[0];
  assert.doesNotMatch(video, /autoplay/);
  for (const attr of ['muted', 'loop', 'playsinline', 'poster=', 'data-src=', 'data-src-mobile=', 'data-poster-mobile=']) assert.ok(video.includes(attr), `falta ${attr}`);
  for (const f of ['brief-h.mp4', 'brief-v.mp4', 'brief-h-poster.webp', 'brief-v-poster.webp']) assert.ok(fs.existsSync(`assets/video/plan/${f}`), `falta ${f}`);
  assert.match(plan, /aria-hidden="true"/);
});

test('en movil el video va arriba y el texto debajo: no se empalman', () => {
  assert.match(scss, /\.c-plan[\s\S]*&__media\s*\{[\s\S]*aspect-ratio: 4 \/ 5/);
  assert.match(scss, /min-width: 1024px[\s\S]*position: absolute/); // solo el escritorio pone el video detras del texto
});

test('la foto de «Sobre mí» tiene descripcion, version a color y movimiento solo con preferencia de movimiento', () => {
  const about = html.slice(html.indexOf('id="sobre-mi"'));
  assert.match(about, /<img class="c-about__img" src="assets\/img\/lex\/lex-bn-640\.webp" alt="[^"]{20,}"/);
  assert.doesNotMatch(about, /pendiente/);
  for (const f of ['lex-bn-640.webp', 'lex-color-640.webp']) assert.ok(fs.existsSync(`assets/img/lex/${f}`));
  const motion = scss.slice(scss.indexOf('prefers-reduced-motion: no-preference'));
  for (const k of ['c-about-scan', 'c-about-shimmer']) assert.ok(motion.includes(k) || scss.includes(`animation: ${k}`));
  // ninguna animacion fuera del bloque de movimiento
  const fuera = scss.slice(0, scss.indexOf('prefers-reduced-motion: no-preference'));
  assert.doesNotMatch(fuera.replace(/@keyframes[\s\S]*/, ''), /animation:/);
});

test('cada icono que usan las paginas esta definido en el CSS, y todos son decorativos', () => {
  const css = fs.readFileSync('assets/css/main.min.css', 'utf8');
  const pages = ['index.html', ...fs.readdirSync('casos').map((c) => `casos/${c}/index.html`)];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    for (const [, name] of html.matchAll(/c-icon c-icon--([a-z-]+)"/g)) assert.ok(css.includes(`.c-icon--${name}{`), `${page}: falta .c-icon--${name} en el CSS`);
    for (const m of html.matchAll(/<span class="c-icon [^"]*"([^>]*)>/g)) assert.match(m[1], /aria-hidden="true"/, `${page}: icono sin aria-hidden`);
  }
});

test('el menu, los botones del pie y el llamado de la home llevan icono', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const nav = html.match(/<nav class="c-nav__links"[\s\S]*?<\/nav>/)[0];
  assert.equal((nav.match(/c-icon c-icon--/g) ?? []).length, 5);
  const actions = html.match(/<p class="c-footer__actions">[\s\S]*?<\/p>/)[0];
  for (const name of ['message', 'mail', 'instagram', 'linkedin']) assert.ok(actions.includes(`c-icon--${name}"`), `falta ${name} en el pie`);
  assert.match(html, /c-icon--tag"[^>]*><\/span>Cotiza con la promo/);
});
