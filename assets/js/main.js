import { nextTheme, readStoredTheme, resolveTheme, saveTheme } from './theme.js';
import { pickActive } from './scrollspy.js';
import { staggerDelay } from './reveal.js';

// Avisa al script de la cabecera que este modulo cargo: si no llega, ese script muestra todo.
window.__revealReady = true;

const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const toggles = document.querySelectorAll('.js-theme-toggle');

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = undefined;
}

function apply(theme) {
  root.dataset.theme = theme;
  toggles.forEach((button) => button.setAttribute('aria-pressed', String(theme === 'dark')));
}

apply(resolveTheme(readStoredTheme(storage), media.matches));

toggles.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = nextTheme(root.dataset.theme);
    apply(theme);
    saveTheme(storage, theme);
  });
});

// Si la persona no eligio un tema, acompana los cambios del sistema.
media.addEventListener('change', (event) => {
  if (!readStoredTheme(storage)) apply(resolveTheme(null, event.matches));
});

// Revelado: tarjetas y titulos aparecen al entrar en pantalla, de uno en uno.
const revealTargets = [...document.querySelectorAll('[data-reveal]')];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((entry, index) => {
          entry.target.style.setProperty('--reveal-delay', `${staggerDelay(index)}ms`);
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add('is-revealed'));
}

// Scroll-spy: marca en el menu y en el riel la seccion que se esta leyendo.
const spyLinks = [...document.querySelectorAll('.js-spy')];
const spyIds = [...new Set(spyLinks.map((link) => link.getAttribute('href').slice(1)))];
const spySections = spyIds.map((id) => document.getElementById(id)).filter(Boolean);

function updateSpy() {
  const line = window.innerHeight * 0.4;
  const active = pickActive(
    spySections.map((section) => {
      const rect = section.getBoundingClientRect();
      return { id: section.id, top: rect.top, bottom: rect.bottom };
    }),
    line,
  );
  spyLinks.forEach((link) => {
    const current = link.getAttribute('href') === `#${active}`;
    link.classList.toggle('is-active', current);
    if (current) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

let spyFrame = 0;
function onScroll() {
  if (spyFrame) return;
  spyFrame = requestAnimationFrame(() => {
    spyFrame = 0;
    updateSpy();
  });
}

if (spySections.length) {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateSpy();
}
