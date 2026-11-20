import { decodeFrame } from './decode.js';

// «Instrumento» (solo la home): la capa de interfaz inspirada en la dirección de arte de Kojima (MGS3, MGS4 y Death Stranding).
// Arranque ligado a la carga real, lecturas y regla en el margen, corchetes en las tarjetas de caso, fondos por sección con
// parallax de scroll y de mouse, y retículas alineadas a las columnas del sitio. Todo es decorativo (aria-hidden), no guarda
// nada en el navegador y no corre en las páginas de lectura (`data-calm`) ni en ninguna página que no sea la home.
// La lógica pura vive arriba para probarla con `npm test`; el DOM, abajo.

const NS = 'http://www.w3.org/2000/svg';
const ROW = 89; // un paso de la escala Fibonacci: alto del ritmo vertical de las cruces
const BOOT_MIN_MS = 900;
const BOOT_MAX_MS = 3500;
const DEPTH = { far: 6, mid: 16, near: 30 }; // px que se mueve cada capa con el cursor

// Une las x de las columnas: ordenadas y sin repetir las que quedan a `tolerance` px una de otra.
export function mergeColumns(xs, tolerance = 2) {
  return [...xs]
    .map(Math.round)
    .sort((a, b) => a - b)
    .filter((x, i, all) => i === 0 || x - all[i - 1] > tolerance);
}

// ¿Toca mostrar el arranque? Solo al entrar al sitio desde fuera o al recargar; nunca al volver con «atrás», al navegar
// desde otra página del sitio, con menos movimiento ni en páginas calmas. No usa almacenamiento: lo decide el referente.
export function shouldBoot({ referrer = '', origin = '', navType = 'navigate', reduce = false, calm = false } = {}) {
  if (reduce || calm) return false;
  if (navType === 'back_forward' || navType === 'prerender') return false;
  if (!referrer) return true;
  try {
    return new URL(referrer).origin !== origin;
  } catch {
    return true;
  }
}

// Desplazamiento de las guías con el cursor: las capas de cuadrícula solo se mueven en vertical para no perder la alineación.
export function parallaxOffset(eased, depth, isGrid) {
  return { x: isGrid ? 0 : -eased.x * depth, y: -eased.y * depth };
}

// Progreso de la regla: 0 arriba, 1 abajo.
export function scrollProgress(scrollY, scrollHeight, innerHeight) {
  return Math.min(1, Math.max(0, scrollY / Math.max(1, scrollHeight - innerHeight)));
}

const rnd = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const el = (name, attrs = {}, text) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
};

// Escenas de los fondos (lienzo de 1200 x 800; el SVG se ajusta con `slice`). Cada una pinta tres capas: lejana, media y cercana.
const W = 1200;
const H = 800;
const line = (x1, y1, x2, y2, extra = {}) => el('line', { x1, y1, x2, y2, ...extra });
const mono = (x, y, text, size = 12) => el('text', { x, y, 'font-size': size, fill: 'currentColor', 'font-family': 'IBM Plex Mono, monospace', 'letter-spacing': '2' }, text);
const contour = (k, count, amp = 26) => {
  const y0 = (H / (count + 1)) * (k + 1);
  let d = '';
  for (let x = 0; x <= W; x += 24) d += `${x ? 'L' : 'M'}${x} ${(y0 + Math.sin(x / 110 + k * 0.7) * amp + Math.sin(x / 41 + k) * amp * 0.3).toFixed(1)}`;
  return el('path', { d });
};

const SCENES = {
  // Mapa táctico: sectores y curvas de nivel.
  mapa(far, mid) {
    for (let y = 0; y <= H; y += 150) far.append(line(0, y, W, y));
    'ABCDEFGH'.split('').forEach((letter, i) => {
      for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) far.append(mono(i * 150 + 10, j * 150 + 22, `${letter}-${j + 1}`));
    });
    for (let k = 0; k < 6; k++) mid.append(contour(k, 6));
  },
  // Plano técnico: cajas con cotas.
  plano(_far, mid) {
    [[120, 120, 420, 220, '1200'], [560, 90, 520, 120, '64'], [200, 440, 300, 260, '320'], [620, 420, 460, 300, '480']].forEach(([x, y, w, h, label]) => {
      mid.append(el('rect', { x, y, width: w, height: h }));
      mid.append(line(x, y + h + 18, x + w, y + h + 18), line(x, y + h + 12, x, y + h + 24), line(x + w, y + h + 12, x + w, y + h + 24));
      mid.append(mono(x + w / 2 - 14, y + h + 36, label, 11));
    });
  },
  // Nodos conectados: el recorrido de un proyecto.
  nodos(_far, mid) {
    const points = [[150, 560], [420, 300], [680, 520], [930, 240], [1100, 460]];
    mid.append(el('polyline', { points: points.map((p) => p.join(',')).join(' ') }));
    points.forEach(([x, y], i) => {
      mid.append(el('rect', { x: x - 11, y: y - 11, width: 22, height: 22 }));
      mid.append(mono(x + 18, y - 16, `0${i + 1}`));
    });
  },
  // Frecuencia: ondas de osciloscopio y escala.
  frecuencia(far, mid) {
    for (let x = 0; x <= W; x += 12) far.append(line(x, 700, x, x % 60 === 0 ? 744 : 722));
    [[1, 90], [1.7, 55], [2.6, 30]].forEach(([freq, amp], i) => {
      let d = '';
      for (let x = 0; x <= W; x += 8) d += `${x ? 'L' : 'M'}${x} ${(300 + i * 110 + Math.sin(x / (70 / freq)) * amp).toFixed(1)}`;
      mid.append(el('path', { d }));
    });
    mid.append(mono(80, 690, '142.85 MHZ', 14));
  },
};

// Qué escena lleva cada sección de la home.
const SECTION_SCENES = { casos: 'mapa', servicios: 'plano', 'sobre-mi': 'nodos', contacto: 'frecuencia' };

function setupBoot() {
  const boot = document.querySelector('.c-boot');
  if (!boot) return;
  const nav = performance.getEntriesByType?.('navigation')?.[0]?.type ?? 'navigate';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!shouldBoot({ referrer: document.referrer, origin: location.origin, navType: nav, reduce })) {
    boot.remove();
    return;
  }
  const fill = boot.querySelector('.c-boot__fill');
  const label = boot.querySelector('.c-boot__text');
  const target = label.textContent;
  const t0 = performance.now();
  // Señales reales: fuentes listas, carga de la página y titular presente.
  const done = { fonts: false, load: document.readyState === 'complete', title: !!document.querySelector('main h1') };
  document.fonts.ready.then(() => { done.fonts = true; });
  window.addEventListener('load', () => { done.load = true; }, { once: true });
  const finish = () => {
    boot.classList.add('is-out');
    setTimeout(() => boot.remove(), 350);
  };
  const tick = (now) => {
    const ready = Object.values(done).filter(Boolean).length / 3;
    const age = now - t0;
    fill.style.width = `${Math.min(ready, age / BOOT_MIN_MS) * 100}%`;
    label.textContent = decodeFrame(target, Math.min(1, age / 700));
    if ((ready === 1 && age > BOOT_MIN_MS) || age > BOOT_MAX_MS) finish();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setupReadout() {
  const ruler = document.createElement('div');
  ruler.className = 'c-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  const mark = document.createElement('b');
  mark.className = 'c-ruler__mark';
  ruler.append(mark);
  const readout = document.createElement('div');
  readout.className = 'c-readout';
  readout.setAttribute('aria-hidden', 'true');
  // Filas de lectura armadas con nodos del DOM (nunca se asigna HTML como texto): etiqueta + valor.
  const row = (label, cls, extra = '') => {
    const span = document.createElement('span');
    if (extra) span.className = extra;
    const value = document.createElement('b');
    value.className = cls;
    value.textContent = '—';
    span.append(`${label} `, value);
    return span;
  };
  const coords = document.createElement('span');
  const bx = document.createElement('b');
  bx.className = 'js-r-x';
  bx.textContent = '0.00';
  const by = document.createElement('b');
  by.className = 'js-r-y';
  by.textContent = '0.00';
  coords.append('x ', bx, ' · y ', by);
  readout.append(row('sec', 'js-r-sec'), row('avance', 'js-r-pct'), coords, row('caso', 'js-r-case', 'c-readout__case'));
  document.body.append(ruler, readout);
  const q = (cls) => readout.querySelector(cls);
  const sections = [...document.querySelectorAll('main section[id], footer[id]')];
  let mx = 0;
  let my = 0;
  let frame = 0;
  const update = () => {
    frame = 0;
    const p = scrollProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
    mark.style.top = `${p * 100}%`;
    const current = [...sections].reverse().find((s) => s.getBoundingClientRect().top <= window.innerHeight * 0.4);
    q('.js-r-sec').textContent = current?.id ?? 'inicio';
    q('.js-r-pct').textContent = String(Math.round(p * 100)).padStart(2, '0');
    q('.js-r-x').textContent = (mx / window.innerWidth).toFixed(2);
    q('.js-r-y').textContent = (my / window.innerHeight).toFixed(2);
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('pointermove', (event) => {
    mx = event.clientX;
    my = event.clientY;
    queue();
  }, { passive: true });
  update();

  // Corchetes de las tarjetas de caso y su lectura en el cuadro (sin cajas sobre la tarjeta).
  const cards = [...document.querySelectorAll('.c-case-card[data-case]')];
  cards.forEach((card, i) => {
    const brk = document.createElement('span');
    brk.className = 'c-case-card__brk';
    brk.setAttribute('aria-hidden', 'true');
    card.append(brk);
    const word = card.querySelector('.c-case-card__word')?.textContent.trim() ?? '';
    const tags = card.querySelector('.c-case-card__tags')?.textContent.trim() ?? '';
    const on = () => {
      q('.js-r-case').textContent = `${String(i + 1).padStart(2, '0')} · ${word} · ${tags}`;
      readout.classList.add('has-case');
    };
    const off = () => readout.classList.remove('has-case');
    card.addEventListener('pointerenter', on);
    card.addEventListener('focus', on);
    card.addEventListener('pointerleave', off);
    card.addEventListener('blur', off);
  });
}

// Las x de las columnas de una sección, relativas a ella: el contenedor sin su relleno y las columnas de su primer .o-grid.
function columnsOf(section) {
  const sr = section.getBoundingClientRect();
  const container = section.querySelector('.o-container') ?? section;
  const cr = container.getBoundingClientRect();
  const cs = getComputedStyle(container);
  const xs = [cr.left + parseFloat(cs.paddingLeft), cr.right - parseFloat(cs.paddingRight)];
  const grid = section.querySelector('.o-grid');
  if (grid) [...grid.children].slice(0, 12).forEach((child) => { const r = child.getBoundingClientRect(); xs.push(r.left, r.right); });
  return mergeColumns(xs.map((x) => x - sr.left));
}

function buildGuides(host) {
  const bg = host.querySelector('.c-bg');
  if (!bg) return;
  bg.querySelectorAll('.c-bg__layer--grid').forEach((node) => node.remove());
  const w = Math.round(bg.clientWidth);
  const h = Math.round(bg.clientHeight * 1.7);
  const xs = columnsOf(host);
  const make = (depth) => el('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none', class: `c-bg__layer c-bg__layer--grid c-bg__layer--${depth}`, fill: 'none', stroke: 'currentColor', 'stroke-width': 1 });
  const far = make('far');
  const near = make('near');
  xs.forEach((x) => far.append(el('line', { x1: x, y1: 0, x2: x, y2: h, 'vector-effect': 'non-scaling-stroke' })));
  for (let y = ROW / 2; y < h; y += ROW) xs.forEach((x) => near.append(el('path', { d: `M${x - 5} ${y}H${x + 5}M${x} ${y - 5}V${y + 5}`, 'vector-effect': 'non-scaling-stroke' })));
  bg.prepend(far);
  bg.append(near);
}

function setupBackgrounds(reduce) {
  const hosts = [];
  for (const [id, scene] of Object.entries(SECTION_SCENES)) {
    const host = document.getElementById(id);
    if (!host) continue;
    host.classList.add('has-bg');
    const bg = document.createElement('div');
    bg.className = 'c-bg';
    bg.setAttribute('aria-hidden', 'true');
    const layers = ['far', 'mid', 'near'].map((depth) => {
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', class: `c-bg__layer c-bg__layer--${depth}`, fill: 'none', stroke: 'currentColor', 'stroke-width': 1 });
      bg.append(svg);
      return svg;
    });
    SCENES[scene](...layers);
    layers.forEach((svg) => svg.querySelectorAll('path, line, rect, polyline').forEach((node) => node.setAttribute('vector-effect', 'non-scaling-stroke')));
    host.prepend(bg);
    hosts.push(host);
  }
  const rebuild = () => hosts.forEach(buildGuides);
  rebuild();
  window.addEventListener('load', rebuild);
  document.fonts.ready.then(rebuild);
  let timer = 0;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  }).observe(document.documentElement);

  // Parallax de mouse (se suma al de scroll: ese usa `translate`; este, `transform`). Solo con cursor fino y movimiento permitido.
  if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let raf = 0;
  const onScreen = (bg) => { const r = bg.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  const loop = () => {
    raf = 0;
    eased.x += (target.x - eased.x) * 0.08;
    eased.y += (target.y - eased.y) * 0.08;
    hosts.map((host) => host.querySelector('.c-bg')).filter((bg) => bg && onScreen(bg)).forEach((bg) => {
      bg.querySelectorAll('.c-bg__layer').forEach((layer) => {
        const depth = layer.classList.contains('c-bg__layer--near') ? 'near' : layer.classList.contains('c-bg__layer--mid') ? 'mid' : 'far';
        const o = parallaxOffset(eased, DEPTH[depth], layer.classList.contains('c-bg__layer--grid'));
        layer.style.transform = `translate(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px)`;
      });
    });
    if (Math.abs(target.x - eased.x) > 0.001 || Math.abs(target.y - eased.y) > 0.001) raf = requestAnimationFrame(loop);
  };
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    target.x = (event.clientX / window.innerWidth) * 2 - 1;
    target.y = (event.clientY / window.innerHeight) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
}

// Hero: los puntos de la cuadrícula caen sobre el borde izquierdo del contenedor (se desplaza la cuadrícula; hero-fx.js no se toca).
function alignHeroGrid() {
  const grid = document.querySelector('.c-hero__grid');
  const container = document.querySelector('.c-hero .o-container');
  if (!grid || !container) return;
  const align = () => {
    const left = container.getBoundingClientRect().left + parseFloat(getComputedStyle(container).paddingLeft);
    const offset = (((left - 17) % 34) + 34) % 34; // el punto está al centro de cada celda de 34 px
    grid.style.insetInlineStart = `${offset - 34}px`;
  };
  align();
  window.addEventListener('resize', align);
  window.addEventListener('load', align);
}

export function setupInstrumento() {
  const root = document.documentElement;
  if (root.dataset.page !== 'home' || root.hasAttribute('data-calm')) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setupBoot();
  if (window.matchMedia('(min-width: 64rem)').matches) setupReadout();
  setupBackgrounds(reduce);
  alignHeroGrid();
}
