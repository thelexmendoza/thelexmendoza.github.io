// SEO del sitio: direccion canonica, etiquetas para compartir (Open Graph y Twitter) y datos estructurados (JSON-LD).
// Lo usan la home (npm run seo), las paginas de caso (render-case.mjs) y las legales (render-legal.mjs), para que digan lo mismo.
// El dominio definitivo es lexmendoza.com, sin www (www y thelexmendoza.github.io redirigen ahi).

import { leerPosts } from './blog/posts.mjs';
import { promo } from './promo/promo.mjs';

export const SITE_URL = 'https://lexmendoza.com';
export const SITE_NAME = 'Lex Mendoza';
export const HOME_TITLE = 'Lex Mendoza | Diseñador gráfico y desarrollador web';
export const HOME_DESCRIPTION = 'Identidad visual y sitios web para negocios y marcas personales. Diseñador gráfico y desarrollador web en Monterrey.';
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_HOME = '/assets/img/og/lex.jpg';
export const ogPath = (slug) => `/assets/img/og/${slug}.jpg`;
export const SOCIALS = ['https://www.instagram.com/thelexmendoza/', 'https://www.linkedin.com/in/amendozaleon/'];

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const absolute = (path) => `${SITE_URL}${path}`;

// Canonica + Open Graph + Twitter. `path` empieza con "/" (la home es "/"); `image` es una ruta del sitio.
export function seoTags({ path, title, description, image = OG_HOME, imageAlt = 'Lex Mendoza, diseñador gráfico y desarrollador web en Monterrey', indent = '    ' }) {
  const lines = [
    `<link rel="canonical" href="${absolute(path)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="es_MX">',
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${absolute(path)}">`,
    `<meta property="og:image" content="${absolute(image)}">`,
    `<meta property="og:image:width" content="${OG_SIZE.width}">`,
    `<meta property="og:image:height" content="${OG_SIZE.height}">`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${absolute(image)}">`,
  ];
  return lines.map((line) => `${indent}${line}`).join('\n');
}

// El JSON va dentro de un <script>: se escapan < > & (como \u003c...) para que un titulo con «</script>» no pueda romper la pagina.
const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const ldScript = (data, indent = '    ') => `${indent}<script type="application/ld+json">${safeJson(data)}</script>`;

// La home: el sitio y la persona (con sus perfiles). Sin correo ni telefono: no se ofrecen a los rastreadores.
export function homeJsonLd(indent) {
  return ldScript(
    {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': `${SITE_URL}/#sitio`, url: `${SITE_URL}/`, name: SITE_NAME, inLanguage: 'es-MX', publisher: { '@id': `${SITE_URL}/#persona` } },
        {
          '@type': 'Person',
          '@id': `${SITE_URL}/#persona`,
          name: 'Alejandro Mendoza',
          alternateName: SITE_NAME,
          url: `${SITE_URL}/`,
          image: absolute('/assets/img/lex/lex-color-640.webp'),
          jobTitle: 'Diseñador gráfico y desarrollador web',
          description: HOME_DESCRIPTION,
          address: { '@type': 'PostalAddress', addressLocality: 'Monterrey', addressRegion: 'Nuevo León', addressCountry: 'MX' },
          knowsAbout: ['Diseño gráfico', 'Identidad visual', 'Desarrollo web', 'Fotografía', 'Edición de video'],
          sameAs: SOCIALS,
        },
      ],
    },
    indent,
  );
}

// Un caso: migas de pan (Inicio > Casos > el caso).
export function caseJsonLd({ slug, title }, indent) {
  return ldScript(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Casos', item: `${SITE_URL}/#casos` },
        { '@type': 'ListItem', position: 3, name: title, item: `${SITE_URL}/casos/${slug}/` },
      ],
    },
    indent,
  );
}

// La landing de la promo: el servicio y sus cuatro ofertas (precios con IVA incluido, vigentes hasta el cierre de la promo).
const aNumero = (precio) => Number(String(precio).replace(/[^0-9.]/g, ''));
export function promoJsonLd(indent) {
  return ldScript(
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Landing Express: tu página web con la promo de fin de año',
      description: promo.description,
      areaServed: 'MX',
      provider: { '@id': `${SITE_URL}/#persona` },
      url: `${SITE_URL}/promo/`,
      offers: promo.precios.plataformas.map((p) => ({
        '@type': 'Offer',
        name: p.nombre,
        description: `${p.resumen.replaceAll('*', '')} Entrega en ${p.dias} días hábiles.`,
        price: aNumero(p.precio),
        priceCurrency: 'MXN',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/LimitedAvailability',
        url: `${SITE_URL}/promo/#precios`,
        priceSpecification: { '@type': 'UnitPriceSpecification', price: aNumero(p.precio), priceCurrency: 'MXN', valueAddedTaxIncluded: true },
      })),
    },
    indent,
  );
}

// El blog: la portada del blog (migas de pan) y cada artículo (BlogPosting con migas). El autor es la persona de la home (@id), sin datos de contacto.
export function blogJsonLd(indent) {
  return ldScript(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      ],
    },
    indent,
  );
}

export function postJsonLd({ slug, titulo, descripcion, fecha, actualizado }, indent) {
  const url = `${SITE_URL}/blog/${slug}/`;
  return ldScript(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: titulo,
        description: descripcion,
        datePublished: fecha,
        dateModified: actualizado || fecha,
        inLanguage: 'es-MX',
        mainEntityOfPage: url,
        url,
        image: absolute(OG_HOME),
        author: { '@id': `${SITE_URL}/#persona` },
        publisher: { '@id': `${SITE_URL}/#persona` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
          { '@type': 'ListItem', position: 3, name: titulo, item: url },
        ],
      },
    ],
    indent,
  );
}

export const HOME_BLOCK_START = '<!-- seo:inicio -->';
export const HOME_BLOCK_END = '<!-- seo:fin -->';

// Lo que va entre los marcadores de index.html.
export function homeBlock() {
  const indent = '    ';
  return [`${indent}${HOME_BLOCK_START}`, seoTags({ path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION, indent }), homeJsonLd(indent), `${indent}${HOME_BLOCK_END}`].join('\n');
}

export function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

// La home, la promo, cada caso (en el orden de las tarjetas de la home) y, si hay, el blog con sus articulos. Las paginas legales y la guia no se listan.
export function sitemapXml(slugs, todos = leerPosts()) {
  const posts = todos.filter((p) => !p.noindex); // las pruebas (noindex) no se listan
  const urls = ['/', '/promo/', ...slugs.map((slug) => `/casos/${slug}/`), ...(posts.length ? ['/blog/', ...posts.map((p) => `/blog/${p.slug}/`)] : [])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${absolute(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export function caseSlugs(homeHtml) {
  return [...homeHtml.matchAll(/<a class="c-case-card"[^>]*href="casos\/([^"/]+)\/"/g)].map((m) => m[1]);
}
