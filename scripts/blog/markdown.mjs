// Markdown mínimo y seguro para el blog (sin dependencias). Todo el texto se escapa; no se admite HTML dentro del Markdown.
//   ## Título de sección   ### Subtítulo   (un «# » también se toma como sección: el título de la página sale del encabezado del archivo)
//   párrafos, **negritas**, *cursivas*, `código`, [enlaces](https://…), listas con «- » o «1. », citas con «> », separador «---»,
//   bloques de código con ``` y ![texto alternativo](/assets/img/blog/archivo.webp)
// Enlaces: https, mailto o rutas del propio sitio que empiezan con «/». Los que salen del sitio se abren en otra pestaña (como en la guía).
// Imágenes: solo rutas del sitio («/assets/…») o https; el texto alternativo es obligatorio en lo que informa (vacío = decorativa).

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITIO = 'lexmendoza.com';

const urlLink = (u) => (/^(https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|\/[^\s"'<>]*|#[A-Za-z0-9_-]+)$/.test(u) ? u : null);
const urlImg = (u) => (/^(https:\/\/[^\s"'<>]+|\/assets\/[^\s"'<>]+)$/.test(u) ? u : null);
const esExterno = (u) => /^https:\/\//.test(u) && !new RegExp(`^https://(www\\.)?${SITIO.replace('.', '\\.')}(/|$)`).test(u);

function enLinea(texto) {
  const codigo = [];
  // El código en línea se aparta antes de aplicar énfasis y enlaces, para que su contenido salga tal cual.
  let s = String(texto).replace(/`([^`]+)`/g, (m, c) => { codigo.push(`<code>${esc(c)}</code>`); return `\u0000${codigo.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = urlImg(url.replace(/&amp;/g, '&'));
    return u ? `<img src="${esc(u)}" alt="${alt}" loading="lazy" decoding="async">` : alt;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, url) => {
    const u = urlLink(url.replace(/&amp;/g, '&'));
    if (!u) return t;
    return esExterno(u)
      ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}<span class="u-visually-hidden"> (se abre en otra pestaña)</span></a>`
      : `<a href="${esc(u)}">${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => codigo[Number(i)]);
}

export function mdAHtml(md) {
  const lineas = String(md).replace(/\r\n/g, '\n').split('\n');
  const sal = [];
  let i = 0;
  const vacia = (l) => !l.trim();
  while (i < lineas.length) {
    const l = lineas[i];
    if (vacia(l)) { i += 1; continue; }
    if (/^```/.test(l)) {
      const buf = [];
      i += 1;
      while (i < lineas.length && !/^```/.test(lineas[i])) { buf.push(lineas[i]); i += 1; }
      i += 1;
      sal.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^---+\s*$/.test(l)) { sal.push('<hr>'); i += 1; continue; }
    const h = l.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (h) { sal.push(`<h${h[1].length === 3 ? 3 : 2}>${enLinea(h[2])}</h${h[1].length === 3 ? 3 : 2}>`); i += 1; continue; }
    const bloque = [];
    while (i < lineas.length && !vacia(lineas[i]) && !/^(```|#{1,3}\s|---+\s*$)/.test(lineas[i])) { bloque.push(lineas[i]); i += 1; }
    if (bloque.every((x) => /^[-*]\s+/.test(x))) sal.push(`<ul>${bloque.map((x) => `<li>${enLinea(x.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`);
    else if (bloque.every((x) => /^\d+[.)]\s+/.test(x))) sal.push(`<ol>${bloque.map((x) => `<li>${enLinea(x.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`);
    else if (bloque.every((x) => /^>\s?/.test(x))) sal.push(`<blockquote><p>${bloque.map((x) => enLinea(x.replace(/^>\s?/, ''))).join('<br>')}</p></blockquote>`);
    else if (bloque.length === 1 && /^!\[[^\]]*\]\([^)\s]+\)$/.test(bloque[0].trim())) sal.push(`<figure>${enLinea(bloque[0].trim())}</figure>`);
    else sal.push(`<p>${bloque.map(enLinea).join(' ')}</p>`);
  }
  return sal.join('\n');
}

// Texto sin marcas, para contar palabras (tiempo de lectura).
export const mdAPalabras = (md) => String(md).replace(/```[\s\S]*?```/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*`_-]/g, ' ').split(/\s+/).filter(Boolean).length;
