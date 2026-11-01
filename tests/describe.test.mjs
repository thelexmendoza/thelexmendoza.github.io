import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeName, altFor } from '../scripts/describe.mjs';

test('quita copias, versiones, fechas y codigos de produccion del nombre del archivo', () => {
  assert.equal(describeName('Linked In Banner copia 2.png'), 'LinkedIn Banner');
  assert.equal(describeName('ERPImplementación V1 copia 3.jpg'), 'ERP Implementación');
  assert.equal(describeName('Album FB 11 7 25 S1 copia.png'), 'Álbum de Facebook');
  assert.equal(describeName('Carrusel 1 7 26 S8.png'), 'Carrusel');
  assert.equal(describeName('10 02 25 Webinar2.png'), 'Webinar');
  assert.equal(describeName('02 25 Webinar CloudIntegration2025.png'), 'Webinar Cloud Integration');
});

test('un nombre generico no describe nada y se descarta', () => {
  for (const name of ['Mesa de trabajo 1.png', 'Mesa de trabajo 1 copia.png', 'Artboard 3.png', 'IMG_4821.jpg', 'DSC0012.jpg', 'Untitled-1.png', 'Sin título 2.png', 'Captura de pantalla 2025.png', '6e95faaa37.webp', '12.png', 'copia.png']) {
    assert.equal(describeName(name), '', name);
  }
});

test('un nombre descriptivo se conserva', () => {
  assert.equal(describeName('QA AI Engineer 7 2.png'), 'QA AI Engineer');
  assert.equal(describeName('Valtre Meeting Back Green Solutions.png'), 'Valtre Meeting Back Green Solutions');
});

test('el texto alternativo usa el tema y, si el nombre es generico, solo el tema', () => {
  assert.equal(altFor('Campaña de lanzamiento', 'Mesa de trabajo 1 copia.png'), 'Campaña de lanzamiento');
  assert.equal(altFor('Logotipos', 'Linked In Banner copia.png'), 'Logotipos: LinkedIn Banner');
});

test('las descargas de redes y los nombres de una a tres letras tampoco describen nada', () => {
  for (const name of ['284262625_2527098404086826_7359412978991243_n.jpg', '586677836_18518598463066847_3537623651329638419_n.jpg', 'download.jpg', 'download (3).png', 'll.png', 'WhatsApp Image 2026-02-18 at 7.45.38 PM.jpeg', 'Imagen de WhatsApp 2024-04-27 a las 16.22.54_1038ee5f.jpg']) {
    assert.equal(describeName(name), '', name);
  }
});

test('un nombre corto pero con sentido se conserva', () => {
  assert.equal(describeName('Cartel Beats Bites.jpg'), 'Cartel Beats Bites');
});
