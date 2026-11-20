import { decodeFrame, magnetOffset, spotAt } from './decode.js';

// Detalles retro y futuristas del sitio: etiquetas que se decodifican, foco de luz en las tarjetas de servicio y
// botones que se acercan al cursor. Todo es opcional: sin JavaScript, con menos movimiento o sin cursor fino
// el sitio queda igual, solo quieto.

// Paginas de lectura (privacidad y cookies) llevan <html data-calm>: sin decodificado, foco ni imanes. Es informacion para leerse con cuidado.
const calm = () => document.documentElement.hasAttribute('data-calm');
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || calm();
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Las etiquetas «// así» se escriben como si una terminal las descifrara. El texto real queda para lectores de
// pantalla durante la animación (el decodificado va en un span aria-hidden) y al terminar se restaura tal cual.
function setupDecode() {
  if (reduce() || !('IntersectionObserver' in window)) return;
  const labels = [...document.querySelectorAll('.c-eyebrow, .c-hero__eyebrow, .c-promo__paso-num, .c-promo__caso-etiqueta, .c-guia__num')];
  const FRAMES = 16;
  const FRAME_MS = 34;
  const run = (el) => {
    const text = el.textContent;
    const real = document.createElement('span');
    real.className = 'u-visually-hidden';
    real.textContent = text;
    const fake = document.createElement('span');
    fake.setAttribute('aria-hidden', 'true');
    el.replaceChildren(real, fake);
    let frame = 0;
    const step = () => {
      fake.textContent = decodeFrame(text, frame / FRAMES);
      frame += 1;
      if (frame <= FRAMES) setTimeout(step, FRAME_MS);
      else el.textContent = text;
    };
    step();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        run(entry.target);
      });
    },
    { threshold: 0.8 },
  );
  labels.forEach((label) => observer.observe(label));
}

// Foco de luz del acento que sigue al cursor dentro de las tarjetas de servicio.
function setupSpotlight() {
  if (reduce() || !finePointer()) return;
  document.querySelectorAll('.c-service, .c-promo__plan, .c-promo__caso a, .c-guia__card, .c-guia__indice a').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const spot = spotAt(event.clientX, event.clientY, card.getBoundingClientRect());
      card.style.setProperty('--mx', `${spot.x.toFixed(0)}px`);
      card.style.setProperty('--my', `${spot.y.toFixed(0)}px`);
      card.classList.add('is-lit');
    });
    card.addEventListener('pointerleave', () => card.classList.remove('is-lit'));
  });
}

// Botones magnéticos: se corren unos píxeles hacia el cursor cuando está cerca.
function setupMagnet() {
  if (reduce() || !finePointer()) return;
  const buttons = [...document.querySelectorAll('.c-button:not([aria-disabled="true"])')];
  if (!buttons.length) return;
  let frame = 0;
  let last = null;
  const update = () => {
    frame = 0;
    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();
      const offset = last
        ? magnetOffset(last.x - (rect.left + rect.width / 2), last.y - (rect.top + rect.height / 2), { radius: 40 + rect.width * 0.6 })
        : { x: 0, y: 0 };
      button.style.setProperty('--mag-x', `${offset.x.toFixed(1)}px`);
      button.style.setProperty('--mag-y', `${offset.y.toFixed(1)}px`);
    });
  };
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    last = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  });
  document.addEventListener('pointerleave', () => {
    last = null;
    if (!frame) frame = requestAnimationFrame(update);
  });
}

// El titulo principal de cada hero (el h1 de <main>; los demas titulos no) se escribe como si una terminal lo descifrara: de
// izquierda a derecha los simbolos se resuelven en las letras de verdad cuando entra en pantalla. Se opera sobre los nodos de texto para conservar palabras
// con degradado; el nombre accesible queda fijo con aria-label, la altura se bloquea para que nada se mueva y al terminar
// se restaura el texto tal cual. Un h1 que llega con la transicion tarjeta-hero no se decodifica (se estaria morfando). Las paginas calmas no lo llevan.
function setupTitleDecode() {
  if (reduce() || !('IntersectionObserver' in window)) return;
  const titles = [...document.querySelectorAll('main h1')].filter((el) => !el.closest('dialog, [aria-hidden="true"]') && !el.closest('.is-revealed'));
  const FRAMES = 26;
  const FRAME_MS = 34;
  const run = (title) => {
    const nodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) nodes.push({ node: n, text: n.textContent });
    const total = nodes.reduce((sum, { text }) => sum + text.length, 0);
    if (!total) return;
    title.setAttribute('aria-label', title.textContent.trim().replace(/\s+/g, ' '));
    title.style.minBlockSize = `${title.offsetHeight}px`;
    let frame = 0;
    const step = () => {
      let offset = 0;
      for (const { node, text } of nodes) {
        const local = Math.min(1, Math.max(0, ((frame / FRAMES) * total - offset) / Math.max(1, text.length)));
        node.textContent = decodeFrame(text, local);
        offset += text.length;
      }
      frame += 1;
      if (frame <= FRAMES) setTimeout(step, FRAME_MS);
      else {
        nodes.forEach(({ node, text }) => (node.textContent = text));
        title.removeAttribute('aria-label');
        title.style.minBlockSize = '';
      }
    };
    step();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        setTimeout(() => run(entry.target), 120);
      });
    },
    { threshold: 0.6 },
  );
  titles.forEach((title) => observer.observe(title));
}

export function setupOrnaments() {
  setupTitleDecode();
  setupDecode();
  setupSpotlight();
  setupMagnet();
}
