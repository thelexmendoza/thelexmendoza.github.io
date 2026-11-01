import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import crypto from 'node:crypto';
import { buildCase } from '../scripts/build-case.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-'));
const src = path.join(tmp, 'origen');
const site = path.join(tmp, 'sitio');

before(async () => {
  fs.mkdirSync(src, { recursive: true });
  const art = (w, h, color) => sharp({ create: { width: w, height: h, channels: 3, background: color } });
  await art(2000, 2500, '#e10600').png().toFile(path.join(src, 'Carrusel - 9-7-26 - S2-100.png'));
  await art(300, 400, '#0066b1').jpeg().toFile(path.join(src, 'chica.jpg'));
  await art(2000, 2500, '#e10600').png().toFile(path.join(src, 'copia-identica.png'));
  fs.copyFileSync(path.join(src, 'Carrusel - 9-7-26 - S2-100.png'), path.join(src, 'copia-identica.png'));
  fs.writeFileSync(path.join(src, 'Icono@2x.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8"/></svg>');
  fs.writeFileSync(path.join(src, 'roto.png'), 'no es una imagen');
});

const plan = () => ({
  slug: 'demo',
  key: 'valtre',
  title: 'Demo',
  eyebrow: 'identidad',
  meta: '2024',
  summary: 'Resumen.',
  teaser: { chapter: 'uno', text: 'Gancho.' },
  chapters: [
    {
      id: 'uno',
      title: 'Uno',
      eyebrow: 'x',
      text: ['Texto.'],
      groups: [
        { kind: 'disenos', topic: 'Carruseles', files: [path.join(src, 'Carrusel - 9-7-26 - S2-100.png'), path.join(src, 'chica.jpg'), path.join(src, 'copia-identica.png'), path.join(src, 'roto.png'), path.join(tmp, 'no-existe.png')] },
        { kind: 'iconos', topic: 'Iconos', files: [path.join(src, 'Icono@2x.svg')] },
      ],
    },
  ],
});

test('optimiza cada imagen en dos tamanos webp y no agranda las chicas', async () => {
  const result = await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/demo.json'), 'utf8'));
  const [big, small] = data.chapters[0].groups[0].items;
  const sizeOf = async (file) => (await sharp(path.join(site, file)).metadata()).width;
  assert.equal(await sizeOf(big.src), 640);
  assert.equal(await sizeOf(big.full), 1200);
  assert.equal(await sizeOf(small.full), 300, 'una imagen chica no se agranda');
  assert.ok(result.items >= 3);
});

test('las copias identicas se publican una sola vez', async () => {
  await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/demo.json'), 'utf8'));
  assert.equal(data.chapters[0].groups[0].items.length, 2);
});

test('los archivos ilegibles o inexistentes se reportan y no detienen el proceso', async () => {
  const result = await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  assert.equal(result.failed.length, 2);
  assert.ok(result.failed.some((f) => f.endsWith('roto.png')));
  assert.ok(result.failed.some((f) => f.endsWith('no-existe.png')));
});

test('los datos publicos no contienen rutas privadas del disco', async () => {
  await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const json = fs.readFileSync(path.join(site, 'data/casos/demo.json'), 'utf8');
  assert.doesNotMatch(json, /origen|sitio|C:|E:|A:|\\\\/);
  const html = fs.readFileSync(path.join(site, 'casos/demo/index.html'), 'utf8');
  assert.doesNotMatch(html, /origen|[A-E]:[\\/]/);
});

test('un icono svg ligero se conserva como svg', async () => {
  await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/demo.json'), 'utf8'));
  const icon = data.chapters[0].groups[1].items[0];
  assert.match(icon.src, /\.svg$/);
  assert.ok(fs.existsSync(path.join(site, icon.src)));
});

test('el texto alternativo sale del tema y del nombre limpio del archivo', async () => {
  await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/demo.json'), 'utf8'));
  assert.equal(data.chapters[0].groups[0].items[0].alt, 'Carruseles: Carrusel');
  assert.equal(data.chapters[0].groups[1].items[0].alt, 'Iconos: Icono');
});

test('escribe la pagina del caso y puede volver a generarla sin tocar las imagenes', async () => {
  await buildCase(plan(), { root: site, layoutPath: 'index.html' });
  const page = path.join(site, 'casos/demo/index.html');
  assert.match(fs.readFileSync(page, 'utf8'), /<section class="c-chapter" id="uno"/);
  fs.rmSync(page);
  const result = await buildCase(plan(), { root: site, layoutPath: 'index.html', skipImages: true });
  assert.ok(fs.existsSync(page));
  assert.equal(result.items, 3);
});

test('en los logotipos mide si el dibujo es claro u oscuro para elegir el fondo de la casilla', async () => {
  const logosDir = path.join(tmp, 'logos');
  fs.mkdirSync(logosDir, { recursive: true });
  fs.writeFileSync(path.join(logosDir, 'claro.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect x="20" y="20" width="160" height="40" fill="#ffffff"/></svg>');
  fs.writeFileSync(path.join(logosDir, 'oscuro.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect x="20" y="20" width="160" height="40" fill="#101010"/></svg>');
  await sharp({ create: { width: 400, height: 300, channels: 3, background: '#335577' } }).jpeg().toFile(path.join(logosDir, 'opaco.jpg'));
  const logoPlan = { ...plan(), slug: 'logos-demo', chapters: [{ ...plan().chapters[0], groups: [{ kind: 'logos', topic: 'Logotipos', files: ['claro.svg', 'oscuro.svg', 'opaco.jpg'].map((f) => path.join(logosDir, f)) }] }] };
  await buildCase(logoPlan, { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/logos-demo.json'), 'utf8'));
  const [claro, oscuro, opaco] = data.chapters[0].groups[0].items;
  assert.equal(claro.tone, 'light');
  assert.equal(oscuro.tone, 'dark');
  assert.equal(opaco.tone, undefined, 'una imagen opaca no necesita fondo especial');
});

test('una pieza con nombre generico se describe con su tema y se avisa de que falta un pie', async () => {
  const dir = path.join(tmp, 'genericos');
  fs.mkdirSync(dir, { recursive: true });
  await sharp({ create: { width: 400, height: 300, channels: 3, background: '#224466' } }).jpeg().toFile(path.join(dir, 'Mesa de trabajo 1 copia.jpg'));
  await sharp({ create: { width: 400, height: 300, channels: 3, background: '#664422' } }).jpeg().toFile(path.join(dir, 'Banner de bienvenida.jpg'));
  const file = (n) => path.join(dir, n);
  const p = { ...plan(), slug: 'genericos-demo', chapters: [{ ...plan().chapters[0], groups: [{ kind: 'disenos', topic: 'Campaña', files: [file('Mesa de trabajo 1 copia.jpg'), file('Banner de bienvenida.jpg')] }] }] };
  const result = await buildCase(p, { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/genericos-demo.json'), 'utf8'));
  const [generic, named] = data.chapters[0].groups[0].items;
  assert.equal(generic.alt, 'Campaña');
  assert.equal(named.alt, 'Campaña: Banner de bienvenida');
  assert.deepEqual(result.generic, [file('Mesa de trabajo 1 copia.jpg')]);
  const withCaption = { ...p, chapters: [{ ...p.chapters[0], groups: [{ ...p.chapters[0].groups[0], captions: { [file('Mesa de trabajo 1 copia.jpg')]: 'Mesa de bienvenida con el logotipo' } }] }] };
  const again = await buildCase(withCaption, { root: site, layoutPath: 'index.html' });
  assert.deepEqual(again.generic, [], 'con un pie escrito a mano ya no se avisa');
});

test('las imagenes de la tarjeta se toman de las piezas ya publicadas, por su id, y se guardan en los datos', async () => {
  const sha = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
  const a = path.join(src, 'chica.jpg');
  const b = path.join(src, 'Carrusel - 9-7-26 - S2-100.png');
  const p = { ...plan(), slug: 'tarjeta-demo', card: { images: [sha(b), 'noexiste00', sha(a)] } };
  await buildCase(p, { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/tarjeta-demo.json'), 'utf8'));
  assert.deepEqual(data.card.images.map((i) => i.id), [sha(b), sha(a)], 'respeta el orden y omite ids que no existen');
  for (const image of data.card.images) {
    assert.match(image.src, /-640\.webp$/);
    assert.match(image.full, /-1200\.webp$/);
    assert.ok(image.width > 0 && image.height > 0);
  }
  const html = fs.readFileSync(path.join(site, 'casos/tarjeta-demo/index.html'), 'utf8');
  assert.match(html, /class="c-case-hero__media"/);
  const without = await buildCase({ ...plan(), slug: 'sin-tarjeta' }, { root: site, layoutPath: 'index.html' });
  assert.ok(without.items > 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(site, 'data/casos/sin-tarjeta.json'), 'utf8')).card, undefined);
});

test('un grupo de sitios optimiza las capturas en tres proporciones y guarda su enlace, su color y sus textos', async () => {
  const shots = path.join(tmp, 'sitios');
  fs.mkdirSync(shots, { recursive: true });
  const art = (w, h, color) => sharp({ create: { width: w, height: h, channels: 3, background: color } }).png();
  await art(1440, 900, '#112233').toFile(path.join(shots, 'beyond-desktop.png'));
  await art(820, 1180, '#223344').toFile(path.join(shots, 'beyond-tablet.png'));
  await art(390, 844, '#334455').toFile(path.join(shots, 'beyond-mobile.png'));
  const entry = { slug: 'beyond', title: 'CiiSA Beyond 2026', url: 'https://beyond.ciisa.com/', tags: 'Evento · 2026', text: 'Registro y agenda.', color: '#b7ec04', shots: { desktop: path.join(shots, 'beyond-desktop.png'), tablet: path.join(shots, 'beyond-tablet.png'), mobile: path.join(shots, 'beyond-mobile.png') } };
  const p = { ...plan(), slug: 'sitios-demo', card: { images: ['beyond', 'beyond:tablet', 'beyond:mobile'] }, chapters: [{ ...plan().chapters[0], groups: [{ kind: 'sitios', topic: 'Sitios publicados', sites: [entry] }] }] };
  const result = await buildCase(p, { root: site, layoutPath: 'index.html' });
  assert.deepEqual(result.failed, []);
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/sitios-demo.json'), 'utf8'));
  const [item] = data.chapters[0].groups[0].items;
  assert.equal(item.id, 'beyond');
  assert.equal(item.url, 'https://beyond.ciisa.com/');
  assert.equal(item.domain, 'beyond.ciisa.com');
  assert.equal(item.color, '#b7ec04');
  assert.equal(item.alt, 'Vista previa de CiiSA Beyond 2026');
  const sizeOf = async (file) => (await sharp(path.join(site, file)).metadata()).width;
  assert.equal(await sizeOf(item.src), 640);
  assert.equal(await sizeOf(item.full), 1200);
  assert.equal(await sizeOf(item.shots.tablet.src), 820);
  assert.equal(await sizeOf(item.shots.mobile.src), 390);
  assert.ok(item.shots.mobile.height > item.shots.mobile.width);
  assert.equal(data.chapters[0].groups[0].sites, undefined, 'las rutas del disco no se publican');
  assert.deepEqual(data.card.images.map((i) => i.id), ['beyond', 'beyond:tablet', 'beyond:mobile']);
  assert.match(data.card.images[1].full, /beyond-tablet-820\.webp$/);
  assert.doesNotMatch(JSON.stringify(data), /sitios[\/]beyond|C:|A:/);
});

test('una captura que falta se reporta y el sitio se publica con las que si existen', async () => {
  const shots = path.join(tmp, 'sitios2');
  fs.mkdirSync(shots, { recursive: true });
  await sharp({ create: { width: 1440, height: 900, channels: 3, background: '#112233' } }).png().toFile(path.join(shots, 'a-desktop.png'));
  const entry = { slug: 'a', title: 'A', url: 'https://a.example.com/', tags: 'x', text: 'x', color: '#ffffff', shots: { desktop: path.join(shots, 'a-desktop.png'), mobile: path.join(shots, 'no-existe.png') } };
  const p = { ...plan(), slug: 'sitios-faltan', chapters: [{ ...plan().chapters[0], groups: [{ kind: 'sitios', topic: 'S', sites: [entry] }] }] };
  const result = await buildCase(p, { root: site, layoutPath: 'index.html' });
  assert.equal(result.failed.length, 1);
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/sitios-faltan.json'), 'utf8'));
  assert.equal(data.chapters[0].groups[0].items[0].shots.mobile, undefined);
});

test('el fondo de la tarjeta puede mezclar videos ya optimizados con imagenes, en el orden del plan', async () => {
  const dir = path.join(site, 'assets/video/casos/media-demo');
  fs.mkdirSync(dir, { recursive: true });
  for (const key of ['h', 'v']) {
    fs.writeFileSync(path.join(dir, `clip-${key}.mp4`), 'no es un video de verdad');
    await sharp({ create: { width: key === 'h' ? 1280 : 540, height: key === 'h' ? 720 : 960, channels: 3, background: '#123456' } }).webp().toFile(path.join(dir, `clip-${key}-poster.webp`));
  }
  const sha = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
  const b = path.join(src, 'Carrusel - 9-7-26 - S2-100.png');
  const p = { ...plan(), slug: 'media-demo', card: { media: [{ video: 'clip' }, { image: sha(b) }, { video: 'no-existe' }] } };
  const result = await buildCase(p, { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/media-demo.json'), 'utf8'));
  assert.equal(data.card.media.length, 2, 'el video que no existe se omite');
  const [video, image] = data.card.media;
  assert.equal(video.type, 'video');
  assert.equal(video.desktop, 'assets/video/casos/media-demo/clip-h.mp4');
  assert.equal(video.mobile, 'assets/video/casos/media-demo/clip-v.mp4');
  assert.equal(video.poster, 'assets/video/casos/media-demo/clip-h-poster.webp');
  assert.equal(video.posterMobile, 'assets/video/casos/media-demo/clip-v-poster.webp');
  assert.deepEqual([video.width, video.height], [1280, 720]);
  assert.equal(image.type, 'image');
  assert.match(image.src, /-640\.webp$/);
  assert.ok(result.failed.some((f) => f.includes('no-existe')), 'se reporta el video que falta');
  const html = fs.readFileSync(path.join(site, 'casos/media-demo/index.html'), 'utf8');
  assert.match(html, /<video class="c-case-hero__video"/);
  assert.doesNotMatch(JSON.stringify(data), /C:|A:|E:/);
});

test('el cielo animado es un tipo de fondo mas: se guarda por su id y no necesita archivos', async () => {
  const p = { ...plan(), slug: 'cielo-demo', card: { media: [{ sky: 'adobe' }] } };
  await buildCase(p, { root: site, layoutPath: 'index.html' });
  const data = JSON.parse(fs.readFileSync(path.join(site, 'data/casos/cielo-demo.json'), 'utf8'));
  assert.deepEqual(data.card.media, [{ type: 'sky', id: 'adobe' }]);
  const html = fs.readFileSync(path.join(site, 'casos/cielo-demo/index.html'), 'utf8');
  assert.match(html, /<span class="c-sky" data-sky="adobe" aria-hidden="true"><span class="c-sky__aurora"><\/span><canvas class="c-sky__stars"><\/canvas><\/span>/);
});
