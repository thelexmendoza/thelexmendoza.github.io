import fs from 'node:fs';
import { injectTags } from './tags.mjs';

// Deja al día el bloque de etiquetas del orquestador en index.html (las demás páginas lo reciben de sus generadores).
// Uso: npm run tags   (después, npm run case / legal / promo para regenerar el resto)
const home = fs.readFileSync('index.html', 'utf8');
const next = injectTags(home);
if (next !== home) fs.writeFileSync('index.html', next);
console.log(`Etiquetas: index.html ${next !== home ? 'actualizado' : 'sin cambios'}.`);
