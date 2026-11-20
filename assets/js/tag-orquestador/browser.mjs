// Runtime del navegador: lee la config, respeta el consentimiento y reparte los eventos.
// Uso en el sitio:  import { init } from './tag-orquestador/browser.mjs';  init(config);
// Después, en cualquier parte:  TagOrq.track('lead', { form_id: 'contacto' });

import { validateConfig, publicConfig, platformId, enabledPlatforms, activeCategories, PLATFORM_CATEGORY, withDefaults } from './config.mjs';
import { createStore, normalizeCats, toConsentMode, defaultConsentMode, hasAnyConsent, NONE } from './consent.mjs';
import { resolveEvent } from './events.mjs';
import { PLATFORMS, ensureGtag, loadGtm } from './platforms.mjs';

const MAX_QUEUE = 50;

export function newEventId(cryptoImpl = globalThis.crypto) {
  if (cryptoImpl?.randomUUID) return cryptoImpl.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTagOrq(input, env) {
  const { window: win, document: doc, storage } = env;
  const check = validateConfig(input);
  const log = (...a) => win.console?.warn?.('[tag-orquestador]', ...a);
  if (!check.ok) {
    log('Configuración inválida, no se carga ninguna etiqueta:\n- ' + check.errors.join('\n- '));
    const noop = () => {};
    return { track: noop, start: noop, ready: false, errors: check.errors, consent: { get: () => NONE, set: noop, acceptAll: noop, rejectAll: noop, needsDecision: () => false } };
  }
  const config = withDefaults(publicConfig(input));
  const store = createStore({ storage, version: String(config.consent.version), months: config.consent.durationMonths });

  let cats = store.read(); // null = aún sin decisión
  const loaded = new Set();
  const queue = []; // modo directo: eventos esperando consentimiento
  let started = false;

  const gtag = ensureGtag(win);
  if (!win.__tagorqConsentDefault) {
    gtag('consent', 'default', defaultConsentMode());
    win.__tagorqConsentDefault = true;
  }

  const emit = (type, detail) => {
    if (typeof win.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') win.dispatchEvent(new CustomEvent(type, { detail }));
  };

  function sendToLoaded(item) {
    for (const name of loaded) {
      if (item.sent.has(name)) continue;
      item.sent.add(name);
      const ev = resolveEvent(item.name, config.events.custom);
      try { PLATFORMS[name].send(win, ev, item.params, { eventId: item.eventId }, config.platforms[name]); }
      catch (e) { log(`Falló ${name} con "${item.name}"`, e); }
    }
  }

  function loadAllowed() {
    if (config.mode === 'gtm') {
      const id = platformId(config, 'gtm');
      if (config.consent.mode === 'advanced' || (cats && hasAnyConsent(cats))) loadGtm(win, doc, id);
      return;
    }
    for (const name of enabledPlatforms(config)) {
      if (name === 'gtm' || loaded.has(name)) continue;
      const need = PLATFORM_CATEGORY[name];
      if (!(cats && cats[need])) continue; // modo directo: sin consentimiento de su categoría, nunca se carga
      PLATFORMS[name].load(win, doc, config.platforms[name]);
      loaded.add(name);
    }
    queue.forEach(sendToLoaded);
  }

  function applyConsent() {
    gtag('consent', 'update', toConsentMode(cats));
    PLATFORMS.clarity.consent?.(win, cats);
    loadAllowed();
  }

  function setConsent(next) {
    cats = normalizeCats(next);
    store.write(cats);
    if (!hasAnyConsent(cats)) queue.length = 0;
    applyConsent();
    emit('tagorq:consent', cats);
  }

  function track(name, params = {}) {
    const ev = resolveEvent(name, config.events.custom);
    if (!ev) { log(`Evento desconocido: "${name}". Usa uno de events.mjs o decláralo en events.custom.`); return null; }
    const eventId = params.event_id ?? newEventId();
    const clean = { ...params };
    delete clean.event_id;
    if (config.mode === 'gtm') {
      win.dataLayer.push({ event: ev.names.ga4 ?? ev.canonical, tagorq_event: ev.canonical, event_id: eventId, ...clean });
      return eventId;
    }
    const item = { name, params: clean, eventId, sent: new Set() };
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push(item);
    sendToLoaded(item);
    return eventId;
  }

  function bindAutoEvents() {
    doc.addEventListener('click', (e) => {
      const a = e.target?.closest?.('a[href], [data-track]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const attr = a.getAttribute('data-track');
      if (attr) return track(attr, { content_name: a.getAttribute('data-track-label') || undefined });
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href)) track('click_whatsapp', { destination: 'whatsapp' });
      else if (href.startsWith('tel:')) track('click_call', { destination: 'telefono' });
      else if (href.startsWith('mailto:')) track('click_email', { destination: 'correo' });
    });
    doc.addEventListener('submit', (e) => {
      const name = e.target?.getAttribute?.('data-track-form');
      if (name) track(name, { form_id: e.target.id || undefined });
    });
  }

  function start() {
    if (started) return;
    started = true;
    if (cats) applyConsent(); else loadAllowed();
    if (config.events.autoPageView) track('page_view', { page_location: win.location?.href, page_title: doc.title });
    if (config.events.autoBind && typeof doc.addEventListener === 'function') bindAutoEvents();
    emit('tagorq:ready', { needsDecision: cats === null });
  }

  return {
    ready: true,
    config,
    track,
    start,
    consent: {
      get: () => (cats ? { ...cats } : null),
      set: setConsent,
      // Aceptar concede solo las categorías que el aviso ofrece (no las que ninguna plataforma usa).
      acceptAll: () => setConsent(Object.fromEntries(activeCategories(config).map((c) => [c, true]))),
      rejectAll: () => setConsent(NONE),
      needsDecision: () => cats === null,
      reset: () => { store.clear(); cats = null; },
    },
  };
}

// Punto de entrada para el navegador: crea window.TagOrq, arranca y muestra el aviso si hace falta.
export async function init(config, env = { window, document, storage: safeLocalStorage() }) {
  const api = createTagOrq(config, env);
  env.window.TagOrq = api;
  api.start();
  if (api.ready && api.config.consent.banner) {
    const { mountBanner } = await import('./banner.mjs');
    mountBanner(api, env.document, api.config.consent.texts, activeCategories(api.config));
  }
  return api;
}

function safeLocalStorage() {
  try { return window.localStorage; } catch { return null; }
}
