// Blog propio: lee los artículos de content/blog/*.md (los borradores viven en private/blog/ y no se publican) y arma las páginas
// con el mismo molde que las legales y la guía (render-legal.mjs). Uso: npm run blog
//
// El formato de los artículos está descrito en posts.mjs.

import path from 'node:path';
import { mdAHtml } from './markdown.mjs';
import { BLOG_DIR, fechaLarga, leerPosts, parsearPost } from './posts.mjs';
import { renderLegal } from '../render-legal.mjs';
import { postJsonLd, blogJsonLd } from '../seo.mjs';

export { BLOG_DIR, fechaLarga, leerPosts, parsearPost };
export const FORM_URL = 'https://brief.lexmendoza.com/newsletter/';
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// El botón lleva al formulario en su propio origen (brief.lexmendoza.com), sin iframe: la página del blog no comparte scripts con él.
export function ctaBoletin(origen, campana) {
  const href = `${FORM_URL}?o=${encodeURIComponent(origen)}&utm_source=sitio&utm_medium=blog&utm_campaign=${encodeURIComponent(campana)}`;
  return `<aside class="c-blog-cta o-stack" aria-labelledby="cta-boletin">
          <p class="c-eyebrow">// boletín</p>
          <h2 id="cta-boletin">¿Te sirvió? Recibe más así</h2>
          <p>Un correo de vez en cuando con ideas útiles sobre tu página web, tu dominio y tu marca. Sin spam, y te das de baja con un clic.</p>
          <p><a class="c-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><span class="c-icon c-icon--mail" aria-hidden="true"></span>Suscribirme al boletín<span class="u-visually-hidden"> (se abre en otra pestaña)</span></a></p>
        </aside>`;
}

export function paginaPost(p) {
  return {
    slug: `blog/${p.slug}`,
    path: `/blog/${p.slug}/`,
    eyebrow: 'Blog',
    title: p.titulo,
    word: p.titulo.split(/\s+/).slice(-1)[0],
    description: p.descripcion,
    lead: p.descripcion,
    metaHtml: `${esc(fechaLarga(p.fecha))} · ${p.minutos} min de lectura${p.actualizado ? ` · Actualizado el ${esc(fechaLarga(p.actualizado))}` : ''}`,
    jsonLd: postJsonLd(p, '    '),
    noindex: p.noindex,
    body: mdAHtml(p.cuerpo),
    after: ctaBoletin(`blog-${p.slug}`, p.slug),
  };
}

export function paginaIndice(posts) {
  const lista = posts.map((p) => `<li class="c-blog__item"><a class="c-blog__link" href="${esc(p.slug)}/"><span class="c-blog__fecha">${esc(fechaLarga(p.fecha))} · ${p.minutos} min</span><span class="c-blog__titulo">${esc(p.titulo)}</span><span class="c-blog__desc">${esc(p.descripcion)}</span></a></li>`).join('\n');
  return {
    slug: 'blog',
    path: '/blog/',
    eyebrow: 'Blog',
    title: 'Blog',
    word: 'Blog',
    description: 'Ideas útiles sobre páginas web, dominios, hosting y marca para negocios y marcas personales.',
    lead: 'Ideas útiles sobre páginas web, dominios, hosting y marca, en español claro y sin letra chica.',
    metaHtml: `${posts.length} ${posts.length === 1 ? 'artículo' : 'artículos'}`,
    jsonLd: blogJsonLd('    '),
    body: `<ul class="c-blog__list">\n${lista}\n</ul>`,
    after: ctaBoletin('blog', 'indice'),
  };
}

export function generar({ dir = BLOG_DIR, salida = 'blog', layoutPath = 'index.html' } = {}) {
  const posts = leerPosts(dir);
  const archivos = new Map();
  if (!posts.length) return archivos;
  // Los articulos de prueba (noindex) tienen su pagina, pero no salen en la portada; sin articulos publicos no hay portada.
  const publicos = posts.filter((p) => !p.noindex);
  if (publicos.length) archivos.set(path.join(salida, 'index.html'), renderLegal(paginaIndice(publicos), { layoutPath, prefix: '../' }));
  for (const p of posts) archivos.set(path.join(salida, p.slug, 'index.html'), renderLegal(paginaPost(p), { layoutPath, prefix: '../../' }));
  return archivos;
}
