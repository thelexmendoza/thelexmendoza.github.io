import fs from 'node:fs';
import path from 'node:path';
import { generar, leerPosts } from './blog/blog.mjs';

// Genera el blog (índice y un artículo por archivo de content/blog) con el molde de las páginas legales. Uso: npm run blog
// Sin artículos publicados no se genera nada: el blog aparece cuando hay el primero.
const archivos = generar();
if (!archivos.size) {
  console.log('Blog: no hay artículos en content/blog (los borradores van en private/blog). No se generó nada.');
} else {
  for (const [ruta, html] of archivos) {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, html);
    console.log(ruta.replaceAll('\\', '/'));
  }
  console.log(`Blog: ${leerPosts().length} artículo(s). Corre npm run seo para dejar al día el sitemap.`);
}
