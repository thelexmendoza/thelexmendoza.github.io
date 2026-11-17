// Etiquetas de medición del sitio (píxel de Meta con aviso de consentimiento), generadas por el orquestador de tags
// (repo hermano `tag-orquestador`). El sitio NO depende de ese repo al regenerar: guarda su salida en data/tags-head.html
// y el runtime del navegador en assets/js/tag-orquestador/. Para actualizarlos, desde el orquestador:
//   npm run export -- "../thelexmendoza.github.io/assets/js"
//   npm run render -- clients/lexmendoza.json   (y se guarda la salida, sin el encabezado de npm, en data/tags-head.html)
// El bloque va SIEMPRE después del primer <script> inline del tema: extractLayout (casos, legales y promo) toma el primer
// <script> sin atributos del index.html, y no debe ser el del orquestador.

import fs from 'node:fs';

export const TAGS_START = '<!-- tag-orquestador:inicio -->';
export const TAGS_END = '<!-- tag-orquestador:fin -->';

// El bloque ya generado, con sangría para el <head>.
export function tagsHead(indent = '    ', archivo = 'data/tags-head.html') {
  const bloque = fs.readFileSync(archivo, 'utf8').trim();
  if (!bloque.startsWith(TAGS_START) || !bloque.endsWith(TAGS_END)) throw new Error(`${archivo} no tiene las marcas del orquestador`);
  return bloque.split('\n').map((linea) => (linea ? indent + linea : linea)).join('\n');
}

// Pone (o actualiza) el bloque en una página: entre sus marcas si ya existen; si no, justo después del primer <script> sin atributos.
export function injectTags(html, bloque = tagsHead()) {
  const inicio = html.indexOf(TAGS_START);
  const fin = html.indexOf(TAGS_END);
  if (inicio !== -1 && fin > inicio) {
    const lineStart = html.lastIndexOf('\n', inicio) + 1;
    return html.slice(0, lineStart) + bloque + html.slice(fin + TAGS_END.length);
  }
  const tema = html.match(/<script>[\s\S]*?<\/script>/);
  if (!tema) throw new Error('La página no tiene el script inline del tema');
  const at = tema.index + tema[0].length;
  return `${html.slice(0, at)}\n${bloque}${html.slice(at)}`;
}
