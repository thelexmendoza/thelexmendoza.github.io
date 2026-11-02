// Retículos del hero que reaccionan al mouse: entre los puntos de la retícula base aparecen puntos nuevos,
// cada vez más densos hacia el cursor, y el alcance crece en proporción a lo rápido que se mueve.
//
// La lógica pura (alcance, densidad y puntos) se prueba con `npm test`; el dibujo vive en `hero-fx.js`.

export const SPACING = 34;
const MAX_POINTS = 1400;

// Velocidad suavizada del cursor en px/ms: promedio móvil para que el alcance no parpadee con cada evento.
export function smoothSpeed(previous, distance, dt, k = 0.2) {
  if (dt <= 0) return previous;
  const instant = distance / dt;
  return previous + (instant - previous) * k;
}

// Alcance proporcional a la velocidad: en reposo el mínimo, y a 1.6 px/ms (un barrido rápido) el máximo.
export function radiusFor(speed, { min = 96, max = 280, full = 1.6 } = {}) {
  const t = Math.min(1, Math.max(0, speed) / full);
  return min + (max - min) * t;
}

// Nivel de densidad según la cercanía: 2 = cuartos de paso (centro), 1 = mitades, 0 = solo la retícula base.
export function levelFor(distance, radius) {
  if (distance >= radius) return -1;
  if (distance < radius * 0.38) return 2;
  if (distance < radius * 0.72) return 1;
  return 0;
}

// Opacidad del punto: llena en el cursor y se apaga hacia el borde del alcance.
export function alphaFor(distance, radius) {
  if (distance >= radius) return 0;
  return (1 - distance / radius) ** 1.4;
}

const near = (value, step) => Math.abs(value / step - Math.round(value / step)) < 1e-6;

// Puntos nuevos alrededor del cursor. `origin` es donde cae la retícula base (la capa de puntos se mueve con el
// parallax), para que los nuevos queden entre los de siempre y no encima. Los puntos de la base no se repiten.
export function reticlePoints(cx, cy, radius, origin = { x: 0, y: 0 }, spacing = SPACING) {
  const quarter = spacing / 4;
  const points = [];
  const startX = Math.floor((cx - radius - origin.x) / quarter) * quarter + origin.x;
  const startY = Math.floor((cy - radius - origin.y) / quarter) * quarter + origin.y;
  for (let x = startX; x <= cx + radius; x += quarter) {
    for (let y = startY; y <= cy + radius; y += quarter) {
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.hypot(dx, dy);
      const level = levelFor(distance, radius);
      if (level < 0) continue;
      const rx = x - origin.x;
      const ry = y - origin.y;
      const onBase = near(rx, spacing) && near(ry, spacing);
      if (onBase) continue;
      const onHalf = near(rx, spacing / 2) && near(ry, spacing / 2);
      if (onHalf ? level < 1 : level < 2) continue;
      points.push({ x, y, level, alpha: alphaFor(distance, radius) });
      if (points.length >= MAX_POINTS) return points;
    }
  }
  return points;
}

// Parallax del puntero: posición normalizada (-1 a 1) respecto al centro de la caja.
export function pointerOffset(x, y, rect) {
  const nx = ((x - rect.left) / rect.width) * 2 - 1;
  const ny = ((y - rect.top) / rect.height) * 2 - 1;
  return { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) };
}

// Mezcla (Fisher-Yates) con un azar inyectable, para que el collage sea aleatorio y se pueda probar.
export function shuffle(list, rnd = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Reparte las piezas del collage por una rejilla de casillas con desorden: cada pieza cae en una casilla distinta.
export function collageSlots(count, cols, rows, rnd = Math.random) {
  const cells = shuffle(
    Array.from({ length: cols * rows }, (_, i) => ({ col: i % cols, row: Math.floor(i / cols) })),
    rnd,
  ).slice(0, count);
  return cells.map(({ col, row }) => ({
    x: ((col + 0.5 + (rnd() - 0.5) * 0.5) / cols) * 100,
    y: ((row + 0.5 + (rnd() - 0.5) * 0.5) / rows) * 100,
    rotate: (rnd() - 0.5) * 8,
  }));
}

// Elige hasta `perCase` imágenes de cada caso, mezcladas, de modo que todos los casos aparezcan.
export function pickTiles(byCase, perCase, rnd = Math.random) {
  return shuffle(
    Object.entries(byCase).flatMap(([key, images]) => shuffle(images, rnd).slice(0, perCase).map((image) => ({ ...image, key }))),
    rnd,
  );
}
