// Videos de fondo del hero y de la tarjeta de un caso.
//
// Los videos no llevan `autoplay` en el HTML: este modulo los reproduce solo si la persona acepta movimiento
// (con menos movimiento se queda el poster). Cada video trae una version horizontal y, si la hay, una vertical
// para pantallas chicas (`data-src-mobile`, `data-poster-mobile`). En la tarjeta del home, el video no se
// descarga ni se reproduce hasta que la tarjeta se activa (cursor, teclado o, en tactil, `is-peek`).

import { createSky } from './sky.js';

const MOBILE = '(max-width: 767px)';

// Elige la version del video segun la pantalla. Sin version vertical, o sin su poster, cae a la horizontal.
export function chooseSource({ desktop, mobile, poster, posterMobile }, isMobile) {
  if (isMobile && mobile) return { src: mobile, poster: posterMobile || poster };
  return { src: desktop, poster };
}

function sourcesOf(video) {
  // Lo horizontal se recuerda la primera vez, porque despues el atributo `src` cambia con la pantalla.
  video.dataset.srcDesktop ??= video.getAttribute('src') ?? video.dataset.src ?? '';
  video.dataset.posterDesktop ??= video.getAttribute('poster') ?? '';
  return {
    desktop: video.dataset.srcDesktop,
    mobile: video.dataset.srcMobile,
    poster: video.dataset.posterDesktop,
    posterMobile: video.dataset.posterMobile,
  };
}

function load(video, isMobile) {
  const { src, poster } = chooseSource(sourcesOf(video), isMobile);
  if (poster) video.setAttribute('poster', poster);
  if (src && video.getAttribute('src') !== src) {
    video.setAttribute('src', src);
    video.load();
  }
}

const play = (video) => video.play().catch(() => {});

// Prepara un video antes de que haga falta: asigna la fuente, lo deja en `preload` completo y lo hace arrancar un instante
// para que el navegador cree su decodificador, y luego lo regresa al primer cuadro y lo pausa. Sin esto, la primera vez que
// se activa la tarjeta el navegador crea el decodificador en pleno hover y se congela ~100 ms: la animacion salta.
// `isActive` evita pausar un video que el hover ya puso a reproducir.
function warmUp(video, isMobile, isActive) {
  load(video, isMobile);
  video.preload = 'auto';
  video.addEventListener(
    'playing',
    () => {
      if (!isActive()) {
        video.pause();
        video.currentTime = 0;
      }
    },
    { once: true },
  );
  play(video);
}

// Hero: los videos cargan y se reproducen de inmediato; el cielo animado corre mientras el hero se ve.
export function setupHeroVideos() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.c-case-hero[data-media]');
  const skies = [...document.querySelectorAll('.c-case-hero__media .c-sky')].map((host) => createSky(host, { reduce: reduce.matches }));
  if (skies.length && hero) {
    const set = (visible) => skies.forEach((sky) => sky.setActive(visible && !reduce.matches));
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => set(entry.isIntersecting)).observe(hero);
    else set(true);
  }
  const videos = [...document.querySelectorAll('.c-case-hero__media video')];
  if (!videos.length) return;
  const mobile = window.matchMedia(MOBILE);
  const run = () => {
    videos.forEach((video) => {
      load(video, mobile.matches);
      if (reduce.matches) video.pause();
      else play(video);
    });
  };
  run();
  mobile.addEventListener('change', run);
  reduce.addEventListener('change', run);
}

// Tarjeta del home: el video se carga y se reproduce solo mientras la tarjeta esta activa.
export function setupCardVideos() {
  const mobile = window.matchMedia(MOBILE);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.c-case-card[data-media]').forEach((card) => {
    const videos = [...card.querySelectorAll('.c-case-card__media video')];
    const skies = [...card.querySelectorAll('.c-case-card__media .c-sky')].map((host) => createSky(host, { reduce: reduce.matches }));
    if (!videos.length && !skies.length) return;
    const isActive = () => card.matches(':hover') || card.matches(':focus-visible') || card.classList.contains('is-peek');
    const sync = () => {
      const active = isActive();
      skies.forEach((sky) => sky.setActive(active && !reduce.matches));
      videos.forEach((video) => {
        if (active && !reduce.matches) {
          load(video, mobile.matches);
          play(video);
        } else video.pause();
      });
    };
    // Cuando la tarjeta esta cerca de la pantalla se calientan sus videos (una sola vez), sin esperar al hover.
    if (videos.length && !reduce.matches && 'IntersectionObserver' in window) {
      const warm = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          warm.disconnect();
          videos.forEach((video) => warmUp(video, mobile.matches, isActive));
        },
        { rootMargin: '400px' },
      );
      warm.observe(card);
    }
    ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach((type) => card.addEventListener(type, sync));
    new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ['class'] });
  });
}
