import { decodeFrame, magnetOffset, spotAt } from './decode.js';

// Detalles retro y futuristas del sitio: etiquetas que se decodifican, foco de luz en las tarjetas de servicio y
// botones que se acercan al cursor. Todo es opcional: sin JavaScript, con menos movimiento o sin cursor fino
// el sitio queda igual, solo quieto.

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Las etiquetas «// así» se escriben como si una terminal las descifrara. El texto real queda para lectores de
// pantalla durante la animación (el decodificado va en un span aria-hidden) y al terminar se restaura tal cual.
function setupDecode() {
  if (reduce() || !('IntersectionObserver' in window)) return;
  const labels = [...document.querySelectorAll('.c-eyebrow, .c-hero__eyebrow')];
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
  document.querySelectorAll('.c-service').forEach((card) => {
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

export function setupOrnaments() {
  setupDecode();
  setupSpotlight();
  setupMagnet();
}
