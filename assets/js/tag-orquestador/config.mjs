// Validación y valores por defecto de la configuración por cliente (clients/<slug>.json).
// Regla de oro: la configuración solo lleva IDs públicos. Nunca tokens ni secretos.

export const FORMATS = {
  gtm:        { field: 'id',         re: /^GTM-[A-Z0-9]{4,10}$/,  example: 'GTM-XXXXXXX' },
  ga4:        { field: 'id',         re: /^G-[A-Z0-9]{6,12}$/,    example: 'G-XXXXXXXXXX' },
  google_ads: { field: 'id',         re: /^AW-\d{6,12}$/,         example: 'AW-0000000000' },
  meta:       { field: 'pixel_id',   re: /^\d{10,20}$/,           example: '1234567890123456' },
  tiktok:     { field: 'pixel_id',   re: /^[A-Z0-9]{10,30}$/,     example: 'C1A2B3D4E5F6G7H8I9J0' },
  clarity:    { field: 'project_id', re: /^[a-z0-9]{8,12}$/,      example: 'abcd1234ef' },
  linkedin:   { field: 'partner_id', re: /^\d{5,10}$/,            example: '1234567' },
  pinterest:  { field: 'tag_id',     re: /^\d{10,16}$/,           example: '2612345678901' },
};

// Categoría de consentimiento que debe estar concedida para cargar cada plataforma (modo directo).
export const PLATFORM_CATEGORY = {
  ga4: 'analytics', clarity: 'analytics',
  google_ads: 'marketing', meta: 'marketing', tiktok: 'marketing', linkedin: 'marketing', pinterest: 'marketing',
};

const SECRET_KEY = /(token|secret|password|passwd|api[_-]?key|access[_-]?key|private)/i;
export const isFakeId = (v) => /FICT|XXXX|EJEMPLO|TEST/i.test(v) || /^[A-Za-z]*-?0+$/.test(v);

function findSecretKeys(node, path = '') {
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([k, v]) => {
    const here = path ? `${path}.${k}` : k;
    return (SECRET_KEY.test(k) ? [here] : []).concat(findSecretKeys(v, here));
  });
}

export function platformId(config, name) {
  const fmt = FORMATS[name];
  const v = config?.platforms?.[name]?.[fmt.field];
  return typeof v === 'string' ? v.trim() : '';
}

export const enabledPlatforms = (config) => Object.keys(FORMATS).filter((n) => platformId(config, n) !== '');

// Categorías que el aviso debe ofrecer. consent.categories manda si existe. Si no: en modo directo, las de las
// plataformas activas; en modo gtm no se sabe qué hay dentro del contenedor, así que se ofrecen las tres.
export function activeCategories(config) {
  const order = ['analytics', 'marketing', 'functional'];
  const explicit = config.consent?.categories;
  if (Array.isArray(explicit)) return order.filter((c) => explicit.includes(c));
  if (config.mode === 'direct') {
    const used = new Set(enabledPlatforms(config).map((n) => PLATFORM_CATEGORY[n]).filter(Boolean));
    return order.filter((c) => used.has(c));
  }
  return order;
}

export function withDefaults(config) {
  return {
    ...config,
    mode: config.mode ?? 'gtm',
    consent: { mode: 'basic', version: '1', durationMonths: 12, banner: true, ...config.consent },
    events: { autoPageView: true, autoBind: true, custom: {}, ...config.events },
    platforms: config.platforms ?? {},
  };
}

export function validateConfig(input) {
  const errors = [];
  const warnings = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['La configuración debe ser un objeto JSON.'], warnings };
  }
  const config = withDefaults(input);

  for (const key of findSecretKeys(input)) {
    errors.push(`"${key}" parece un secreto. La configuración solo lleva IDs públicos; los tokens van en variables de entorno (.env).`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.client?.slug ?? '')) errors.push('client.slug es obligatorio (minúsculas, números y guiones).');
  if (!config.client?.name) errors.push('client.name es obligatorio.');
  if (!config.client?.domain) errors.push('client.domain es obligatorio.');
  if (!['gtm', 'direct'].includes(config.mode)) errors.push('mode debe ser "gtm" o "direct".');
  if (!['basic', 'advanced'].includes(config.consent.mode)) errors.push('consent.mode debe ser "basic" o "advanced".');
  const cats = config.consent.categories;
  if (cats !== undefined && (!Array.isArray(cats) || cats.some((c) => !['analytics', 'marketing', 'functional'].includes(c)))) {
    errors.push('consent.categories debe ser una lista con analytics, marketing y/o functional.');
  }
  if (!String(config.consent.version ?? '').trim()) errors.push('consent.version es obligatorio (cámbiala cuando cambie la política de cookies).');

  const fictitious = input.fictitious === true;
  for (const [name, fmt] of Object.entries(FORMATS)) {
    const id = platformId(config, name);
    if (!id) continue;
    if (!fmt.re.test(id)) errors.push(`platforms.${name}.${fmt.field} "${id}" no tiene el formato esperado (por ejemplo ${fmt.example}).`);
    else if (isFakeId(id) && !fictitious) errors.push(`platforms.${name}.${fmt.field} "${id}" es un ID de relleno. Pon el real o marca la config con "fictitious": true.`);
  }

  if (config.mode === 'gtm' && !platformId(config, 'gtm')) errors.push('En modo "gtm" falta platforms.gtm.id.');
  if (config.mode === 'direct' && enabledPlatforms(config).filter((n) => n !== 'gtm').length === 0) {
    errors.push('En modo "direct" activa al menos una plataforma (GA4, Meta, TikTok...).');
  }
  if (config.mode === 'direct' && platformId(config, 'gtm')) warnings.push('Hay un GTM en modo "direct": no se cargará. Usa mode "gtm" o quita el ID.');
  if (config.mode === 'gtm') {
    const informative = enabledPlatforms(config).filter((n) => n !== 'gtm');
    if (informative.length) warnings.push(`En modo "gtm" los IDs de ${informative.join(', ')} no se cargan desde el sitio: sirven de ficha para configurar el contenedor.`);
  }
  if (fictitious) warnings.push('Configuración FICTICIA: no desplegar en un sitio real.');
  if (!config.consent.banner) warnings.push('consent.banner está apagado: el sitio debe llamar a TagOrq.consent.set(...) con su propio aviso.');

  return { ok: errors.length === 0, errors, warnings, config };
}

// Solo lo que necesita el navegador (sin campos de documentación que empiezan con "_").
export function publicConfig(config) {
  const c = withDefaults(config);
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, strip(v)]));
    }
    return node;
  };
  const out = strip(c);
  if (out.platforms?.meta) delete out.platforms.meta.capi;
  return out;
}
