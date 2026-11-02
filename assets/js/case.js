import { stepIndex, nextFormat, PAGE, showMore, showLess } from './gallery.js';

const main = document.querySelector('main');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Los cambios de vista (tipo y formato) se animan con un fundido suave cuando el navegador lo permite y
// la persona acepta movimiento. El nombre de transicion solo existe mientras dura, para no crear un
// contexto de apilamiento permanente en <main>.
//
// Al cambiar de formato la altura de lo que queda arriba cambia y el contenido que se estaba viendo
// brincaria. Por eso se ancla: se toma la galeria que cruza la parte alta de la pantalla (o la primera de
// abajo), se mide donde esta y, ya cambiada la vista, se corrige el scroll para que siga en el mismo sitio.
function anchored(apply) {
  const bar = document.querySelector('.c-bar')?.offsetHeight ?? 0;
  const galleries = [...document.querySelectorAll('.c-gallery, .c-icons')].filter((el) => el.offsetParent !== null);
  const anchor = galleries.find((el) => el.getBoundingClientRect().bottom > bar + 1);
  const before = anchor?.getBoundingClientRect().top;
  apply();
  if (anchor && anchor.offsetParent !== null) {
    const shift = anchor.getBoundingClientRect().top - before;
    if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
  }
}

function smooth(change) {
  const apply = () => anchored(change);
  if (!document.startViewTransition || reduceMotion.matches) {
    apply();
    return;
  }
  main.style.viewTransitionName = 'case';
  document.startViewTransition(apply).finished.finally(() => {
    main.style.viewTransitionName = '';
  });
}

// Vistas: solo cambian que galerias se ven; el CSS no toca el texto.
const lensButtons = [...document.querySelectorAll('[data-lens]')].filter((el) => el.tagName === 'BUTTON');
lensButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const lens = button.dataset.lens;
    smooth(() => {
      main.dataset.lens = lens;
      lensButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    });
  });
});

// Videos de YouTube: el reproductor se carga al tocar la miniatura (youtube-nocookie, sin cookies hasta entonces).
document.addEventListener('click', (event) => {
  const button = event.target.closest('.js-play');
  if (!button) return;
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.video)}?autoplay=1&rel=0`;
  frame.title = button.dataset.title ?? 'Video de YouTube';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.className = 'c-gallery__frame';
  button.replaceWith(frame);
});

// Marca: oculta las galerias de otra marca (las que no tienen marca siempre se ven).
const brandButtons = [...document.querySelectorAll('[data-brand-filter]')];
brandButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const brand = button.dataset.brandFilter;
    smooth(() => {
      document.querySelectorAll('[data-brand]').forEach((gallery) => {
        gallery.classList.toggle('is-brand-off', brand !== 'todas' && gallery.dataset.brand !== brand);
      });
      brandButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    });
  });
});

// Formato: cuadricula tipo Instagram o carrusel, para todas las galerias a la vez.
const formatButtons = [...document.querySelectorAll('.c-format [data-format]')];
formatButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const next = nextFormat(main.dataset.format ?? null, button.dataset.format);
    smooth(() => {
      if (next) main.dataset.format = next;
      else delete main.dataset.format;
      formatButtons.forEach((other) => other.setAttribute('aria-pressed', String(other.dataset.format === next)));
    });
  });
});

// Flechas del carrusel: el carrusel ya se desliza solo; las flechas son una ayuda.
document.querySelectorAll('.c-gallery').forEach((gallery) => {
  const track = gallery.querySelector('.c-gallery__track');
  if (!track) return;
  const controls = document.createElement('div');
  controls.className = 'c-gallery__controls';
  [['‹', -1, 'Anterior'], ['›', 1, 'Siguiente']].forEach(([symbol, direction, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'c-gallery__step';
    button.setAttribute('aria-label', label);
    button.textContent = symbol;
    button.addEventListener('click', () => {
      track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
    controls.append(button);
  });
  track.before(controls);

  // Cuadricula con muchas piezas: se ven seis y hay botones de mostrar mas y menos.
  const slides = [...track.children];
  if (slides.length <= PAGE) return;
  let visible = PAGE;
  const more = document.createElement('div');
  more.className = 'c-gallery__more';
  const makeButton = (label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'c-gallery__more-button';
    button.textContent = label;
    more.append(button);
    return button;
  };
  const moreButton = makeButton('Mostrar más');
  const lessButton = makeButton('Mostrar menos');
  const sync = () => {
    slides.forEach((slide, i) => slide.classList.toggle('is-folded', i >= visible));
    moreButton.hidden = visible >= slides.length;
    lessButton.hidden = visible <= PAGE;
  };
  moreButton.addEventListener('click', () => {
    visible = showMore(visible, slides.length);
    sync();
  });
  lessButton.addEventListener('click', () => {
    visible = showLess();
    sync();
    gallery.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
  track.after(more);
  sync();
});

// Volver al hero: el boton flotante aparece cuando el hero ya salio de la pantalla.
const toTop = document.querySelector('.js-to-top');
const hero = document.getElementById('caso-inicio');
if (toTop && hero) {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => toTop.classList.toggle('is-visible', !entry.isIntersecting)).observe(hero);
  }
  toTop.addEventListener('click', (event) => {
    event.preventDefault();
    hero.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });
}

// Lightbox.
const dialog = document.querySelector('.c-lightbox');
if (dialog) {
  const figure = dialog.querySelector('.c-lightbox__figure');
  let items = [];
  let index = 0;

  const show = (next) => {
    index = next;
    const button = items[index];
    const image = document.createElement('img');
    image.src = button.dataset.full;
    image.alt = button.dataset.caption || '';
    const caption = document.createElement('figcaption');
    caption.textContent = button.dataset.caption || '';
    figure.replaceChildren(image, caption);
    const multiple = items.length > 1;
    dialog.querySelectorAll('.c-lightbox__nav').forEach((nav) => (nav.hidden = !multiple));
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('.js-open');
    if (!opener) return;
    const group = opener.closest('[data-gallery]');
    items = [...group.querySelectorAll('.js-open')];
    show(items.indexOf(opener));
    dialog.showModal();
  });

  dialog.querySelector('.c-lightbox__nav--prev').addEventListener('click', () => show(stepIndex(index, -1, items.length)));
  dialog.querySelector('.c-lightbox__nav--next').addEventListener('click', () => show(stepIndex(index, 1, items.length)));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(stepIndex(index, -1, items.length));
    if (event.key === 'ArrowRight') show(stepIndex(index, 1, items.length));
  });
  // Un clic en el fondo oscuro (fuera de la imagen) cierra.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // La imagen se retira cuando el fundido de salida termino, para que no desaparezca antes que el modal.
  dialog.addEventListener('close', () => {
    setTimeout(() => {
      if (!dialog.open) figure.replaceChildren();
    }, 250);
  });
}
