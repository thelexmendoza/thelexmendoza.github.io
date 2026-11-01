// Espera escalonada para los elementos que se revelan en la misma tanda.
export function staggerDelay(index, step = 80, max = 480) {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(index * step, max);
}
