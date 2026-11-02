import { SPACING, smoothSpeed, radiusFor, reticlePoints, pointerOffset, collageSlots, pickTiles } from './reticle.js';

// Hero de la home: collage aleatorio con los fondos de cada caso, retículos que se multiplican hacia el cursor,
// parallax con el mouse y la palabra camaleónica pintada con la identidad del caso que se toca o se destaca.
// Todo es decorativo (aria-hidden) y vive solo en JavaScript: sin él, el hero queda como siempre.

const motionOk = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Imágenes de cada caso: las de su tarjeta del home (y los pósters de los videos).
function collect() {
  const byCase = {};
  const labels = {};
  document.querySelectorAll('.c-case-card[data-media][data-case]').forEach((card) => {
    const key = card.dataset.case;
    const images = [...card.querySelectorAll('.c-case-card__media img')].map((img) => ({
      src: img.getAttribute('src'),
      width: Number(img.getAttribute('width')) || 640,
      height: Number(img.getAttribute('height')) || 400,
    }));
    card.querySelectorAll('.c-case-card__media video[poster]').forEach((video) => {
      images.push({ src: video.getAttribute('poster'), width: Number(video.getAttribute('width')) || 1280, height: Number(video.getAttribute('height')) || 720 });
    });
    if (images.length) byCase[key] = images;
    labels[key] = card.querySelector('.c-case-card__file')?.textContent.trim() ?? key;
  });
  return { byCase, labels };
}

function buildCollage(backdrop, small) {
  const { byCase, labels } = collect();
  if (!Object.keys(byCase).length) return [];
  const layer = document.createElement('span');
  layer.className = 'c-hero__collage';
  const tiles = pickTiles(byCase, small ? 2 : 3);
  const cols = small ? 3 : 6;
  const rows = small ? 4 : 3;
  const slots = collageSlots(tiles.length, cols, rows);
  const nodes = tiles.map((tile, i) => {
    const slot = slots[i];
    const node = document.createElement('span');
    node.className = 'c-hero__tile';
    node.dataset.case = tile.key;
    node.dataset.label = labels[tile.key];
    const portrait = tile.height > tile.width * 1.1;
    node.style.cssText = `left:${slot.x.toFixed(1)}%;top:${slot.y.toFixed(1)}%;--w:${portrait ? (small ? 24 : 11) : small ? 34 : 17}vw;--tilt:${slot.rotate.toFixed(1)}deg;aspect-ratio:${tile.width}/${tile.height}`;
    const img = document.createElement('img');
    img.src = tile.src;
    img.alt = '';
    img.decoding = 'async';
    node.append(img);
    layer.append(node);
    return node;
  });
  backdrop.prepend(layer);
  return nodes;
}

function buildReticles(hero, grid) {
  const canvas = document.createElement('canvas');
  canvas.className = 'c-hero__reticles';
  grid.after(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const state = { w: 0, h: 0, dpr: 1, ink: '0,0,0', accent: '225,29,46' };

  const size = () => {
    const rect = hero.getBoundingClientRect();
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.w = rect.width;
    state.h = rect.height;
    canvas.width = Math.round(rect.width * state.dpr);
    canvas.height = Math.round(rect.height * state.dpr);
  };

  // Colores del tema (texto y acento) como "r,g,b" para dibujar con alfa.
  const readInk = () => {
    const probe = (value) => {
      const el = document.createElement('i');
      el.style.color = value;
      document.body.append(el);
      const rgb = getComputedStyle(el).color.match(/\d+(\.\d+)?/g)?.slice(0, 3).join(',');
      el.remove();
      return rgb;
    };
    state.ink = probe('var(--color-text)') ?? state.ink;
    state.accent = probe('var(--color-accent)') ?? state.accent;
  };

  const draw = (cx, cy, radius, origin) => {
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.w, state.h);
    if (radius <= 0) return;
    for (const p of reticlePoints(cx, cy, radius, origin, SPACING)) {
      const size = p.level >= 2 ? 3.4 : 2.6;
      ctx.strokeStyle = `rgba(${p.level >= 2 ? state.accent : state.ink},${(p.alpha * (p.level >= 2 ? 0.95 : 0.6)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - size, p.y);
      ctx.lineTo(p.x + size, p.y);
      ctx.moveTo(p.x, p.y - size);
      ctx.lineTo(p.x, p.y + size);
      ctx.stroke();
    }
  };

  size();
  readInk();
  return { canvas, size, readInk, draw, state };
}

export function setupHeroFx() {
  const hero = document.querySelector('.c-hero');
  const backdrop = hero?.querySelector('.c-hero__backdrop');
  const grid = hero?.querySelector('.c-hero__grid');
  const word = hero?.querySelector('.c-chameleon-title--spectrum');
  const eyebrow = hero?.querySelector('.c-hero__eyebrow');
  if (!hero || !backdrop || !grid) return;

  const small = window.innerWidth < 640;
  let tiles = [];
  const mount = () => {
    if (tiles.length) return;
    tiles = buildCollage(backdrop, small);
    tiles.forEach((tile) => tile.classList.add('is-in'));
  };
  if (document.readyState === 'complete') requestAnimationFrame(mount);
  else window.addEventListener('load', () => requestAnimationFrame(mount), { once: true });

  // Qué caso está destacado: la pieza bajo el cursor (o la que toca por turno en pantallas táctiles).
  let hot = null;
  const light = (tile) => {
    if (hot === tile) return;
    hot?.classList.remove('is-hot');
    hot = tile;
    hot?.classList.add('is-hot');
    // La palabra y la etiqueta «Diseño + web» toman la identidad del caso; sin destacado vuelven al espectro.
    [word, eyebrow].forEach((el) => {
      if (!el) return;
      if (hot) el.dataset.case = hot.dataset.case;
      else delete el.dataset.case;
    });
  };

  const reduce = !motionOk();
  const hover = canHover();

  // Pantallas táctiles: el destacado pasa solo de un caso a otro, sin movimiento extra.
  if (!hover && !reduce) {
    let timer = 0;
    const tick = () => {
      if (tiles.length) light(tiles[Math.floor(Math.random() * tiles.length)]);
    };
    const onVisible = new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (entry.isIntersecting) timer = setInterval(tick, 3200);
      else light(null);
    });
    onVisible.observe(hero);
    return;
  }
  if (!hover || reduce) return;

  const reticles = buildReticles(hero, grid);
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, active: false, last: 0, speed: 0, radius: 0 };
  let frame = 0;
  let visible = true;

  const loop = (now) => {
    frame = 0;
    // Parallax: cada capa se desplaza a su profundidad (el collage, la más lejana, es la que más se nota).
    eased.x += (target.x - eased.x) * 0.08;
    eased.y += (target.y - eased.y) * 0.08;
    hero.style.setProperty('--px', eased.x.toFixed(4));
    hero.style.setProperty('--py', eased.y.toFixed(4));

    // Retículos: el alcance sube con la velocidad y baja solo cuando el cursor se queda quieto o se va.
    pointer.speed *= pointer.active ? 0.94 : 0.85;
    const goal = pointer.active ? radiusFor(pointer.speed) : 0;
    pointer.radius += (goal - pointer.radius) * 0.14;
    if (reticles) {
      const heroRect = hero.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const origin = { x: gridRect.left - heroRect.left, y: gridRect.top - heroRect.top };
      reticles.draw(pointer.x - heroRect.left, pointer.y - heroRect.top, pointer.radius < 4 ? 0 : pointer.radius, origin);
    }
    const settled = Math.abs(target.x - eased.x) < 0.001 && Math.abs(target.y - eased.y) < 0.001 && pointer.radius < 4 && !pointer.active;
    if (visible && !settled) frame = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!frame && visible) frame = requestAnimationFrame(loop);
  };

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const offset = pointerOffset(event.clientX, event.clientY, rect);
    target.x = offset.x;
    target.y = offset.y;
    const now = event.timeStamp;
    if (pointer.active) pointer.speed = smoothSpeed(pointer.speed, Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y), now - pointer.last);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.last = now;
    pointer.active = true;
    // Caso destacado: la pieza del collage que está bajo el cursor.
    const under = tiles.find((tile) => {
      const r = tile.getBoundingClientRect();
      return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    });
    light(under ?? null);
    wake();
  });
  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
    target.x = 0;
    target.y = 0;
    light(null);
    wake();
  });
  new ResizeObserver(() => reticles?.size()).observe(hero);
  new MutationObserver(() => reticles?.readInk()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(hero);
}
