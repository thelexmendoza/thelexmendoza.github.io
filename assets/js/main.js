import { nextTheme, readStoredTheme, resolveTheme, saveTheme } from './theme.js';
import { pickActive } from './scrollspy.js';
import { staggerDelay } from './reveal.js';
import { setupCardVideos, setupHeroVideos, setupPlanVideo } from './media.js';
import { setupHeroFx } from './hero-fx.js';
import { setupOrnaments } from './ornaments.js';
import { setupLeave } from './leave.js';
import { setupPromo } from './promo.js';

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

// Cambia de tema con un fundido de medio segundo (View Transitions; sin ellas, transiciones CSS de color).
// Con la preferencia de menos movimiento el cambio es inmediato.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function switchTheme(theme) {
  if (reduceMotion.matches) {
    apply(theme);
    return;
  }
  root.classList.add('is-theming');
  const done = () => root.classList.remove('is-theming', 'is-theming-css');
  if (document.startViewTransition) {
    // Seguro: si el navegador no pinta fotogramas (pestana en segundo plano) la transicion nunca corre su
    // funcion; pasado un instante el tema se aplica igual para que el cambio no se quede a medias.
    let applied = false;
    const run = () => {
      if (applied) return;
      applied = true;
      apply(theme);
    };
    document.startViewTransition(run).finished.finally(done);
    setTimeout(() => {
      run();
      done();
    }, 700);
  } else {
    root.classList.add('is-theming-css');
    apply(theme);
    setTimeout(done, 550);
  }
}

toggles.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = nextTheme(root.dataset.theme);
    switchTheme(theme);
    saveTheme(storage, theme);
  });
});

// Si la persona no eligio un tema, acompana los cambios del sistema.
media.addEventListener('change', (event) => {
  if (!readStoredTheme(storage)) switchTheme(resolveTheme(null, event.matches));
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

// Tarjetas con imagenes: sin cursor (pantallas tactiles) hacen lo mismo que el hover cuando quedan en
// el centro de la pantalla, tras un instante para no parpadear mientras se hace scroll.
const PEEK_DELAY = 600;
const peekCards = [...document.querySelectorAll('.c-case-card[data-media]')];
if (peekCards.length && 'IntersectionObserver' in window && window.matchMedia('(hover: none)').matches) {
  const timers = new Map();
  const peekObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        clearTimeout(timers.get(target));
        if (isIntersecting) timers.set(target, setTimeout(() => target.classList.add('is-peek'), PEEK_DELAY));
        else target.classList.remove('is-peek');
      });
    },
    { rootMargin: '-38% 0px -38% 0px' },
  );
  peekCards.forEach((card) => peekObserver.observe(card));
}

// Scroll-spy: marca en el menu y en el riel la seccion que se esta leyendo.
const spyLinks = [...document.querySelectorAll('.js-spy')];
const spyIds = [...new Set(spyLinks.map((link) => link.getAttribute('href').slice(1)))];
const spySections = spyIds.map((id) => document.getElementById(id)).filter(Boolean);

let lastSpy = null;
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
  if (active !== lastSpy) {
    lastSpy = active;
    followSpy();
  }
}

// Barras que se desplazan de lado (la de la guia): mueve la barra para que el enlace activo quede a la vista.
const spyFollowers = [...document.querySelectorAll('[data-spy-follow]')];
function followSpy() {
  spyFollowers.forEach((box) => {
    const link = box.querySelector('.is-active');
    if (!link || box.scrollWidth <= box.clientWidth) return;
    const left = link.offsetLeft - (box.clientWidth - link.offsetWidth) / 2;
    box.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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

// Boton flotante de la guia: aparece cuando ya pasaste el indice (la seccion que sigue al hero) y te regresa a el. Sin JavaScript queda
// oculto y el enlace de la barra de capitulos hace lo mismo. En los casos el boton es otro (.js-to-top, case.js).
const guiaTop = document.querySelector('.js-guia-top');
const guiaIndice = guiaTop && document.querySelector(guiaTop.getAttribute('href'));
if (guiaTop && guiaIndice) {
  // Con un observador de interseccion el boton no aparecia si saltabas del hero a un capitulo sin pasar por el indice (un salto directo
  // no cruza ningun umbral): por eso se mide la posicion en cada scroll.
  let guiaFrame = 0;
  const syncGuiaTop = () => {
    guiaFrame = 0;
    guiaTop.classList.toggle('is-visible', guiaIndice.getBoundingClientRect().bottom < 0);
  };
  const queueGuiaTop = () => {
    if (!guiaFrame) guiaFrame = requestAnimationFrame(syncGuiaTop);
  };
  window.addEventListener('scroll', queueGuiaTop, { passive: true });
  window.addEventListener('resize', queueGuiaTop);
  syncGuiaTop();
  guiaTop.addEventListener('click', (event) => {
    event.preventDefault();
    guiaIndice.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });
}

// Videos de fondo: el del hero se reproduce al cargar; el de la tarjeta, mientras esta activa.
setupHeroVideos();
setupCardVideos();
setupPlanVideo();
setupPromo();
setupHeroFx();
setupOrnaments();
setupLeave();
