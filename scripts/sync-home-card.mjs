import fs from 'node:fs';
import { renderCardMedia } from './render-case.mjs';

// Reescribe el fondo (videos e imagenes) de la tarjeta de un caso en index.html a partir de sus datos
// publicos, para que tarjeta y hero no se desfasen:  node scripts/sync-home-card.mjs ciisa-psw ciisa
const [slug, key] = process.argv.slice(2);
if (!slug || !key) {
  console.error('Uso: node scripts/sync-home-card.mjs <slug> <clave>');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(`data/casos/${slug}.json`, 'utf8'));
const media = data.card?.media ?? (data.card?.images ?? []).map((i) => ({ type: 'image', ...i }));
const count = media.length === 5 ? '' : ` data-count="${media.length}"`;
const html = fs.readFileSync('index.html', 'utf8');
const card = new RegExp(String.raw`(<a class="c-case-card" data-case="${key}"[\s\S]*?<span class="c-case-card__media" aria-hidden="true")[^>]*>[\s\S]*?\n {16}</span>`);
if (!card.test(html)) throw new Error(`No encontre la tarjeta ${key} con fondo en index.html`);
fs.writeFileSync('index.html', html.replace(card, `$1${count}>\n${renderCardMedia(media)}\n                </span>`));
console.log(`Tarjeta ${key}: ${media.length} elementos (${media.filter((m) => m.type === 'video').length} videos)`);
