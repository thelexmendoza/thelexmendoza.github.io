// Salir de una página: aviso inmediato al hacer clic en un enlace interno y precarga al pasar el cursor.
//
// Sin aviso, una navegación en frío (0.3 a 1.6 s) parece que no pasó nada, y un segundo clic la cancela y la reinicia.
// La lógica pura (¿este clic es una navegación a otra página del sitio?) se prueba con `npm test`.

// `link` es un <a>, `event` trae los modificadores del clic y `current` es la URL de la página actual.
export function isPageLink(link, event, current) {
  if (!link || !link.href) return false;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download') || link.getAttribute('aria-disabled') === 'true' || link.hasAttribute('data-soon')) return false;
  let target;
  let here;
  try {
    target = new URL(link.href);
    here = new URL(current);
  } catch {
    return false;
  }
  if (target.origin !== here.origin) return false;
  if (!/^https?:$/.test(target.protocol)) return false;
  // Un ancla de esta misma página (#casos) solo desplaza: no es salir.
  if (target.pathname === here.pathname && target.search === here.search) return false;
  return true;
}

// Cuánto esperar antes de soltar el aviso por si la navegación no llegó a ocurrir (red caída, cancelada).
export const LEAVE_TIMEOUT_MS = 8000;

export function setupLeave() {
  const root = document.documentElement;
  let leaving = null;
  let timer = 0;

  const clear = () => {
    clearTimeout(timer);
    root.classList.remove('is-leaving');
    leaving?.classList.remove('is-leaving');
    leaving = null;
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (!isPageLink(link, event, location.href)) return;
    // Ya se está yendo a esa página: otro clic la cancelaría y la reiniciaría, así que se ignora.
    if (leaving && leaving.href === link.href) {
      event.preventDefault();
      return;
    }
    clear();
    leaving = link;
    link.classList.add('is-leaving');
    root.classList.add('is-leaving');
    timer = setTimeout(clear, LEAVE_TIMEOUT_MS);
  });

  // Al volver con el botón de atrás la página puede venir del caché: no debe quedar el aviso puesto.
  addEventListener('pageshow', clear);
  addEventListener('pagehide', () => clearTimeout(timer));
}
