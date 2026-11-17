// Cargadores y emisores por plataforma (modo "direct"). En modo "gtm" no se usan: lo hace el contenedor.
// Todos reciben `win` y `doc` para poder probarse sin navegador.
// Para sumar una plataforma: agrega su formato en config.mjs, su categoría en PLATFORM_CATEGORY,
// su mapeo en events.mjs y su entrada aquí (load + send).

import { META_STANDARD, mapParams } from './events.mjs';
import { toConsentMode } from './consent.mjs';

export function loadScript(doc, src) {
  const s = doc.createElement('script');
  s.async = true;
  s.src = src;
  doc.head.appendChild(s);
  return s;
}

export function ensureGtag(win) {
  win.dataLayer = win.dataLayer || [];
  if (!win.gtag) win.gtag = function gtag() { win.dataLayer.push(arguments); };
  return win.gtag;
}

// ga4 y google_ads comparten gtag.js: se descarga una sola vez.
function ensureGtagScript(win, doc, firstId) {
  if (win.__tagorqGtagLoaded) return;
  win.__tagorqGtagLoaded = true;
  const gtag = ensureGtag(win);
  gtag('js', new Date());
  loadScript(doc, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstId)}`);
}

export function loadGtm(win, doc, id) {
  if (win.__tagorqGtmLoaded) return;
  win.__tagorqGtmLoaded = true;
  ensureGtag(win);
  win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  loadScript(doc, `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
}

export const PLATFORMS = {
  ga4: {
    load(win, doc, cfg) {
      ensureGtagScript(win, doc, cfg.id);
      win.gtag('config', cfg.id, { send_page_view: false }); // el page_view lo manda track()
    },
    send(win, ev, params, ctx) {
      if (!ev.names.ga4) return;
      win.gtag('event', ev.names.ga4, { ...mapParams('ga4', params), event_id: ctx.eventId });
    },
  },

  google_ads: {
    load(win, doc, cfg) {
      ensureGtagScript(win, doc, cfg.id);
      win.gtag('config', cfg.id);
    },
    send(win, ev, params, ctx, cfg) {
      const label = cfg.conversions?.[ev.canonical];
      if (!label) return;
      const payload = { send_to: `${cfg.id}/${label}` };
      if (params.value != null) payload.value = params.value;
      if (params.currency) payload.currency = params.currency;
      if (params.order_id) payload.transaction_id = params.order_id;
      win.gtag('event', 'conversion', payload);
    },
  },

  meta: {
    load(win, doc, cfg) {
      if (!win.fbq) {
        const n = (win.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
        if (!win._fbq) win._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        loadScript(doc, 'https://connect.facebook.net/en_US/fbevents.js');
      }
      win.fbq('init', cfg.pixel_id);
    },
    send(win, ev, params, ctx) {
      const name = ev.names.meta;
      if (!name) return;
      // eventID = el mismo event_id que usa la Conversions API: así Meta deduplica navegador y servidor.
      win.fbq(META_STANDARD.has(name) ? 'track' : 'trackCustom', name, mapParams('meta', params), { eventID: ctx.eventId });
    },
  },

  tiktok: {
    load(win, doc, cfg) {
      const t = 'ttq';
      win.TiktokAnalyticsObject = t;
      const ttq = (win[t] = win[t] || []);
      if (!ttq.load) {
        ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
        ttq.setAndDefer = (o, m) => { o[m] = (...args) => o.push([m, ...args]); };
        ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m));
        ttq.load = (id) => {
          loadScript(doc, `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=${t}`);
        };
      }
      ttq.load(cfg.pixel_id);
    },
    send(win, ev, params, ctx) {
      const name = ev.names.tiktok;
      if (!name) return;
      if (name === 'page') win.ttq.page();
      else win.ttq.track(name, mapParams('tiktok', params), { event_id: ctx.eventId });
    },
  },

  clarity: {
    load(win, doc, cfg) {
      if (!win.clarity) win.clarity = function () { (win.clarity.q = win.clarity.q || []).push(arguments); };
      loadScript(doc, `https://www.clarity.ms/tag/${encodeURIComponent(cfg.project_id)}`);
    },
    send(win, ev) {
      if (ev.canonical === 'page_view') return; // Clarity ya registra la sesión
      win.clarity('event', ev.canonical);
    },
    consent(win, cats) {
      const m = toConsentMode(cats);
      if (win.clarity) win.clarity('consentv2', { ad_Storage: m.ad_storage, analytics_Storage: m.analytics_storage });
    },
  },

  linkedin: {
    load(win, doc, cfg) {
      win._linkedin_data_partner_ids = win._linkedin_data_partner_ids || [];
      win._linkedin_data_partner_ids.push(cfg.partner_id);
      if (!win.lintrk) {
        win.lintrk = function (a, b) { win.lintrk.q.push([a, b]); };
        win.lintrk.q = [];
      }
      loadScript(doc, 'https://snap.licdn.com/li.lms-analytics/insight.min.js');
    },
    send(win, ev, params, ctx, cfg) {
      const id = cfg.conversions?.[ev.canonical];
      if (id) win.lintrk('track', { conversion_id: Number(id) });
    },
  },

  pinterest: {
    load(win, doc, cfg) {
      if (!win.pintrk) {
        win.pintrk = function () { win.pintrk.queue.push(Array.prototype.slice.call(arguments)); };
        win.pintrk.queue = []; win.pintrk.version = '3.0';
        loadScript(doc, 'https://s.pinimg.com/ct/core.js');
      }
      win.pintrk('load', cfg.tag_id);
    },
    send(win, ev, params) {
      const name = ev.names.pinterest;
      if (!name) return;
      if (name === 'pagevisit') win.pintrk('page');
      else win.pintrk('track', name, mapParams('pinterest', params));
    },
  },
};
