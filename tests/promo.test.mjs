import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderPromo } from '../scripts/render-promo.mjs';
import { promo } from '../scripts/promo/promo.mjs';

const html = fs.readFileSync('promo/index.html', 'utf8');

test('promo/index.html coincide con lo que genera el script (no se edita a mano): corre npm run promo', () => {
  assert.equal(html, renderPromo(promo));
});

test('las cuatro opciones llevan su precio, sus dias y su plataforma, con IVA incluido', () => {
  const esperado = [
    ['medida', '$549', '5 días hábiles'],
    ['wix', '$1,290', '7 días hábiles'],
    ['squarespace', '$1,990', '10 días hábiles'],
    ['wordpress', '$2,190', '8 días hábiles'],
  ];
  for (const [id, precio, dias] of esperado) {
    const card = html.match(new RegExp(`<li class="c-promo__plan" data-plataforma="${id}"[\\s\\S]*?</li>\\s*(?=<li class="c-promo__plan"|</ul>)`))?.[0];
    assert.ok(card, `falta la tarjeta ${id}`);
    assert.ok(card.includes(`>${precio}</span>`) && card.includes('class="c-promo__monto"'), `${id}: precio`);
    assert.ok(card.includes(dias), `${id}: dias`);
    assert.ok(card.includes('IVA incluido'), `${id}: IVA`);
  }
  assert.match(html, /Publicación asistida[\s\S]{0,80}\$390/);
});

test('el boton principal va al brief y el segundo a WhatsApp con un mensaje ya escrito', () => {
  assert.ok(html.includes('href="https://brief.lexmendoza.com/"'));
  assert.match(html, /href="https:\/\/wa\.me\/528129043592\?text=[^"]+"/);
  assert.match(html, /Cotiza con la promo/);
});

test('hay un solo h1, el cierre del 31 de diciembre y el letrero de lugares con texto fijo', () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(html, /hasta el 31 de diciembre de 2026 o hasta agotar lugares/i);
  assert.match(html, /<p class="c-promo__resumen"[^>]*data-promo-resumen[^>]*>[\s\S]*Lugares limitados cada semana/);
});

test('sin JavaScript todo esta en el HTML: pasos, precios, incluye, casos y preguntas', () => {
  for (const texto of ['Respondes el brief', 'Ves tu página armarse', 'Yo la armo y la publico', 'Qué incluye', 'Qué no incluye', 'Mira cómo trabajo', 'Preguntas frecuentes']) assert.ok(html.includes(texto), texto);
  assert.equal((html.match(/<details class="c-promo__pregunta"/g) ?? []).length, promo.faq.length);
  assert.ok(promo.faq.length >= 7);
});

test('los tres casos de prueba enlazan a sus paginas', () => {
  for (const slug of ['ciisa-psw', 'motociclismo', 'daniel-abrego']) assert.ok(html.includes(`href="../casos/${slug}/"`), slug);
});

test('el texto respeta las reglas: sin olas, sin precios tachados, sin promesas ni urgencia falsa', () => {
  const texto = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  assert.doesNotMatch(texto, /\bolas?\b/i);
  assert.doesNotMatch(texto, /<del|<s>|<strike|line-through/i);
  assert.doesNotMatch(texto, /garantiz|la mejor|la más barata|últimas horas|solo hoy|cuenta regresiva/i);
  assert.doesNotMatch(texto, /contraseña[^.]{0,40}(dame|dime|mándame|envíame)/i);
});

test('la guia de dominio y hosting se enlaza desde las preguntas y los textos se escapan', () => {
  assert.ok(html.includes('href="../guia-dominio-hosting/"'));
  const raro = renderPromo({ ...promo, hero: { ...promo.hero, titulo: 'A <b>&</b> B' } });
  assert.doesNotMatch(raro, /A <b>&<\/b> B/);
});

test('la pagina se puede indexar y tiene su canonica', () => {
  assert.doesNotMatch(html, /name="robots"[^>]*noindex/);
  assert.ok(html.includes('<link rel="canonical" href="https://lexmendoza.com/promo/">'));
});

test('la landing reutiliza los detalles del sitio: hero con retícula, cinta decorativa y marcas en las tarjetas', () => {
  const hero = html.match(/<section class="c-hero c-promo__hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, 'el hero usa c-hero para recibir la reticula y el parallax de hero-fx.js');
  assert.match(hero, /<div class="c-hero__backdrop" aria-hidden="true">\s*<span class="c-hero__grid"><\/span>/);
  const cinta = html.match(/<div class="c-ticker" aria-hidden="true">[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(cinta, 'hay una cinta');
  assert.equal((cinta.match(/<div class="c-ticker__group">/g) ?? []).length, 2, 'dos grupos iguales para el bucle');
  assert.match(cinta, /Lugares limitados cada semana/);
  assert.doesNotMatch(cinta, /<a /, 'la cinta no tiene enlaces');
});

test('cada opcion trae su medidor de lugares: un segmento por lugar de la semana, decorativo y vacio sin JavaScript', () => {
  const lugares = { medida: 10, wix: 5, squarespace: 3, wordpress: 3 };
  for (const [id, limite] of Object.entries(lugares)) {
    const card = html.match(new RegExp(`<li class="c-promo__plan" data-plataforma="${id}"[\\s\\S]*?</li>\\s*(?=<li class="c-promo__plan"|</ul>)`))[0];
    const medidor = card.match(/<span class="c-promo__medidor" aria-hidden="true">([\s\S]*?)<\/span>/)[1];
    assert.equal((medidor.match(/<i /g) ?? []).length, limite, id);
    assert.doesNotMatch(medidor, /is-libre/, `${id}: sin JavaScript no se afirma ningun lugar libre`);
  }
});

test('el indicador de «en vivo» solo late cuando llegaron datos: en el HTML no esta activo', () => {
  assert.match(html, /<span class="c-promo__vivo" aria-hidden="true"><\/span>/);
  assert.doesNotMatch(html, /is-vivo/);
});

test('los precios llevan un ancho minimo para que el conteo no mueva el diseño', () => {
  for (const precio of ['$549', '$1,290', '$1,990', '$2,190']) {
    assert.match(html, new RegExp(`<span class="c-promo__monto" style="min-inline-size: ${precio.length}ch">${precio.replace('$', '\\$')}</span>`));
  }
});

test('el hero lleva de fondo la maqueta que se arma: bloques de linea decorativos, con un bloque de acento', () => {
  const fondo = html.match(/<div class="c-hero__backdrop" aria-hidden="true">([\s\S]*?)<\/div>\s*<div class="o-container/)[1];
  const maqueta = fondo.match(/<span class="c-promo__maqueta">([\s\S]*?)<\/span>\s*<\/div>|<span class="c-promo__maqueta">([\s\S]*?)<\/span>\s*$/)?.[0] ?? fondo;
  const bloques = maqueta.match(/<i [^>]*><\/i>/g) ?? [];
  assert.ok(bloques.length >= 14 && bloques.length <= 24, `bloques: ${bloques.length}`);
  assert.ok(bloques.some((b) => b.includes('is-acento')), 'un bloque con el acento (el boton)');
  for (const b of bloques) assert.match(b, /style="--i: \d+; --x: [\d.]+; --y: [\d.]+; --w: [\d.]+; --h: [\d.]+"/, b);
  assert.match(fondo, /<span class="c-hero__grid"><\/span>/, 'conserva la reticula del hero');
});

test('el body lleva un plano aureo fijo y numeros fantasma por seccion, todo decorativo y sin texto para lectores', () => {
  const main = html.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(main, /<main[^>]*>\s*<div class="c-promo__fondo" aria-hidden="true">\s*<svg/);
  assert.match(html, /vector-effect="non-scaling-stroke"/);
  const fantasmas = [...main.matchAll(/<span class="c-promo__fantasma c-promo__fantasma--(?:der|izq)" aria-hidden="true">([^<]*)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(fantasmas, ['5', '549', '15', '?', '31/12']);
  assert.equal((main.match(/c-promo__seccion/g) ?? []).length, 5);
});

test('los fondos solo se mueven con preferencia de movimiento y el parallax va ligado al scroll dentro de @supports', () => {
  const scss = fs.readFileSync('src/scss/5-components/_c-promo.scss', 'utf8');
  const marca = scss.indexOf('prefers-reduced-motion: no-preference');
  assert.ok(marca > 0);
  assert.doesNotMatch(scss.slice(0, marca), /animation-timeline|animation:|transition:/);
  const movimiento = scss.slice(marca);
  assert.match(movimiento, /@supports \(animation-timeline: scroll\(\)\)/);
  assert.match(movimiento, /@supports \(animation-timeline: view\(\)\)/);
  assert.match(movimiento, /animation-timeline: scroll\(root\)/);
  assert.match(movimiento, /c-promo-armar/);
});
