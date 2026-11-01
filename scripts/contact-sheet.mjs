import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

sharp.cache(false);

// Hoja de contactos: miniaturas de las imagenes de varias carpetas, con botones para marcar
// cuales son de Lex. La eleccion se guarda en el navegador y se descarga como seleccion.json.
//
// Uso: node scripts/contact-sheet.mjs private/content/valtre/sheet.config.json [carpeta-de-salida]

const DEFAULT_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const THUMB_WIDTH = 360;

const escapeHtml = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const hash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);

function walk(dir, recursive, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) walk(full, recursive, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

// Archivos de un origen, ya filtrados por extension, exclusion, inclusion y limite.
export function listFiles(source) {
  if (source.files) source = { ...source, path: null };
  if (source.path !== null && source.path !== undefined && !fs.existsSync(source.path)) return null;
  const extensions = (source.extensions ?? DEFAULT_EXTENSIONS).map((ext) => ext.toLowerCase().replace(/^\./, ''));
  const exclude = source.exclude ? new RegExp(source.exclude, 'i') : null;
  const include = source.include ? new RegExp(source.include, 'i') : null;
  const all = source.files
    ? source.files.filter((file) => fs.existsSync(file))
    : fs.statSync(source.path).isDirectory()
      ? walk(source.path, Boolean(source.recursive))
      : [source.path];
  const files = all
    .filter((file) => extensions.includes(path.extname(file).slice(1).toLowerCase()))
    .filter((file) => !exclude || !exclude.test(file))
    .filter((file) => !include || include.test(file))
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  return source.limit ? files.slice(0, source.limit) : files;
}

async function makeThumb(file, thumbPath) {
  await sharp(file, { failOn: 'none', limitInputPixels: false })
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(thumbPath);
}

async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

const PAGE_SCRIPT = `
const KEY = 'hoja:' + document.title;
let state = {};
try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { state = {}; }
const cards = [...document.querySelectorAll('[data-card]')];
function paint() {
  let mine = 0, skip = 0;
  cards.forEach((card) => {
    const value = state[card.dataset.path];
    card.classList.toggle('is-mine', value === 'mine');
    card.classList.toggle('is-skip', value === 'skip');
    if (value === 'mine') mine++; else if (value === 'skip') skip++;
  });
  document.getElementById('count').textContent = mine + ' mías, ' + skip + ' descartadas, ' + (cards.length - mine - skip) + ' sin marcar';
  const only = document.getElementById('only-mine').checked;
  cards.forEach((card) => { card.hidden = only && state[card.dataset.path] !== 'mine'; });
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} paint(); }
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-set]');
  if (!button) return;
  const card = button.closest('[data-card]');
  const value = button.dataset.set;
  state[card.dataset.path] = state[card.dataset.path] === value ? undefined : value;
  save();
});
document.getElementById('only-mine').addEventListener('change', paint);
document.getElementById('download').addEventListener('click', () => {
  const data = { mine: [], skip: [] };
  Object.entries(state).forEach(([file, value]) => { if (value) data[value].push(file); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'seleccion.json';
  link.click();
});
paint();
`;

function renderHtml(config, sections) {
  const body = sections
    .map(
      (section) => `
  <section>
    <h2>${escapeHtml(section.title)}</h2>
    ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ''}
    ${section.groups
      .map(
        (group) => `
    <h3>${escapeHtml(group.label)} <small>${group.cards.length} archivos</small></h3>
    <div class="grid">${group.cards
      .map(
        (card) => `
      <figure data-card data-path="${escapeHtml(card.file)}" title="${escapeHtml(card.file)}">
        ${card.thumb ? `<img src="thumbs/${card.thumb}" alt="" loading="lazy">` : '<div class="broken">no se pudo leer</div>'}
        <figcaption>${escapeHtml(path.basename(card.file))}</figcaption>
        ${card.note ? `<p class="variants">${escapeHtml(card.note)}</p>` : ''}
        <div class="actions"><button type="button" data-set="mine">Es mío</button><button type="button" data-set="skip">Descartar</button></div>
      </figure>`,
      )
      .join('')}
    </div>`,
      )
      .join('')}
  </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(config.title)}</title>
<style>
body{margin:0;background:#141414;color:#fafafa;font:14px/1.4 system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:10px 16px;background:#0a0a0a;border-bottom:1px solid #333}
header h1{font-size:16px;margin:0 auto 0 0}
header button{background:#e10600;color:#fff;border:0;padding:8px 14px;font:inherit;cursor:pointer}
main{padding:0 16px 48px}
h2{margin:36px 0 4px;font-size:22px}
h3{margin:22px 0 8px;font:500 13px ui-monospace,monospace;color:#bdbdbd;word-break:break-all}
h3 small{color:#888}
.note{color:#bdbdbd;margin:0 0 8px;max-width:70ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
figure{margin:0;background:#0a0a0a;border:2px solid #2a2a2a;padding:6px}
figure img{display:block;width:100%;height:130px;object-fit:contain;background:repeating-conic-gradient(#222 0 25%,#2c2c2c 0 50%) 0 0/16px 16px}
figure .broken{height:130px;display:grid;place-items:center;color:#ff5a4d;font-size:12px}
figcaption{margin:6px 0;font-size:11px;word-break:break-all;color:#bdbdbd}
.variants{margin:0 0 6px;font-size:11px;color:#bcf200}
.actions{display:flex;gap:6px}
.actions button{flex:1;background:#222;color:#fafafa;border:1px solid #444;padding:5px;font:inherit;font-size:12px;cursor:pointer}
.is-mine{border-color:#bcf200}
.is-mine [data-set=mine]{background:#bcf200;color:#000;border-color:#bcf200}
.is-skip{opacity:.35}
.is-skip [data-set=skip]{background:#e10600;border-color:#e10600}
label{display:flex;gap:6px;align-items:center}
</style>
</head>
<body>
<header><h1>${escapeHtml(config.title)}</h1><span id="count"></span><label><input type="checkbox" id="only-mine"> Solo las mías</label><button type="button" id="download">Descargar seleccion.json</button></header>
<main>${body}
</main>
<script>${PAGE_SCRIPT}</script>
</body>
</html>
`;
}

export async function buildSheet(config, outDir) {
  const thumbsDir = path.join(outDir, 'thumbs');
  fs.mkdirSync(thumbsDir, { recursive: true });
  const missing = [];
  let failed = 0;
  let cardsTotal = 0;
  const sections = [];

  for (const section of config.sections) {
    const groups = [];
    for (const source of section.sources) {
      const files = listFiles(source);
      if (files === null) {
        missing.push(source.path);
        continue;
      }
      const cards = await pool(files, 6, async (file) => {
        const thumb = `${hash(file)}.webp`;
        try {
          await makeThumb(file, path.join(thumbsDir, thumb));
          return { file, thumb, note: source.notes?.[file] };
        } catch {
          failed += 1;
          return { file, thumb: null, note: source.notes?.[file] };
        }
      });
      cardsTotal += cards.length;
      groups.push({ label: source.label ?? source.path, cards });
    }
    sections.push({ title: section.title, note: section.note, groups });
  }

  fs.writeFileSync(path.join(outDir, 'index.html'), renderHtml(config, sections));
  return { cards: cardsTotal, failed, missing };
}

if (process.argv[1]?.endsWith('contact-sheet.mjs')) {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Uso: node scripts/contact-sheet.mjs <config.json> [carpeta-de-salida]');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const outDir = process.argv[3] ?? path.join(path.dirname(configPath), 'sheet');
  const result = await buildSheet(config, outDir);
  console.log(`Hoja en ${path.join(outDir, 'index.html')}: ${result.cards} imagenes, ${result.failed} ilegibles.`);
  if (result.missing.length) console.log('Origenes que no existen:\n  ' + result.missing.join('\n  '));
}
