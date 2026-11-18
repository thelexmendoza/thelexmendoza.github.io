import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mdAHtml } from '../scripts/blog/markdown.mjs';
import { parsearPost, leerPosts } from '../scripts/blog/posts.mjs';
import { generar, ctaBoletin } from '../scripts/blog/blog.mjs';
import { sitemapXml } from '../scripts/seo.mjs';

const POST = `---
titulo: Lo que sí debes saber de tu dominio
descripcion: Tres ideas para no perder tu dirección.
fecha: 2026-11-20
---
Un párrafo con **negritas**, *cursivas*, \`<codigo>\` y un [enlace externo](https://ejemplo.mx/) y uno [interno](/guia-dominio-hosting/).

## Sección

- uno
- dos

![Diagrama del DNS](/assets/img/blog/dns.webp)
`;

function carpeta(archivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-'));
  for (const [n, t] of Object.entries(archivos)) fs.writeFileSync(path.join(dir, n), t);
  return dir;
}

test('parsearPost valida lo obligatorio y saca el slug del archivo sin la fecha', () => {
  const p = parsearPost(POST, '2026-11-20-dominio.md');
  assert.equal(p.ok, true);
  assert.equal(p.slug, 'dominio');
  assert.ok(p.minutos >= 1);
  assert.equal(parsearPost('sin encabezado', 'x.md').ok, false);
  assert.equal(parsearPost(POST.replace('fecha: 2026-11-20', 'fecha: ayer'), 'x.md').ok, false);
  assert.equal(parsearPost(POST.replace('Tres ideas para no perder tu dirección.', 'x'.repeat(200)), 'x.md').ok, false, 'descripción de máximo 160');
  assert.equal(parsearPost(POST, 'Mala Ruta.md').ok, false, 'slug solo con minúsculas y guiones');
});

test('mdAHtml: seguro (nada de HTML, scripts ni enlaces peligrosos) y con los enlaces externos en otra pestaña', () => {
  const h = mdAHtml('<script>alert(1)</script> [mal](javascript:alert(1)) ![x](http://inseguro.mx/a.png) [ext](https://otro.mx/) [mio](https://lexmendoza.com/promo/)\n\n```\n<b>tal cual</b>\n```');
  assert.ok(!h.includes('<script') && !h.includes('javascript:') && !h.includes('http://inseguro'));
  assert.ok(h.includes('&lt;b&gt;tal cual&lt;/b&gt;'), 'el código se escapa');
  assert.match(h, /href="https:\/\/otro\.mx\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(h, /href="https:\/\/lexmendoza\.com\/promo\/">mio/, 'los enlaces al propio sitio no abren otra pestaña');
  const bien = mdAHtml(parsearPost(POST, 'a.md').cuerpo);
  assert.ok(bien.includes('<strong>negritas</strong>') && bien.includes('<code>&lt;codigo&gt;</code>') && bien.includes('<ul>') && bien.includes('<figure>'));
  assert.ok(bien.includes('alt="Diagrama del DNS"') && bien.includes('loading="lazy"'));
});

test('leerPosts: ignora lo que empieza con guion bajo, ordena del más nuevo y rechaza slugs repetidos', () => {
  const dir = carpeta({
    '_plantilla.md': POST,
    '2026-11-20-uno.md': POST,
    '2026-12-01-dos.md': POST.replace('2026-11-20', '2026-12-01'),
  });
  assert.deepEqual(leerPosts(dir).map((p) => p.slug), ['dos', 'uno']);
  const rep = carpeta({ 'a.md': POST.replace('fecha', 'slug: igual\nfecha'), 'b.md': POST.replace('fecha', 'slug: igual\nfecha') });
  assert.throws(() => leerPosts(rep), /repetido/);
  assert.deepEqual(leerPosts(path.join(dir, 'no-existe')), []);
});

test('generar: portada y artículos con el molde del sitio, canónica, datos estructurados y la invitación al boletín', () => {
  const dir = carpeta({ '2026-11-20-dominio.md': POST });
  const out = generar({ dir });
  assert.deepEqual([...out.keys()].map((k) => k.replaceAll('\\', '/')).sort(), ['blog/dominio/index.html', 'blog/index.html']);
  const post = out.get(path.join('blog', 'dominio', 'index.html'));
  assert.match(post, /<link rel="canonical" href="https:\/\/lexmendoza\.com\/blog\/dominio\/">/);
  assert.ok(post.includes('../../assets/css/main.min.css'), 'rutas relativas a dos niveles');
  assert.match(post, /"@type":"BlogPosting"/);
  assert.doesNotMatch(post, /noindex/);
  assert.match(post, /href="https:\/\/brief\.lexmendoza\.com\/newsletter\/\?o=blog-dominio&amp;utm_source=sitio&amp;utm_medium=blog&amp;utm_campaign=dominio" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(post, /<iframe/);
  const indice = out.get(path.join('blog', 'index.html'));
  assert.ok(indice.includes('href="dominio/"') && indice.includes('../assets/css/main.min.css'));
  assert.equal(generar({ dir: carpeta({}) }).size, 0, 'sin artículos no se genera nada');
});

test('el sitemap suma el blog y sus artículos solo cuando hay', () => {
  assert.ok(!sitemapXml(['a'], []).includes('/blog/'));
  const s = sitemapXml(['a'], [{ slug: 'dominio' }]);
  assert.ok(s.includes('<loc>https://lexmendoza.com/blog/</loc>') && s.includes('<loc>https://lexmendoza.com/blog/dominio/</loc>'));
});

test('el blog publicado coincide con lo que genera el script (no se edita a mano)', () => {
  const esperado = generar();
  for (const [ruta, html] of esperado) assert.equal(fs.readFileSync(ruta, 'utf8'), html, `${ruta} desactualizado: corre npm run blog`);
  if (!esperado.size) assert.ok(!fs.existsSync('blog'), 'hay un blog publicado pero ningún artículo en content/blog');
});

test('la guía invita a suscribirse, con su origen', () => {
  const guia = fs.readFileSync('guia-dominio-hosting/index.html', 'utf8');
  assert.ok(guia.includes(ctaBoletin('guia-dominio-hosting', 'guia').match(/href="([^"]+)"/)[1]));
  assert.match(guia, /\?o=guia-dominio-hosting&amp;utm_source=sitio/);
});
