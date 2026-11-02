import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { renderCase } from './render-case.mjs';
import { altFor, describeName } from './describe.mjs';

// Construye un caso: optimiza las imagenes elegidas, escribe los datos publicos (sin rutas del
// disco) y genera la pagina.
//
//   node scripts/build-case.mjs <plan.json> [--sin-imagenes]
//
// El plan vive en private/ (trae las rutas de origen). Lo que se publica son los datos limpios en
// data/casos/<slug>.json, las imagenes en assets/img/casos/<slug>/ y la pagina en casos/<slug>/.

// En Windows el cache de archivos de sharp deja abiertos los que ya escribio y falla al reescribirlos.
sharp.cache(false);

const SRC_WIDTH = 640;
const FULL_WIDTH = 1200;
const ICON_WIDTH = 256;
const MAX_SVG_BYTES = 40 * 1024;

const sha1 = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10);

const open = (file) => sharp(file, { failOn: 'none', limitInputPixels: false, density: 288 });

// Un logotipo con transparencia es claro u oscuro segun el brillo medio de lo que se dibuja; asi la
// casilla elige un fondo donde se vea. Una imagen opaca o de tono medio no necesita fondo especial.
async function toneOf(file) {
  const { data } = await open(file).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let drawn = 0;
  let clear = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) clear++;
    else {
      sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      drawn++;
    }
  }
  if (!drawn || !clear) return undefined;
  const mean = sum / drawn;
  return mean > 0.62 ? 'light' : mean < 0.38 ? 'dark' : undefined;
}

async function webp(file, width, out) {
  await open(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  return (await sharp(out).metadata()).width;
}

async function processItem(file, group, dirs) {
  const id = sha1(file);
  const rel = (name) => `${dirs.rel}/${name}`;
  const alt = altFor(group.topic, file);

  if (group.kind === 'iconos') {
    if (path.extname(file).toLowerCase() === '.svg' && fs.statSync(file).size <= MAX_SVG_BYTES) {
      fs.copyFileSync(file, path.join(dirs.abs, `${id}.svg`));
      const { width, height } = await open(file).metadata();
      return { id, src: rel(`${id}.svg`), full: rel(`${id}.svg`), width, height, alt };
    }
    const out = path.join(dirs.abs, `${id}-icon.webp`);
    await webp(file, ICON_WIDTH, out);
    const { width, height } = await sharp(out).metadata();
    return { id, src: rel(`${id}-icon.webp`), full: rel(`${id}-icon.webp`), width, height, alt };
  }

  const srcOut = path.join(dirs.abs, `${id}-${SRC_WIDTH}.webp`);
  const fullOut = path.join(dirs.abs, `${id}-${FULL_WIDTH}.webp`);
  await webp(file, SRC_WIDTH, srcOut);
  await webp(file, FULL_WIDTH, fullOut);
  const { width, height } = await sharp(srcOut).metadata();
  const item = { id, src: rel(`${id}-${SRC_WIDTH}.webp`), full: rel(`${id}-${FULL_WIDTH}.webp`), width, height, alt };
  const tone = group.kind === 'logos' ? await toneOf(file) : undefined;
  return tone ? { ...item, tone } : item;
}

// Un sitio publicado: su captura en tres proporciones (escritorio, tablet y movil). Cada una se guarda en su
// ancho; la de escritorio ademas en 640 para las tarjetas. Si una captura falta se reporta y el sitio se
// publica con las demas; sin la de escritorio no hay sitio.
const SHOT_WIDTHS = { tablet: 820, mobile: 390 };

async function processSite(site, group, dirs, failed) {
  const rel = (name) => `${dirs.rel}/${name}`;
  const { desktop, tablet, mobile } = site.shots ?? {};
  if (!desktop || !fs.existsSync(desktop)) {
    failed.push(desktop ?? `${site.slug}: sin captura de escritorio`);
    return null;
  }
  const smallOut = path.join(dirs.abs, `${site.slug}-${SRC_WIDTH}.webp`);
  await webp(desktop, SRC_WIDTH, smallOut);
  await webp(desktop, FULL_WIDTH, path.join(dirs.abs, `${site.slug}-${FULL_WIDTH}.webp`));
  const { width, height } = await sharp(smallOut).metadata();
  const item = {
    id: site.slug,
    title: site.title,
    url: site.url,
    domain: `${new URL(site.url).hostname}${new URL(site.url).pathname.replace(/\/$/, '')}`,
    tags: site.tags,
    text: site.text,
    color: site.color,
    alt: `Vista previa de ${site.title}`,
    src: rel(`${site.slug}-${SRC_WIDTH}.webp`),
    full: rel(`${site.slug}-${FULL_WIDTH}.webp`),
    width,
    height,
    shots: {},
  };
  for (const [variant, file] of Object.entries({ tablet, mobile })) {
    if (!file) continue;
    if (!fs.existsSync(file)) {
      failed.push(file);
      continue;
    }
    const target = SHOT_WIDTHS[variant];
    const out = path.join(dirs.abs, `${site.slug}-${variant}-${target}.webp`);
    await webp(file, target, out);
    const meta = await sharp(out).metadata();
    item.shots[variant] = { src: rel(`${site.slug}-${variant}-${target}.webp`), width: meta.width, height: meta.height };
  }
  return item;
}

// Miniatura de un video de YouTube: se baja una vez al construir (no se enlaza a YouTube desde la pagina).
async function processVideo(video, dirs, failed) {
  const rel = (name) => `${dirs.rel}/${name}`;
  fs.mkdirSync(dirs.abs, { recursive: true });
  const out = path.join(dirs.abs, `yt-${video.id}-640.webp`);
  if (!fs.existsSync(out)) {
    let buffer;
    for (const name of ['maxresdefault', 'hqdefault']) {
      const response = await fetch(`https://i.ytimg.com/vi/${video.id}/${name}.jpg`);
      if (response.ok) {
        buffer = Buffer.from(await response.arrayBuffer());
        break;
      }
    }
    if (!buffer) {
      failed.push(`video:${video.id}`);
      return null;
    }
    // hqdefault trae franjas negras arriba y abajo: se recorta a 16:9 desde el centro.
    const { width, height } = await sharp(buffer).metadata();
    const target = Math.round((width * 9) / 16);
    const top = Math.max(0, Math.round((height - target) / 2));
    await sharp(buffer).extract({ left: 0, top, width, height: Math.min(target, height) }).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  }
  const { width, height } = await sharp(out).metadata();
  const alt = video.title;
  return { id: `yt-${video.id}`, videoId: video.id, src: rel(`yt-${video.id}-640.webp`), full: rel(`yt-${video.id}-640.webp`), width, height, alt, caption: video.caption ?? video.title };
}

async function processGroup(group, dirs, failed, generic) {
  if (group.kind === 'videos') {
    const items = [];
    for (const video of group.videos) {
      try {
        const item = await processVideo(video, dirs, failed);
        if (item) items.push(item);
      } catch {
        failed.push(`video:${video.id}`);
      }
    }
    const { videos, ...rest } = group;
    return { ...rest, items };
  }
  if (group.kind === 'sitios') {
    const items = [];
    for (const site of group.sites) {
      try {
        const item = await processSite(site, group, dirs, failed);
        if (item) items.push(item);
      } catch {
        failed.push(site.shots?.desktop ?? site.slug);
      }
    }
    const { sites, ...rest } = group;
    return { ...rest, items };
  }
  const seen = new Set();
  const items = [];
  for (const file of group.files) {
    if (!fs.existsSync(file)) {
      failed.push(file);
      continue;
    }
    try {
      const id = sha1(file);
      if (seen.has(id)) continue; // misma imagen: se publica una sola vez
      seen.add(id);
      const item = await processItem(file, group, dirs);
      const caption = group.captions?.[file];
      if (!caption && group.kind !== 'iconos' && !describeName(file)) generic.push(file);
      items.push(caption ? { ...item, caption } : item);
    } catch {
      failed.push(file);
    }
  }
  const { files, captions, ...rest } = group;
  return { ...rest, items };
}

// Un video de fondo ya optimizado vive en assets/video/casos/<caso>/: <id>-h.mp4 (horizontal), <id>-v.mp4
// (vertical, opcional) y un poster webp de cada uno. Sin el horizontal y su poster no hay video.
async function resolveVideo(id, slug, root) {
  const rel = (name) => `assets/video/casos/${slug}/${name}`;
  const exists = (name) => fs.existsSync(path.join(root, rel(name)));
  if (!exists(`${id}-h.mp4`) || !exists(`${id}-h-poster.webp`)) return null;
  const { width, height } = await sharp(path.join(root, rel(`${id}-h-poster.webp`))).metadata();
  const video = { type: 'video', id, desktop: rel(`${id}-h.mp4`), poster: rel(`${id}-h-poster.webp`), width, height };
  if (exists(`${id}-v.mp4`) && exists(`${id}-v-poster.webp`)) {
    video.mobile = rel(`${id}-v.mp4`);
    video.posterMobile = rel(`${id}-v-poster.webp`);
  }
  return video;
}

export async function buildCase(plan, { root = '.', layoutPath = 'index.html', skipImages = false } = {}) {
  const dataFile = path.join(root, 'data', 'casos', `${plan.slug}.json`);
  const dirs = { abs: path.join(root, 'assets', 'img', 'casos', plan.slug), rel: `assets/img/casos/${plan.slug}` };
  const failed = [];
  const generic = []; // piezas con nombre generico y sin pie escrito a mano
  let data;

  if (skipImages) {
    data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } else {
    fs.mkdirSync(dirs.abs, { recursive: true });
    const chapters = [];
    for (const chapter of plan.chapters) {
      const groups = [];
      for (const group of chapter.groups) groups.push(await processGroup(group, dirs, failed, generic));
      chapters.push({ ...chapter, groups });
    }
    const { chapters: _drop, card: cardPlan, ...head } = plan;
    data = { ...head, chapters };
    // Las imagenes de la tarjeta (y del hero) son piezas ya publicadas; el plan las nombra por su id.
    const published = new Map(chapters.flatMap((chapter) => chapter.groups.flatMap((group) => group.items.flatMap((item) => [
      [item.id, item],
      // "sitio:variante" nombra una captura de otra proporcion (tablet o movil) como imagen de la tarjeta.
      ...Object.entries(item.shots ?? {}).map(([variant, shot]) => [`${item.id}:${variant}`, { id: `${item.id}:${variant}`, src: shot.src, full: shot.src, width: shot.width, height: shot.height }]),
    ]))));
    const cardImages = (cardPlan?.images ?? []).map((id) => published.get(id)).filter(Boolean);
    const card = {};
    if (cardImages.length) card.images = cardImages.map(({ id, src, full, width, height }) => ({ id, src, full, width, height }));
    // `card.media` mezcla videos (ya optimizados con encode-videos) e imagenes, en el orden del plan.
    const media = [];
    for (const entry of cardPlan?.media ?? []) {
      if (entry.video) {
        const video = await resolveVideo(entry.video, plan.slug, root);
        if (video) media.push(video);
        else failed.push(`video:${entry.video}`);
      } else if (entry.sky) {
        // El cielo animado se dibuja en el navegador (assets/js/sky.js): no hay archivos que optimizar.
        media.push({ type: 'sky', id: entry.sky });
      } else if (entry.image) {
        const item = published.get(entry.image);
        if (item) media.push({ type: 'image', id: item.id, src: item.src, full: item.full, width: item.width, height: item.height });
        else failed.push(`imagen:${entry.image}`);
      }
    }
    if (media.length) card.media = media;
    if (Object.keys(card).length) data.card = card;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  }

  const pageDir = path.join(root, 'casos', plan.slug);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, 'index.html'), renderCase(data, { layoutPath }));

  const items = data.chapters.reduce((sum, chapter) => sum + chapter.groups.reduce((n, group) => n + group.items.length, 0), 0);
  return { items, failed, generic };
}

if (process.argv[1]?.endsWith('build-case.mjs')) {
  const [planPath] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (!planPath) {
    console.error('Uso: node scripts/build-case.mjs <plan.json> [--sin-imagenes]');
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const result = await buildCase(plan, { skipImages: process.argv.includes('--sin-imagenes') });
  console.log(`Caso ${plan.slug}: ${result.items} piezas publicadas, ${result.failed.length} no se pudieron procesar.`);
  for (const file of result.failed) console.log('  sin procesar:', file);
  for (const file of result.generic) console.log('  nombre generico, falta un pie:', file);
}
