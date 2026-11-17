import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pedirCupos, URL_CUPOS, TIEMPO_MS } from '../assets/js/promo.js';

const respuesta = (cuerpo, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => cuerpo });

test('pedirCupos lee los lugares de la funcion del brief (GET ?cupos=1) con tiempo limite de 4 s', async () => {
  assert.equal(URL_CUPOS, 'https://jmnnodzdopnbvbkcxpvy.supabase.co/functions/v1/pedido?cupos=1');
  assert.equal(TIEMPO_MS, 4000);
  let visto;
  const cupos = await pedirCupos(async (url, opciones) => {
    visto = { url, senal: opciones.signal };
    return respuesta({ ok: true, cupos: { medida: 7, wix: 5, squarespace: 3, wordpress: 3 }, reinicia: '2026-11-23' });
  });
  assert.deepEqual(cupos, { medida: 7, wix: 5, squarespace: 3, wordpress: 3 });
  assert.equal(visto.url, URL_CUPOS);
  assert.ok(visto.senal instanceof AbortSignal);
});

test('pedirCupos nunca lanza: red caida, estado de error, JSON invalido o respuesta rara devuelven null', async () => {
  assert.equal(await pedirCupos(async () => { throw new TypeError('Failed to fetch'); }), null);
  assert.equal(await pedirCupos(async () => respuesta({}, { ok: false, status: 403 })), null);
  assert.equal(await pedirCupos(async () => ({ ok: true, json: async () => { throw new SyntaxError('x'); } })), null);
  for (const raro of [null, 'x', 5, [], { ok: false, error: 'no_disponible' }, { ok: true }]) assert.equal(await pedirCupos(async () => respuesta(raro)), null, JSON.stringify(raro));
});

test('pedirCupos se rinde a los 4 s: una consulta colgada no deja la pagina esperando', async () => {
  const t0 = Date.now();
  const cupos = await pedirCupos(
    (url, { signal }) => new Promise((_, rechazar) => signal.addEventListener('abort', () => rechazar(new DOMException('abortado', 'AbortError')))),
    120,
  );
  assert.equal(cupos, null);
  assert.ok(Date.now() - t0 < 1500);
});

test('main.js arranca la promo, y promo.js y cupos.js se precargan en las paginas', () => {
  const main = fs.readFileSync('assets/js/main.js', 'utf8');
  assert.match(main, /import \{ setupPromo \} from '\.\/promo\.js';/);
  assert.match(main, /setupPromo\(\);/);
  for (const page of ['index.html', 'promo/index.html', 'privacidad/index.html', 'cookies/index.html', 'casos/valtre/index.html']) {
    const html = fs.readFileSync(page, 'utf8');
    for (const modulo of ['promo.js', 'cupos.js']) assert.ok(new RegExp(`<link rel="modulepreload" href="[^"]*assets/js/${modulo}">`).test(html), `${page}: falta precargar ${modulo}`);
  }
});

test('promo.js no declara autoplay y el video de la promo solo corre con movimiento (media.js)', () => {
  assert.doesNotMatch(fs.readFileSync('assets/js/promo.js', 'utf8'), /autoplay/);
  const html = fs.readFileSync('promo/index.html', 'utf8');
  assert.doesNotMatch(html.match(/<video[^>]*>/)[0], /autoplay/);
  assert.match(fs.readFileSync('assets/js/media.js', 'utf8'), /c-promo__video-el/);
});

test('cada tarjeta trae su enlace «Avísame el lunes» con el mensaje ya escrito y la opcion en el texto', () => {
  const html = fs.readFileSync('promo/index.html', 'utf8');
  for (const [id, nombre] of [['medida', 'Código a la medida'], ['wix', 'Wix'], ['squarespace', 'Squarespace'], ['wordpress', 'WordPress']]) {
    const url = html.match(new RegExp(`data-plataforma="${id}" data-avisame="([^"]+)"`))[1].replace(/&amp;/g, '&');
    assert.ok(url.startsWith('https://wa.me/528129043592?text='), id);
    const texto = decodeURIComponent(new URL(url).searchParams.get('text'));
    assert.ok(texto.includes(nombre) && /agotada/.test(texto), `${id}: ${texto}`);
  }
});

test('el estilo de la promo solo anima dentro de prefers-reduced-motion: no-preference', () => {
  const scss = fs.readFileSync('src/scss/5-components/_c-promo.scss', 'utf8');
  const marca = scss.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(marca > 0, 'debe tener su bloque de movimiento');
  assert.doesNotMatch(scss.slice(0, marca).replace(/@keyframes[\s\S]*?\n\}\n/g, ''), /transition:|animation:/);
});

test('la lista de paginas con precargas incluye la promo', () => {
  const html = fs.readFileSync('promo/index.html', 'utf8');
  assert.ok(html.indexOf('rel="modulepreload"') < html.indexOf('assets/js/main.js"'));
  assert.match(html, /<link rel="expect" href="#contenido" blocking="render">/);
});
