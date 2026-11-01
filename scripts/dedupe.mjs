import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Agrupa imagenes repetidas: copias exactas (mismo contenido) y versiones de la misma imagen
// (reducidas, comprimidas, con otro formato). Cada grupo trae una representante, la de mayor resolucion.
//
// Los iconos y las imagenes chicas solo se agrupan si son copias exactas: a ese tamano muchos
// dibujos distintos se parecen demasiado como para compararlos por su aspecto.
//
// Uso: node scripts/dedupe.mjs <seleccion.json> <salida.json> [--excluir "regex"]

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_DISTANCE = 6; // de 64 bits
const ASPECT_TOLERANCE = 0.05;
const MAX_GRAY_DIFF = 2.5; // diferencia media por pixel (0 a 255) en una version de 48x48 en grises
const MAX_COLOR_DIFF = 8; // diferencia media por canal en una version de 8x8 a color

const sha1 = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');

// Huella perceptual (dHash): compara cada pixel con su vecino en una version de 9x8 en grises.
async function describe(file) {
  try {
    const image = () => sharp(file, { failOn: 'none', limitInputPixels: false });
    const { width, height } = await image().metadata();
    const { data } = await image()
      .flatten({ background: '#ffffff' })
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const raw = (size, grey) => {
      let pipeline = image().flatten({ background: '#ffffff' }).resize(size, size, { fit: 'fill' });
      if (grey) pipeline = pipeline.greyscale();
      return pipeline.removeAlpha().raw().toBuffer();
    };
    const [gray, color] = await Promise.all([raw(48, true), raw(8, false)]);
    const bits = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits.push(data[y * 9 + x] > data[y * 9 + x + 1] ? 1 : 0);
    return { file, sha: sha1(file), width, height, bits, gray, color, size: fs.statSync(file).size, ok: true };
  } catch {
    return { file, ok: false, width: 0, height: 0, size: 0 };
  }
}

const distance = (a, b) => a.reduce((sum, bit, i) => sum + (bit !== b[i] ? 1 : 0), 0);
const meanDiff = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
};
const looksSame = (a, b) =>
  distance(a.bits, b.bits) <= MAX_DISTANCE && meanDiff(a.gray, b.gray) <= MAX_GRAY_DIFF && meanDiff(a.color, b.color) <= MAX_COLOR_DIFF;
const isBig = (info) => info.width >= MIN_WIDTH && info.height >= MIN_HEIGHT;
const sameShape = (a, b) => Math.abs(a.width / a.height - b.width / b.height) <= ASPECT_TOLERANCE * (a.width / a.height);

export async function clusterImages(files) {
  const infos = [];
  for (const file of files) infos.push(await describe(file));

  const parent = infos.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => {
    parent[find(i)] = find(j);
  };

  for (let i = 0; i < infos.length; i++) {
    for (let j = i + 1; j < infos.length; j++) {
      const a = infos[i];
      const b = infos[j];
      if (!a.ok || !b.ok) continue;
      if (a.sha === b.sha) union(i, j);
      else if (isBig(a) && isBig(b) && sameShape(a, b) && looksSame(a, b)) union(i, j);
    }
  }

  const groups = new Map();
  infos.forEach((info, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(info);
  });

  return [...groups.values()]
    .map((members) => {
      const ordered = [...members].sort((a, b) => b.width * b.height - a.width * a.height || b.size - a.size || a.file.localeCompare(b.file));
      return { representative: ordered[0].file, variants: ordered.slice(1).map((m) => m.file).sort() };
    })
    .sort((a, b) => a.representative.localeCompare(b.representative, 'es', { numeric: true }));
}

if (process.argv[1]?.endsWith('dedupe.mjs')) {
  const [input, output] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const flag = process.argv.indexOf('--excluir');
  const exclude = flag > -1 ? new RegExp(process.argv[flag + 1], 'i') : null;
  if (!input || !output) {
    console.error('Uso: node scripts/dedupe.mjs <seleccion.json> <salida.json> [--excluir "regex"]');
    process.exit(1);
  }
  const selection = JSON.parse(fs.readFileSync(input, 'utf8'));
  const mine = selection.mine.filter((file) => fs.existsSync(file) && (!exclude || !exclude.test(file)));
  const clusters = await clusterImages(mine);
  fs.writeFileSync(output, JSON.stringify({ total: mine.length, groups: clusters.length, clusters }, null, 2));
  console.log(`${mine.length} imagenes marcadas -> ${clusters.length} grupos (${mine.length - clusters.length} repetidas). Guardado en ${path.resolve(output)}`);
}
