import fs from 'node:fs';
import { HOME_BLOCK_END, HOME_BLOCK_START, caseSlugs, homeBlock, robotsTxt, sitemapXml } from './seo.mjs';

// Genera robots.txt y sitemap.xml y deja al dia el bloque de SEO de la home (entre los marcadores <!-- seo:inicio --> y <!-- seo:fin -->).
// Uso: npm run seo
const home = fs.readFileSync('index.html', 'utf8');
const start = home.indexOf(HOME_BLOCK_START);
const end = home.indexOf(HOME_BLOCK_END);
if (start < 0 || end < 0) throw new Error('index.html no tiene los marcadores del bloque de SEO');
const lineStart = home.lastIndexOf('\n', start) + 1;
const next = home.slice(0, lineStart) + homeBlock() + home.slice(end + HOME_BLOCK_END.length);
if (next !== home) fs.writeFileSync('index.html', next);
fs.writeFileSync('robots.txt', robotsTxt());
fs.writeFileSync('sitemap.xml', sitemapXml(caseSlugs(next)));
console.log(`SEO: robots.txt, sitemap.xml (${caseSlugs(next).length + 2} paginas) y bloque de la home${next !== home ? ' actualizado' : ' sin cambios'}.`);
