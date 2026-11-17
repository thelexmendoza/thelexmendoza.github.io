import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { SITE_URL, SOCIALS, caseJsonLd, caseSlugs, homeBlock, ogPath, OG_HOME, promoJsonLd, robotsTxt, sitemapXml } from '../scripts/seo.mjs';

const home = fs.readFileSync('index.html', 'utf8');
const slugs = caseSlugs(home);
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test('la home tiene su bloque de SEO al dia (npm run seo): canonica, Open Graph, Twitter y datos estructurados', () => {
  assert.ok(home.includes(homeBlock()), 'el bloque de la home esta desactualizado: corre npm run seo');
  assert.match(home, /<link rel="canonical" href="https:\/\/lexmendoza\.com\/">/);
  assert.match(home, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(home, /<meta property="og:locale" content="es_MX">/);
});

test('hay seis casos y cada imagen para compartir existe y mide 1200x630', async () => {
  assert.equal(slugs.length, 6);
  for (const image of [OG_HOME, '/assets/img/og/promo.jpg', ...slugs.map(ogPath)]) {
    assert.ok(fs.existsSync(image.slice(1)), `falta ${image}`);
    const { width, height } = await sharp(image.slice(1)).metadata();
    assert.deepEqual([width, height], [1200, 630], image);
  }
});

test('cada caso declara su canonica, su imagen para compartir y sus migas de pan', () => {
  for (const slug of slugs) {
    const html = fs.readFileSync(`casos/${slug}/index.html`, 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}/casos/${slug}/">`), `${slug}: canonica`);
    assert.ok(html.includes(`<meta property="og:image" content="${SITE_URL}${ogPath(slug)}">`), `${slug}: og:image`);
    assert.ok(html.includes(`<meta property="og:url" content="${SITE_URL}/casos/${slug}/">`), `${slug}: og:url`);
    const [crumbs] = jsonLd(html);
    assert.equal(crumbs['@type'], 'BreadcrumbList');
    assert.equal(crumbs.itemListElement.length, 3);
    assert.equal(crumbs.itemListElement[2].item, `${SITE_URL}/casos/${slug}/`);
  }
});

test('la persona del JSON-LD enlaza sus dos redes y no ofrece correo ni telefono', () => {
  const [graph] = jsonLd(home);
  const person = graph['@graph'].find((n) => n['@type'] === 'Person');
  assert.deepEqual(person.sameAs, SOCIALS);
  assert.equal(person.address.addressLocality, 'Monterrey');
  assert.doesNotMatch(JSON.stringify(graph), /@gmail|mailto|wa\.me|telephone|email/i);
});

test('el JSON-LD no puede romper la pagina: un titulo con </script> queda escapado', () => {
  const tag = caseJsonLd({ slug: 'x', title: '</script><img src=x onerror=alert(1)> & Co' });
  assert.equal((tag.match(/<script/g) ?? []).length, 1);
  assert.equal((tag.match(/<\/script>/g) ?? []).length, 1);
  assert.doesNotMatch(tag.replace(/^\s*<script[^>]*>/, '').replace(/<\/script>\s*$/, ''), /[<>&]/);
  const parsed = JSON.parse(tag.replace(/^\s*<script[^>]*>/, '').replace(/<\/script>\s*$/, ''));
  assert.equal(parsed.itemListElement[2].name, '</script><img src=x onerror=alert(1)> & Co');
});

test('robots.txt y sitemap.xml estan al dia y listan la home, la promo y los seis casos, sin la guia ni las paginas legales', () => {
  assert.equal(fs.readFileSync('robots.txt', 'utf8'), robotsTxt());
  assert.match(robotsTxt(), /Sitemap: https:\/\/lexmendoza\.com\/sitemap\.xml/);
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.equal(sitemap, sitemapXml(slugs), 'sitemap.xml desactualizado: corre npm run seo');
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 8);
  assert.ok(sitemap.includes('<loc>https://lexmendoza.com/promo/</loc>'));
  assert.doesNotMatch(sitemap, /guia|privacidad|cookies/);
});

test('solo la guia y la 404 piden no indexarse: la home, los casos y las paginas legales se pueden indexar', () => {
  for (const page of ['index.html', 'promo/index.html', 'privacidad/index.html', 'cookies/index.html', ...slugs.map((s) => `casos/${s}/index.html`)]) {
    assert.doesNotMatch(fs.readFileSync(page, 'utf8'), /name="robots"[^>]*noindex/, `${page} no debe llevar noindex`);
  }
  for (const page of ['404.html', 'guia-dominio-hosting/index.html']) {
    assert.match(fs.readFileSync(page, 'utf8'), /name="robots" content="noindex"/, `${page} debe llevar noindex`);
  }
});

test('las paginas legales tienen su canonica', () => {
  for (const slug of ['privacidad', 'cookies']) {
    assert.ok(fs.readFileSync(`${slug}/index.html`, 'utf8').includes(`<link rel="canonical" href="${SITE_URL}/${slug}/">`));
  }
});

test('el CNAME del repo es el dominio de las canonicas', () => {
  assert.equal(fs.readFileSync('CNAME', 'utf8').trim(), new URL(SITE_URL).hostname);
});

test('la landing de la promo tiene canonica, imagen para compartir y las cuatro ofertas con sus precios en MXN, con IVA y vigencia', () => {
  const html = fs.readFileSync('promo/index.html', 'utf8');
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}/promo/">`));
  assert.ok(html.includes(`<meta property="og:image" content="${SITE_URL}/assets/img/og/promo.jpg">`));
  assert.ok(html.includes(promoJsonLd('    ')), 'el JSON-LD de la promo esta desactualizado: corre npm run promo');
  const servicio = jsonLd(html)[0];
  assert.equal(servicio['@type'], 'Service');
  assert.deepEqual(servicio.offers.map((o) => o.price), [549, 1290, 1990, 2190]);
  for (const oferta of servicio.offers) {
    assert.equal(oferta.priceCurrency, 'MXN');
    assert.equal(oferta.priceValidUntil, '2026-12-31');
    assert.equal(oferta.priceSpecification.valueAddedTaxIncluded, true);
  }
});
