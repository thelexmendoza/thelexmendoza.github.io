// Cielo animado del sitio de CiiSA y Adobe, reconstruido para el hero y la tarjeta del caso (el original es
// un canvas en el sitio de Adobe, que no es un video). Estrellas que derivan, lineas entre las cercanas,
// destellos de cuatro puntas en verde CiiSA y rojo Adobe, y adornos (circulo, cuadrado, cruz) que recuerdan
// el logo de CiiSA.
//
// La logica pura (sembrar y mover) se prueba con `npm test`; el dibujo vive en `createSky`.

const GREEN = '188,242,0';
const RED = '248,105,86';
const WHITE = '255,255,255';
const MIST = '165,181,212';
const TAU = 6.2832;

const range = (rnd, a, b) => a + rnd() * (b - a);

// Siembra el cielo para un fondo de w x h: cantidad segun el area y menos elementos en pantallas chicas.
export function seedSky(w, h, rnd = Math.random) {
  const small = w < 640;
  const count = Math.round(Math.min(95, Math.max(26, (w * h) / 15000)));
  const stars = [];
  const sparks = [];
  const orns = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: range(rnd, 0, w),
      y: range(rnd, 0, h),
      vx: range(rnd, -6, 6),
      vy: range(rnd, -5, 5),
      r: range(rnd, 0.9, 2.1),
      ph: range(rnd, 0, 6.28),
      sp: range(rnd, 0.6, 1.8),
      c: rnd() < 0.7 ? WHITE : rnd() < 0.5 ? MIST : rnd() < 0.5 ? GREEN : RED,
    });
  }
  for (let s = 0; s < (small ? 6 : 11); s++) {
    sparks.push({ x: range(rnd, 0.04 * w, 0.96 * w), y: range(rnd, 0.06 * h, 0.94 * h), s: range(rnd, 9, 18), ph: range(rnd, 0, 6.28), sp: range(rnd, 0.5, 1.1), c: s % 2 ? GREEN : RED });
  }
  const shapes = ['circle', 'square', 'plus', 'circle', 'square'];
  for (let o = 0; o < (small ? 4 : 8); o++) {
    orns.push({
      x: range(rnd, 0, w),
      y: range(rnd, 0, h),
      vx: range(rnd, -4, 4),
      vy: range(rnd, -4, 4),
      s: range(rnd, 9, 22),
      rot: range(rnd, 0, 6.28),
      vr: range(rnd, -0.12, 0.12),
      t: shapes[Math.floor(rnd() * shapes.length)],
      c: o % 2 ? GREEN : RED,
    });
  }
  return { stars, sparks, orns, link: small ? 84 : 112 };
}

// Mueve estrellas y adornos `dt` segundos; lo que sale por un borde reaparece por el opuesto.
export function stepSky(sky, dt, w, h) {
  for (const p of sky.stars) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -4) p.x = w + 4;
    else if (p.x > w + 4) p.x = -4;
    if (p.y < -4) p.y = h + 4;
    else if (p.y > h + 4) p.y = -4;
  }
  for (const p of sky.orns) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.x < -30) p.x = w + 30;
    else if (p.x > w + 30) p.x = -30;
    if (p.y < -30) p.y = h + 30;
    else if (p.y > h + 30) p.y = -30;
  }
}

function star4(ctx, x, y, s, a, c) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4);
  g.addColorStop(0, `rgba(${c},${0.35 * a})`);
  g.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, s * 2.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(${c},${a})`;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}

function ornament(ctx, o, a) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);
  ctx.strokeStyle = `rgba(${o.c},${a})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (o.t === 'circle') ctx.arc(0, 0, o.s / 2, 0, TAU);
  else if (o.t === 'square') ctx.rect(-o.s / 2, -o.s / 2, o.s, o.s);
  else {
    ctx.moveTo(-o.s / 2, 0);
    ctx.lineTo(o.s / 2, 0);
    ctx.moveTo(0, -o.s / 2);
    ctx.lineTo(0, o.s / 2);
  }
  ctx.stroke();
  ctx.restore();
}

function draw(ctx, sky, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  const { stars, sparks, orns, link } = sky;
  for (let i = 0; i < stars.length; i++) {
    const a = stars[i];
    for (let j = i + 1; j < stars.length; j++) {
      const b = stars[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < link) {
        ctx.strokeStyle = `rgba(${MIST},${(1 - d / link) * 0.36})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  for (const a of stars) {
    ctx.fillStyle = `rgba(${a.c},${0.55 + 0.4 * Math.sin(t * a.sp + a.ph)})`;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, TAU);
    ctx.fill();
  }
  for (const o of orns) ornament(ctx, o, 0.6);
  for (const a of sparks) {
    const al = Math.max(0, Math.sin(t * a.sp + a.ph));
    star4(ctx, a.x, a.y, a.s * (0.45 + 0.55 * al), 0.25 + 0.7 * al, a.c);
  }
}

// Crea el cielo dentro de `host` (un elemento `.c-sky` con un <canvas>). Se dibuja siempre un cuadro (asi, con menos
// movimiento o en pausa, queda un cielo bonito y quieto); `setActive(true)` lo anima y `setActive(false)` lo pausa.
export function createSky(host, { reduce = false } = {}) {
  const canvas = host.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return { setActive() {} };
  let w = 0;
  let h = 0;
  let sky = null;
  let raf = 0;
  let last = 0;
  let active = false;
  let t = 0;

  const size = () => {
    const rect = host.getBoundingClientRect();
    const nw = Math.max(1, rect.width);
    const nh = Math.max(1, rect.height);
    if (sky && Math.abs(nw - w) < 40 && Math.abs(nh - h) < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const ow = w;
    const oh = h;
    w = nw;
    h = nh;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!sky || Math.abs(nw - ow) >= 40) sky = seedSky(w, h);
    else for (const list of [sky.stars, sky.sparks, sky.orns]) for (const p of list) { p.x *= nw / ow; p.y *= nh / oh; }
    draw(ctx, sky, w, h, t);
  };

  const step = (now) => {
    raf = 0;
    if (!active || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    stepSky(sky, dt, w, h);
    t = now / 1000;
    draw(ctx, sky, w, h, t);
    raf = requestAnimationFrame(step);
  };

  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
  else window.addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => {
    if (active && !raf && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  });

  return {
    setActive(next) {
      active = Boolean(next) && !reduce;
      if (active && !raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    },
  };
}
