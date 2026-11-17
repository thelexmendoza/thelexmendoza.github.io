import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createTagOrq } from '../assets/js/tag-orquestador/browser.mjs';
import { TAGS_END, TAGS_START, injectTags, tagsHead } from '../scripts/tags.mjs';

const casos = fs.readdirSync('casos').map((c) => `casos/${c}/index.html`);
const paginas = ['index.html', 'promo/index.html', 'privacidad/index.html', 'cookies/index.html', ...casos];
const leer = (f) => fs.readFileSync(f, 'utf8');
const bloque = leer('data/tags-head.html');
// La configuración real que recibe el runtime (la misma de init({...}) en el bloque).
const config = JSON.parse(bloque.match(/init\(([\s\S]*?)\);\s*<\/script>/)[1]);

test('toda pagina lleva el bloque del orquestador, con Consent Mode negado por defecto y el pixel de Meta', () => {
  assert.equal(config.platforms.meta.pixel_id, '2050494035617814');
  assert.equal(config.mode, 'direct');
  assert.equal(config.consent.banner, true);
  for (const pagina of paginas) {
    const html = leer(pagina);
    assert.ok(html.includes(tagsHead()), `${pagina}: falta el bloque (o esta desactualizado: npm run tags y regenerar)`);
    const negado = html.indexOf("gtag('consent', 'default'");
    assert.ok(negado > 0 && html.slice(negado, negado + 300).includes('"ad_storage":"denied"') && html.slice(negado, negado + 300).includes('"analytics_storage":"denied"'), `${pagina}: el consentimiento debe empezar negado`);
    assert.ok(negado < html.indexOf("import { init } from '/assets/js/tag-orquestador/browser.mjs'"), `${pagina}: lo negado va antes del modulo`);
  }
});

test('el bloque va despues del script del tema: el primer <script> sin atributos de cada pagina sigue siendo el del tema', () => {
  for (const pagina of paginas) {
    const html = leer(pagina);
    const primero = html.match(/<script>[\s\S]*?<\/script>/);
    assert.match(primero[0], /localStorage\.getItem\('theme'\)/, `${pagina}: el primer <script> debe ser el del tema (extractLayout lo toma)`);
    assert.ok(html.indexOf(TAGS_START) > primero.index + primero[0].length - 1, `${pagina}: el bloque va despues del tema`);
    assert.equal((html.match(new RegExp(TAGS_START, 'g')) ?? []).length, 1, `${pagina}: un solo bloque`);
    assert.ok(html.indexOf(TAGS_END) > html.indexOf(TAGS_START));
  }
});

test('nunca se pega el snippet crudo de Meta ni su noscript: el pixel solo lo carga el runtime, con consentimiento', () => {
  for (const pagina of [...paginas, '404.html', 'guia-dominio-hosting/index.html']) {
    const html = leer(pagina);
    assert.doesNotMatch(html, /fbq\(|connect\.facebook\.net|facebook\.com\/tr|<noscript>[\s\S]*?facebook/i, `${pagina}: el pixel se cargaria sin consentimiento`);
  }
});

test('todas las paginas con pie traen «Preferencias de cookies», que reabre el aviso', () => {
  for (const pagina of paginas) {
    assert.match(leer(pagina), /<a href="#" data-tagorq-prefs>Preferencias de cookies<\/a>/, pagina);
  }
});

test('injectTags: pone el bloque despues del script del tema, lo actualiza sin duplicarlo y falla sin script de tema', () => {
  const base = '<html><head><script>/* tema */</script><title>x</title></head></html>';
  const una = injectTags(base, `${TAGS_START}\nuno\n${TAGS_END}`);
  assert.ok(una.indexOf('/* tema */') < una.indexOf('uno'));
  const dos = injectTags(una, `${TAGS_START}\ndos\n${TAGS_END}`);
  assert.equal((dos.match(new RegExp(TAGS_START, 'g')) ?? []).length, 1);
  assert.ok(dos.includes('dos') && !dos.includes('uno'));
  assert.throws(() => injectTags('<html><head></head></html>', `${TAGS_START}\nx\n${TAGS_END}`));
});

// ---- El runtime real, con una ventana y un almacenamiento de mentira ----
function entorno() {
  const cabeza = [];
  const almacen = new Map();
  const win = { console: { warn() {} }, location: { href: 'https://lexmendoza.com/' } };
  const doc = { head: { appendChild: (s) => cabeza.push(s) }, createElement: () => ({}), addEventListener() {}, title: 'Lex Mendoza' };
  const storage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: (k) => almacen.delete(k) };
  // `window`, `document` y `storage` son lo que pide el runtime; `win` y `doc` son atajos para las pruebas.
  return { window: win, document: doc, win, doc, storage, cabeza, almacen };
}
const scriptsDePixel = (cabeza) => cabeza.filter((s) => String(s.src).includes('connect.facebook.net'));

test('sin decision no se carga el pixel, ni se manda nada a Meta; el aviso se pide', () => {
  const e = entorno();
  const api = createTagOrq(config, e);
  api.start();
  assert.equal(scriptsDePixel(e.cabeza).length, 0);
  assert.equal(e.win.fbq, undefined, 'fbq no existe');
  assert.equal(api.consent.needsDecision(), true);
  const primera = Array.from(e.win.dataLayer[0]);
  assert.deepEqual(primera.slice(0, 2), ['consent', 'default']);
  assert.equal(primera[2].ad_storage, 'denied');
  assert.equal(primera[2].analytics_storage, 'denied');
});

test('Rechazar no carga el pixel, descarta lo pendiente y guarda la decision (12 meses, version de la politica)', () => {
  const e = entorno();
  const api = createTagOrq(config, e);
  api.start();
  api.track('click_whatsapp', { destination: 'whatsapp' });
  api.consent.rejectAll();
  api.track('click_whatsapp', { destination: 'whatsapp' });
  assert.equal(scriptsDePixel(e.cabeza).length, 0);
  assert.equal(e.win.fbq, undefined);
  const guardado = JSON.parse(e.almacen.get('tagorq_consent'));
  assert.equal(guardado.v, '2026-11');
  assert.deepEqual(guardado.cats, { analytics: false, marketing: false, functional: false });
  assert.equal(api.consent.needsDecision(), false);
});

test('Aceptar carga el pixel con su ID y manda la visita; Configurar sin marcar nada tampoco lo carga', () => {
  const aceptado = entorno();
  const a = createTagOrq(config, aceptado);
  a.start();
  a.consent.acceptAll();
  assert.equal(scriptsDePixel(aceptado.cabeza).length, 1);
  assert.match(scriptsDePixel(aceptado.cabeza)[0].src, /^https:\/\/connect\.facebook\.net\/.+\/fbevents\.js$/);
  assert.equal(typeof aceptado.win.fbq, 'function');
  assert.ok(aceptado.win.fbq.queue.some((c) => c[0] === 'init' && c[1] === '2050494035617814'));
  assert.ok(aceptado.win.fbq.queue.some((c) => c[0] === 'track' && c[1] === 'PageView'), 'la visita pendiente se envia al aceptar');

  const sinMarcar = entorno();
  const b = createTagOrq(config, sinMarcar);
  b.start();
  b.consent.set({ analytics: false, marketing: false, functional: true });
  assert.equal(scriptsDePixel(sinMarcar.cabeza).length, 0, 'solo preferencias: sin pixel');
});

test('una decision guardada se respeta al volver, y cambia con una version nueva de la politica', () => {
  const e = entorno();
  createTagOrq(config, e).consent.acceptAll();
  const vuelve = entorno();
  vuelve.almacen = e.almacen;
  vuelve.storage = e.storage;
  const api = createTagOrq(config, vuelve);
  assert.equal(api.consent.needsDecision(), false);
  const nueva = createTagOrq({ ...config, consent: { ...config.consent, version: '2027-01' } }, vuelve);
  assert.equal(nueva.consent.needsDecision(), true, 'otra version de la politica vuelve a preguntar');
});

test('el aviso trata igual Aceptar, Rechazar y Configurar: ningun boton se destaca en el estilo', () => {
  const scss = leer('src/scss/5-components/_c-consent.scss');
  assert.doesNotMatch(scss, /tagorq-btn--(accept|reject|configure)/, 'los tres botones comparten el mismo estilo');
  assert.match(scss, /\.tagorq-btn\s*\{[\s\S]*?background:\s*transparent/);
  const banner = leer('assets/js/tag-orquestador/banner.mjs');
  assert.doesNotMatch(banner, /checked:\s*['"]?true/, 'ninguna casilla viene premarcada por el modulo');
});

test('el aviso solo se anima con preferencia de movimiento', () => {
  const scss = leer('src/scss/5-components/_c-consent.scss');
  const marca = scss.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(marca > 0);
  assert.doesNotMatch(scss.slice(0, marca), /animation:|transition:/);
});

test('la politica de cookies y el aviso de privacidad hablan del pixel, de la decision guardada y de «Preferencias de cookies»', () => {
  const cookies = leer('cookies/index.html');
  for (const texto of ['<code>tagorq_consent</code>', '<code>_fbp</code>', 'píxel de Meta', 'Aceptar', 'Rechazar', 'Configurar', 'Preferencias de cookies', 'no se carga el píxel']) assert.ok(cookies.includes(texto), `cookies: falta «${texto}»`);
  assert.doesNotMatch(cookies, /Hoy no uso publicidad ni analítica|nada de seguimiento ni publicidad/);
  const privacidad = leer('privacidad/index.html');
  for (const texto of ['Meta (píxel)', 'Medición de anuncios', '_fbp', 'aviso de cookies']) assert.ok(privacidad.includes(texto), `privacidad: falta «${texto}»`);
  assert.doesNotMatch(privacidad, /No uso hoy publicidad ni analítica con cookies/);
});
