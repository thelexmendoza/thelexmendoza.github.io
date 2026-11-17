// Aviso de cookies mínimo y accesible: Aceptar, Rechazar y Configurar (como promete la política del sitio).
// Sin estilos propios salvo lo indispensable: el sitio los viste con las clases .tagorq-*.
// Cualquier elemento con [data-tagorq-prefs] (por ejemplo "Preferencias de cookies" en el pie) lo reabre.

export const DEFAULT_TEXTS = {
  title: 'Tu privacidad',
  body: 'Uso cookies de analítica y de medición de anuncios solo si tú lo permites. Rechazar no te quita nada del servicio.',
  accept: 'Aceptar',
  reject: 'Rechazar',
  configure: 'Configurar',
  save: 'Guardar',
  analytics: 'Analítica: me ayuda a saber qué páginas se usan.',
  marketing: 'Medición de anuncios: mide si mis anuncios funcionan.',
  functional: 'Preferencias: recuerda ajustes como el tema.',
  policy: 'Política de cookies',
  policyHref: '/cookies/',
};

// `categories`: solo se muestran las casillas de las categorías que de verdad se usan.
export function mountBanner(api, doc, texts = {}, categories = ['analytics', 'marketing', 'functional']) {
  const t = { ...DEFAULT_TEXTS, ...texts };
  let root = null;

  const el = (tag, attrs = {}, children = []) => {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const c of [].concat(children)) n.append(c);
    return n;
  };
  const button = (label, cls, onClick) => {
    const b = el('button', { type: 'button', class: `tagorq-btn ${cls}` }, label);
    b.addEventListener('click', onClick);
    return b;
  };
  const close = () => { root?.remove(); root = null; };

  function open() {
    if (root) return;
    const current = api.consent.get() ?? { analytics: false, marketing: false, functional: false };
    const boxes = {};
    const options = el('div', { class: 'tagorq-options', hidden: '' }, categories.map((k) => {
      boxes[k] = el('input', { type: 'checkbox', ...(current[k] ? { checked: '' } : {}) });
      return el('label', { class: 'tagorq-option' }, [boxes[k], ` ${t[k]}`]);
    }));
    const save = button(t.save, 'tagorq-btn--save', () => {
      api.consent.set(Object.fromEntries(Object.entries(boxes).map(([k, b]) => [k, b.checked])));
      close();
    });
    save.hidden = true;
    const configure = button(t.configure, 'tagorq-btn--configure', () => {
      options.hidden = false; save.hidden = false; configure.hidden = true;
    });
    root = el('div', { class: 'tagorq-banner', role: 'dialog', 'aria-label': t.title }, [
      el('p', { class: 'tagorq-title' }, t.title),
      el('p', { class: 'tagorq-body' }, [t.body, ' ', el('a', { href: t.policyHref }, t.policy)]),
      options,
      el('div', { class: 'tagorq-actions' }, [
        button(t.reject, 'tagorq-btn--reject', () => { api.consent.rejectAll(); close(); }),
        configure,
        save,
        button(t.accept, 'tagorq-btn--accept', () => { api.consent.acceptAll(); close(); }),
      ]),
    ]);
    doc.body.append(root);
  }

  doc.addEventListener('click', (e) => {
    if (e.target?.closest?.('[data-tagorq-prefs]')) { e.preventDefault?.(); open(); }
  });
  if (api.consent.needsDecision()) open();
  return { open, close };
}
