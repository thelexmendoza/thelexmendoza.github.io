import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIN_PROMO, LIMITES, contarHacia, estadoCupo, formatoPesos, promoVigente, resumenLugares } from '../assets/js/cupos.js';

test('los limites semanales suman 21 y la promo cierra el 31 de diciembre de 2026', () => {
  assert.deepEqual(LIMITES, { medida: 10, wix: 5, squarespace: 3, wordpress: 3 });
  assert.equal(Object.values(LIMITES).reduce((a, b) => a + b, 0), 21);
  assert.equal(FIN_PROMO, '2026-12-31T23:59:59-06:00');
});

test('estadoCupo: quedan N, ultimo lugar y agotado', () => {
  assert.deepEqual(estadoCupo(5), { estado: 'disponible', texto: 'Quedan 5 lugares', libres: 5 });
  assert.deepEqual(estadoCupo(2), { estado: 'disponible', texto: 'Quedan 2 lugares', libres: 2 });
  assert.deepEqual(estadoCupo(1), { estado: 'ultimo', texto: 'Último lugar', libres: 1 });
  assert.deepEqual(estadoCupo(0), { estado: 'agotado', texto: 'Agotado esta semana', libres: 0 });
});

test('estadoCupo: un valor raro se trata como desconocido, con el texto fijo', () => {
  for (const raro of [-1, 'x', '3', null, undefined, 2.5, NaN, Infinity, {}, [], true]) {
    assert.deepEqual(estadoCupo(raro), { estado: 'desconocido', texto: 'Lugares limitados cada semana', libres: null }, String(raro));
  }
});

test('resumenLugares suma las cuatro plataformas sobre 21', () => {
  const r = resumenLugares({ medida: 7, wix: 5, squarespace: 3, wordpress: 3 });
  assert.equal(r.total, 18);
  assert.equal(r.texto, 'Esta semana quedan 18 de 21 lugares. Se reinician el lunes');
  assert.equal(resumenLugares({ medida: 0, wix: 0, squarespace: 0, wordpress: 0 }).texto, 'Esta semana se agotaron los lugares. Se reinician el lunes');
  assert.equal(resumenLugares({ medida: 1, wix: 0, squarespace: 0, wordpress: 0 }).texto, 'Esta semana queda 1 de 21 lugares. Se reinician el lunes');
});

test('resumenLugares: si falta una plataforma o algo no es valido, queda el texto fijo', () => {
  const fijo = { texto: 'Lugares limitados cada semana', total: null };
  assert.deepEqual(resumenLugares({ medida: 7, wix: 5, squarespace: 3 }), fijo);
  assert.deepEqual(resumenLugares({ medida: 7, wix: -2, squarespace: 3, wordpress: 3 }), fijo);
  assert.deepEqual(resumenLugares({ medida: 'a', wix: 5, squarespace: 3, wordpress: 3 }), fijo);
  for (const raro of [null, undefined, 'x', 5, [], {}]) assert.deepEqual(resumenLugares(raro), fijo);
});

test('promoVigente: hasta el cierre del 31 de diciembre (hora de Monterrey)', () => {
  assert.equal(promoVigente(new Date('2026-11-17T12:00:00-06:00')), true);
  assert.equal(promoVigente(new Date('2026-12-31T20:00:00-06:00')), true);
  assert.equal(promoVigente(new Date('2027-01-01T00:00:00-06:00')), false);
  assert.equal(promoVigente(new Date('invalido')), true, 'una fecha invalida no cierra la promo');
});

test('formatoPesos: signo de pesos y comas de miles, como en los precios de la pagina', () => {
  assert.equal(formatoPesos(549), '$549');
  assert.equal(formatoPesos(1290), '$1,290');
  assert.equal(formatoPesos(2190), '$2,190');
  assert.equal(formatoPesos(0), '$0');
});

test('contarHacia: el conteo de un precio empieza en 0, termina exacto y nunca se pasa ni baja', () => {
  for (const final of [549, 1290, 1990, 2190]) {
    assert.equal(contarHacia(final, 0), 0);
    assert.equal(contarHacia(final, 1), final);
    let anterior = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = contarHacia(final, t);
      assert.ok(Number.isInteger(v) && v >= 0 && v <= final, `${final} @ ${t}: ${v}`);
      assert.ok(v >= anterior, 'no baja');
      anterior = v;
    }
  }
  assert.equal(contarHacia(549, -3), 0, 't negativo');
  assert.equal(contarHacia(549, 7), 549, 't mayor que 1');
  assert.equal(contarHacia(549, NaN), 549, 'un valor raro muestra el precio final, nunca uno inventado');
});
