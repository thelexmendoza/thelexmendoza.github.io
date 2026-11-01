import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

sharp.cache(false);

// Encuentra los iconos de unas carpetas sin pedirle a nadie que los marque.
//
// Un archivo cuenta como icono si es un SVG ligero, o un PNG/WebP pequeno (hasta 512 px, y con
// transparencia o de 200 px o menos). Del mismo icono en varios formatos o tamanos (`@2x`, `@3x`,
// `-48`, SVG y PNG) se queda la mejor version: SVG primero y, entre PNG, el mas grande.
// Un icono repetido en otro origen solo aparece en el primero.

const MAX_RASTER = 512;
const MAX_OPAQUE_RASTER = 200;
const MAX_SVG_BYTES = 40 * 1024;
const MAX_ASPECT = 1.7; // un icono casi nunca es mucho mas ancho que alto: eso son etiquetas de texto y wordmarks
const SIZES = '16|18|20|24|28|32|36|40|48|56|64|72|96|128|144|192|256|512';

// "Icono-Nube@2x.png", "icono nube_48px.png" e "icono-nube-32.svg" son el mismo icono.
export function iconKey(file) {
  return path
    .basename(file, path.extname(file))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/@\dx/g, '')
    .replace(new RegExp(`[-_ ]?(${SIZES})\\s*(px)?$`), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function walk(dir, exclude, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // Las rutas de Windows llevan "\": se comparan con "/" para que un mismo patron sirva en ambos.
    if (exclude && exclude.test(full.replace(/\\/g, '/'))) continue;
    if (entry.isDirectory()) walk(full, exclude, out);
    else if (/\.(svg|png|webp)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function inspect(file, maxAspect) {
  const ext = path.extname(file).slice(1).toLowerCase();
  try {
    const bytes = fs.statSync(file).size;
    if (ext === 'svg' && bytes > MAX_SVG_BYTES) return null;
    const { width, height, hasAlpha } = await sharp(file, { failOn: 'none', limitInputPixels: false }).metadata();
    if (!width || !height) return null;
    if (Math.max(width / height, height / width) > maxAspect) return null;
    if (ext !== 'svg') {
      const big = Math.max(width, height);
      if (big > MAX_RASTER || (!hasAlpha && big > MAX_OPAQUE_RASTER)) return null;
    }
    return { file, ext, area: width * height, key: iconKey(file), sha: crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex') };
  } catch {
    return null;
  }
}

const better = (a, b) => (a.ext === 'svg') !== (b.ext === 'svg') ? a.ext === 'svg' : a.area > b.area;
const natural = (a, b) => a.localeCompare(b, 'es', { numeric: true });

export async function findIcons(sources) {
  const seenKeys = new Set();
  const seenShas = new Set();
  const groups = [];

  for (const source of sources) {
    if (!fs.existsSync(source.path)) {
      groups.push({ topic: source.topic, files: [] });
      continue;
    }
    const exclude = source.exclude ? new RegExp(source.exclude, 'i') : null;
    const best = new Map();
    for (const file of walk(source.path, exclude).sort(natural)) {
      const info = await inspect(file, source.maxAspect ?? MAX_ASPECT);
      if (!info) continue;
      const current = best.get(info.key);
      if (!current || better(info, current)) best.set(info.key, info);
    }
    const files = [];
    for (const info of [...best.values()].sort((a, b) => natural(a.file, b.file))) {
      if (seenKeys.has(info.key) || seenShas.has(info.sha)) continue;
      seenKeys.add(info.key);
      seenShas.add(info.sha);
      files.push(info.file);
    }
    groups.push({ topic: source.topic, files });
  }
  return groups;
}
