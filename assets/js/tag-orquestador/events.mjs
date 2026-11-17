// Eventos estándar unificados y su mapeo a cada plataforma.
// El sitio solo habla este idioma: track('lead', { ... }). Aquí se traduce a cada plataforma.
// `null` = esa plataforma no recibe el evento por defecto.
// Google Ads y LinkedIn miden conversiones por etiqueta/ID, no por nombre: se configuran en
// platforms.google_ads.conversions y platforms.linkedin.conversions, con el nombre canónico como clave.

export const EVENTS = {
  page_view:      { ga4: 'page_view',      meta: 'PageView',          tiktok: 'page',          pinterest: 'pagevisit' },
  view_content:   { ga4: 'view_item',      meta: 'ViewContent',       tiktok: 'ViewContent',   pinterest: null },
  click_cta:      { ga4: 'click_cta',      meta: 'ClickCTA',          tiktok: 'ClickButton',   pinterest: null },
  click_whatsapp: { ga4: 'click_whatsapp', meta: 'Contact',           tiktok: 'Contact',       pinterest: null },
  click_call:     { ga4: 'click_call',     meta: 'Contact',           tiktok: 'Contact',       pinterest: null },
  click_email:    { ga4: 'click_email',    meta: 'Contact',           tiktok: 'Contact',       pinterest: null },
  form_start:     { ga4: 'form_start',     meta: null,                tiktok: null,            pinterest: null },
  lead:           { ga4: 'generate_lead',  meta: 'Lead',              tiktok: 'SubmitForm',    pinterest: 'lead' },
  schedule:       { ga4: 'schedule',       meta: 'Schedule',          tiktok: 'Contact',       pinterest: null },
  begin_checkout: { ga4: 'begin_checkout', meta: 'InitiateCheckout',  tiktok: 'InitiateCheckout', pinterest: 'checkout' },
  purchase:       { ga4: 'purchase',       meta: 'Purchase',          tiktok: 'CompletePayment', pinterest: 'checkout' },
};

// Nombres alternativos que se aceptan y se resuelven al canónico.
export const ALIASES = {
  generate_lead: 'lead',
  whatsapp: 'click_whatsapp',
  phone_call: 'click_call',
  pageview: 'page_view',
};

// Eventos estándar de Meta; cualquier otro nombre se envía como evento personalizado (trackCustom).
export const META_STANDARD = new Set([
  'PageView', 'ViewContent', 'Contact', 'Lead', 'Schedule', 'InitiateCheckout', 'Purchase',
  'CompleteRegistration', 'AddToCart', 'Search', 'Subscribe',
]);

// Resuelve un nombre (canónico, alias o personalizado de la config) a { canonical, names }.
// Devuelve null si el evento no existe: así un error de dedo no se pierde en silencio.
export function resolveEvent(name, custom = {}) {
  const canonical = ALIASES[name] ?? name;
  const base = EVENTS[canonical] ?? custom[canonical];
  if (!base) return null;
  return { canonical, names: { ga4: null, meta: null, tiktok: null, pinterest: null, ...base } };
}

// Parámetros comunes -> los que espera cada plataforma. Entrada: value, currency, content_id,
// content_name, order_id (transaction_id), method, destination, form_id.
export function mapParams(platform, params = {}) {
  const p = { ...params };
  switch (platform) {
    case 'meta': {
      const out = {};
      if (p.value != null) out.value = p.value;
      if (p.currency) out.currency = p.currency;
      if (p.content_name) out.content_name = p.content_name;
      if (p.content_id) { out.content_ids = [String(p.content_id)]; out.content_type = 'product'; }
      return out;
    }
    case 'tiktok': {
      const out = {};
      if (p.value != null) out.value = p.value;
      if (p.currency) out.currency = p.currency;
      if (p.content_name) out.content_name = p.content_name;
      if (p.content_id) { out.content_id = String(p.content_id); out.content_type = 'product'; }
      return out;
    }
    case 'pinterest': {
      const out = {};
      if (p.value != null) out.value = p.value;
      if (p.currency) out.currency = p.currency;
      if (p.order_id) out.order_id = p.order_id;
      return out;
    }
    case 'ga4': {
      if (p.order_id != null) { p.transaction_id = p.order_id; delete p.order_id; }
      return p;
    }
    default:
      return p;
  }
}
