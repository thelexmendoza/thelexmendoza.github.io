import fs from 'node:fs';
import path from 'node:path';

const isExternal = (href) => /^(https?:|mailto:|tel:|\/\/|data:)/i.test(href);

// Revisa reglas estructurales de una pagina y devuelve la lista de problemas.
export function checkHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const problems = [];

  if (!/<html[^>]*\blang="es"/i.test(html)) problems.push('Falta <html lang="es">');
  if (!/<title>[^<]+<\/title>/i.test(html)) problems.push('Falta <title> con texto');
  if (!/<meta[^>]*name="viewport"/i.test(html)) problems.push('Falta la meta viewport');
  if (!/<meta[^>]*name="description"/i.test(html)) problems.push('Falta la meta description');
  if ((html.match(/<h1[\s>]/gi) ?? []).length !== 1) problems.push('Debe haber un solo h1');
  if (/bootstrap/i.test(html)) problems.push('Hay una referencia a bootstrap');

  for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\balt=/i.test(img)) problems.push(`Imagen sin alt: ${img.slice(0, 60)}`);
  }

  for (const anchor of html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []) {
    const href = anchor.match(/\bhref="([^"]*)"/i)?.[1];
    if (!href || href.startsWith('#') || isExternal(href)) continue;
    const comingSoon = /aria-disabled="true"/i.test(anchor) && /pr[óo]ximamente/i.test(anchor);
    if (comingSoon) continue;
    const target = path.join(dir, href.split(/[?#]/)[0]);
    const exists = fs.existsSync(target) && (!fs.statSync(target).isDirectory() || fs.existsSync(path.join(target, 'index.html')));
    if (!exists) problems.push(`Enlace interno roto: ${href}`);
  }

  return problems;
}

// Uso desde la terminal: node scripts/check-html.mjs index.html
if (process.argv[1]?.endsWith('check-html.mjs')) {
  const files = process.argv.slice(2);
  let failed = false;
  for (const file of files) {
    for (const problem of checkHtml(file)) {
      console.error(`${file}: ${problem}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}
