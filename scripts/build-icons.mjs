import fs from 'node:fs';
import zlib from 'node:zlib';

// Leon en pixeles de 20x20: una sola cuadricula genera todos los iconos.
// Se dibuja la mitad izquierda y se refleja.
// m = melena, W = cara, w = surco de la frente, v = cara en sombra, K = ojo en sombra, R = nariz roja,
// E = oreja, e = interior de la oreja, H = pomulo iluminado, S = sombra bajo el pomulo,
// P = almohadilla del hocico iluminada, . = vacio
const HALF = [
  '.E...mmmmm',
  '.EE.mmmmmm',
  'EeE.mmmmmm',
  'EeEmmWWWWW',
  'mmmmmWWWWW',
  '.mmmmWWWWw',
  'mmmmmWWWWw',
  'mmmmmKKKKW',
  'mmmmmvKKKW',
  '.mmmmHHWWW',
  'mmmmmSSWRR',
  '.mmmmSSWWR',
  'mmmmmWPPWK',
  '.mmmmWPPKW',
  '..mmmmWKWW',
  '..mmmmmWWW',
  '...mmmmmWW',
  '....mmmmmW',
  '.....mmmmm',
  '......mmmm',
];

export const GRID = HALF.map((row) => row + [...row].reverse().join(''));
const N = GRID.length;

const BG = '#0a0a0a';
const RED = '#e10600';

// Luz desde arriba: la melena va de clara a oscura y se oscurece junto a la cara.
function ramp(f, nearFace) {
  const lit = ['#f4f4f4', '#c8c8c8', '#8c8c8c', '#555555'];
  const shade = ['#bcbcbc', '#8e8e8e', '#606060', '#363636'];
  const set = nearFace ? shade : lit;
  return f < 0.25 ? set[0] : f < 0.5 ? set[1] : f < 0.75 ? set[2] : set[3];
}

const FACE_LIKE = 'WwvKHSP';

function colorAt(x, y) {
  const ch = GRID[y][x];
  if (ch === '.') return null;
  if (ch === 'K') return '#050505';
  if (ch === 'R') return RED;
  if (ch === 'e') return '#3a3a3a';
  if (ch === 'H') return '#ffffff';
  if (ch === 'S') return '#9c9c9c';
  if (ch === 'P') return '#f4f4f4';
  if (ch === 'v') return '#c4c4c4';
  if (ch === 'w') return '#ececec';
  if (ch === 'E') return y === 0 ? '#f2f2f2' : y === 1 ? '#d8d8d8' : '#b4b4b4';
  const f = y / N;
  if (ch === 'W') return f < 0.45 ? '#fafafa' : f < 0.7 ? '#e0e0e0' : '#b0b0b0';
  const side = x < N / 2 ? GRID[y][x + 1] : GRID[y][x - 1];
  const nearFace = FACE_LIKE.includes(side);
  const mirrored = x < N / 2 ? x : N - 1 - x;
  let tone = ramp(f, nearFace);
  if (!nearFace && (mirrored + y) % 3 === 0) tone = ramp(Math.min(1, f + 0.25), false);
  return tone;
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function svg() {
  let rects = '';
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const color = colorAt(x, y);
      let end = x + 1;
      while (end < N && colorAt(end, y) === color) end++;
      if (color) rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`;
      x = end;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges"><title>Lex Mendoza</title><rect width="${N}" height="${N}" rx="3.5" fill="${BG}"/>${rects}</svg>\n`;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const cellRgb = (gx, gy) => rgb((gx >= 0 && gx < N && gy >= 0 && gy < N && colorAt(gx, gy)) || BG);

// Pixeles nitidos: cada celda se amplia `scale` veces, con `pad` px de margen.
function renderNearest(scale, pad = 0) {
  const size = N * scale + pad * 2;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const [r, g, b] = cellRgb(Math.floor((px - pad) / scale), Math.floor((py - pad) / scale));
      rgba.set([r, g, b, 255], (py * size + px) * 4);
    }
  }
  return { size, rgba };
}

// Para tamanos que no son multiplo de 20 (favicon de 16, 32 y 48): promedia el area que cubre cada pixel.
function renderArea(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const ss = 6;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let j = 0; j < ss; j++) {
        for (let i = 0; i < ss; i++) {
          const [r, g, b] = cellRgb(Math.floor(((px + (i + 0.5) / ss) / size) * N), Math.floor(((py + (j + 0.5) / ss) / size) * N));
          sum[0] += r;
          sum[1] += g;
          sum[2] += b;
        }
      }
      rgba.set(sum.map((v) => Math.round(v / (ss * ss))).concat(255), (py * size + px) * 4);
    }
  }
  return { size, rgba };
}

const png = ({ size, rgba }) => encodePng(size, rgba);

function ico(sizes) {
  const images = sizes.map((s) => png(renderArea(s)));
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map((image, i) => {
    const entry = Buffer.alloc(16);
    entry[0] = entry[1] = sizes[i];
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });
  return Buffer.concat([head, ...entries, ...images]);
}

function build() {
  fs.mkdirSync('assets/icons', { recursive: true });
  fs.writeFileSync('assets/icons/favicon.svg', svg());
  fs.writeFileSync('assets/icons/favicon.ico', ico([16, 32, 48]));
  fs.writeFileSync('assets/icons/apple-touch-icon.png', png(renderNearest(9)));
  fs.writeFileSync('assets/icons/icon-192.png', png(renderNearest(9, 6)));
  fs.writeFileSync('assets/icons/icon-512.png', png(renderNearest(25, 6)));
  console.log('Iconos generados en assets/icons/');
}

if (process.argv[1]?.endsWith('build-icons.mjs')) build();
