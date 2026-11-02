// Siguiente o anterior imagen del lightbox, dando la vuelta en los extremos.
export function stepIndex(index, delta, length) {
  if (length <= 1) return 0;
  return (((index + delta) % length) + length) % length;
}

// Formato elegido para todas las galerias: pulsar el mismo otra vez regresa al de cada galeria.
export function nextFormat(current, clicked) {
  if (clicked !== 'grid' && clicked !== 'carousel') return current;
  return clicked === current ? null : clicked;
}

// "Mostrar mas" revela otra pagina de piezas en la cuadricula; "mostrar menos" vuelve a la primera.
export const PAGE = 6;
export const showMore = (visible, total, step = PAGE) => Math.min(visible + step, total);
export const showLess = (step = PAGE) => step;
