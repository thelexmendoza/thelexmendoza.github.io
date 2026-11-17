// Consentimiento: categorías de la política de cookies -> Consent Mode v2 de Google.
// Categorías: analytics (analítica), marketing (medición y anuncios), functional (preferencias).
// "Necesarias" no se pregunta: security_storage siempre va concedido.

export const CATEGORIES = ['analytics', 'marketing', 'functional'];
export const CONSENT_KEY = 'tagorq_consent';

export const normalizeCats = (cats = {}) => ({
  analytics: cats.analytics === true,
  marketing: cats.marketing === true,
  functional: cats.functional === true,
});

export const ALL = Object.freeze({ analytics: true, marketing: true, functional: true });
export const NONE = Object.freeze({ analytics: false, marketing: false, functional: false });

const g = (on) => (on ? 'granted' : 'denied');

// Consent Mode v2: los 4 señales que Google exige para audiencias y remarketing en el EEE,
// más las de preferencias.
export function toConsentMode(cats) {
  const c = normalizeCats(cats);
  return {
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
    analytics_storage: g(c.analytics),
    functionality_storage: g(c.functional),
    personalization_storage: g(c.functional),
    security_storage: 'granted',
  };
}

export const defaultConsentMode = () => toConsentMode(NONE);

export const hasAnyConsent = (cats) => Object.values(normalizeCats(cats)).some(Boolean);

// Guarda la decisión con categorías, fecha y versión. Caduca a los N meses o si cambia la versión
// (como promete la política de cookies del sitio). `storage` y `now` se inyectan para poder probarlo.
export function createStore({ storage, version, months = 12, now = () => Date.now() }) {
  const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
  return {
    read() {
      const raw = safe(() => storage?.getItem(CONSENT_KEY), null);
      if (!raw) return null;
      const data = safe(() => JSON.parse(raw), null);
      if (!data || data.v !== version || typeof data.ts !== 'number') return null;
      const expires = new Date(data.ts);
      expires.setMonth(expires.getMonth() + months);
      if (now() >= expires.getTime()) return null;
      return normalizeCats(data.cats);
    },
    write(cats) {
      const data = { v: version, ts: now(), cats: normalizeCats(cats) };
      safe(() => storage?.setItem(CONSENT_KEY, JSON.stringify(data)));
      return data;
    },
    clear() { safe(() => storage?.removeItem(CONSENT_KEY)); },
  };
}
