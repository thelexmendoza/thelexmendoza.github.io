// Landing de la promo de fin de año (lexmendoza.com/promo/): pinta los lugares de la semana en vivo y cierra la promo el 31 de diciembre.
// Todo es opcional: sin JavaScript, o si la consulta falla, la página queda con el texto fijo «Lugares limitados cada semana» y todos
// sus botones (al brief y a WhatsApp) funcionando. La lógica pura vive en cupos.js (con pruebas).

import { contarHacia, estadoCupo, formatoPesos, promoVigente, resumenLugares } from './cupos.js';

export const URL_CUPOS = 'https://jmnnodzdopnbvbkcxpvy.supabase.co/functions/v1/pedido?cupos=1';
export const TIEMPO_MS = 4000;

// Los lugares libres por plataforma que da la función «pedido» del brief, o null si algo sale mal (red, estado, JSON, forma).
// Nunca lanza: una consulta que falla o se cuelga no debe romper ni retrasar la página.
export async function pedirCupos(consultar = fetch, tiempoMs = TIEMPO_MS) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), tiempoMs);
  try {
    const respuesta = await consultar(URL_CUPOS, { signal: control.signal, headers: { accept: 'application/json' } });
    if (!respuesta.ok) return null;
    const cuerpo = await respuesta.json();
    if (!cuerpo || typeof cuerpo !== 'object' || cuerpo.ok === false) return null;
    return cuerpo.cupos && typeof cuerpo.cupos === 'object' ? cuerpo.cupos : null;
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

// Cambia el texto del botón sin tocar su icono (el último nodo de texto).
function ponerTexto(boton, texto) {
  const nodo = [...boton.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE);
  if (nodo) nodo.textContent = texto;
  else boton.append(texto);
}

// Un botón de tarjeta que pasa a WhatsApp (agotado o promo terminada): guarda cómo era para poder volver.
function haciaWhatsApp(boton, href, texto) {
  boton.dataset.hrefBrief ??= boton.getAttribute('href');
  boton.dataset.textoBrief ??= boton.textContent;
  boton.setAttribute('href', href);
  boton.setAttribute('target', '_blank');
  boton.setAttribute('rel', 'noopener noreferrer');
  ponerTexto(boton, texto);
}

export function pintarLugares(raiz, cupos) {
  const resumen = resumenLugares(cupos);
  const letrero = raiz.querySelector('[data-promo-resumen-texto]');
  if (letrero) letrero.textContent = resumen.texto;
  raiz.querySelector('[data-promo-resumen]')?.classList.toggle('is-agotado', resumen.total === 0);
  // El punto de «en vivo» solo late cuando los datos llegaron del servidor.
  raiz.querySelector('[data-promo-resumen]')?.classList.add('is-vivo');
  raiz.querySelectorAll('.c-promo__plan').forEach((plan) => {
    const { estado, texto } = estadoCupo(cupos?.[plan.dataset.plataforma]);
    plan.dataset.estado = estado;
    plan.classList.toggle('is-ultimo', estado === 'ultimo');
    plan.classList.toggle('is-agotado', estado === 'agotado');
    const lugares = plan.querySelector('[data-lugares]');
    if (lugares) lugares.textContent = texto;
    // Medidor: un segmento lleno por cada lugar libre (de izquierda a derecha); sin dato, ninguno.
    plan.querySelectorAll('.c-promo__medidor i').forEach((segmento, i) => segmento.classList.toggle('is-libre', estado !== 'desconocido' && i < (cupos[plan.dataset.plataforma] ?? 0)));
    const boton = plan.querySelector('[data-promo-cta]');
    if (boton && estado === 'agotado') haciaWhatsApp(boton, plan.dataset.avisame, raiz.dataset.avisameTexto);
  });
}

// Pasado el cierre, la página se queda con el mensaje de «terminó» y los botones llevan a WhatsApp.
export function marcarTerminada(raiz) {
  raiz.classList.add('is-terminada');
  raiz.querySelectorAll('.c-promo__plan').forEach((plan) => {
    plan.classList.add('is-terminada');
    const boton = plan.querySelector('[data-promo-cta]');
    if (boton) haciaWhatsApp(boton, raiz.dataset.terminadaWa, raiz.dataset.terminadaBoton);
  });
}

// Conteo breve de los precios (0.7 s): al entrar en pantalla y cada vez que la tarjeta se activa. Solo con movimiento; el texto final
// siempre es el del HTML (se guarda la primera vez) y un conteo nuevo cancela el anterior, así que repetirlo nunca deja un número a medias.
function contarPrecio(elemento) {
  elemento.dataset.final ??= elemento.textContent;
  const final = elemento.dataset.final;
  const valor = Number(final.replace(/[^0-9]/g, ''));
  const turno = (Number(elemento.dataset.turno) || 0) + 1;
  elemento.dataset.turno = String(turno);
  const inicio = performance.now();
  const paso = (ahora) => {
    if (Number(elemento.dataset.turno) !== turno) return;
    const t = (ahora - inicio) / 700;
    if (t >= 1) {
      elemento.textContent = final;
      return;
    }
    elemento.textContent = formatoPesos(contarHacia(valor, t));
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

export function animarPrecios(raiz) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        observador.unobserve(entrada.target);
        contarPrecio(entrada.target);
      });
    },
    { threshold: 0.6 },
  );
  raiz.querySelectorAll('.c-promo__monto').forEach((monto) => observador.observe(monto));
}

// Tarjeta activa (is-activo): el precio se vuelve a contar y se pone rojo, el borde toma el acento y las palabras clave se subrayan.
// Con cursor: al pasar el cursor o enfocar con teclado. En táctil (tableta y móvil): la tarjeta que ocupa el centro de la pantalla,
// con un respiro de 350 ms para no parpadear al hacer scroll. Entrar y salir son la misma animación, en un sentido y en otro.
export function activarPlanes(raiz) {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cursorFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const planes = [...raiz.querySelectorAll('.c-promo__plan')];
  const poner = (plan, activo) => {
    if (plan.classList.contains('is-activo') === activo) return;
    plan.classList.toggle('is-activo', activo);
    const monto = plan.querySelector('.c-promo__monto');
    if (activo && monto && !reducido) contarPrecio(monto);
  };
  planes.forEach((plan) => {
    plan.addEventListener('focusin', () => poner(plan, true));
    plan.addEventListener('focusout', (e) => {
      if (!plan.contains(e.relatedTarget)) poner(plan, false);
    });
    if (cursorFino) {
      plan.addEventListener('pointerenter', () => poner(plan, true));
      plan.addEventListener('pointerleave', () => poner(plan, false));
    }
  });
  if (cursorFino || !('IntersectionObserver' in window)) return;
  const esperas = new Map();
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach(({ target, isIntersecting }) => {
        clearTimeout(esperas.get(target));
        esperas.set(target, setTimeout(() => poner(target, isIntersecting), isIntersecting ? 350 : 0));
      });
    },
    { rootMargin: '-38% 0px -38% 0px', threshold: 0 },
  );
  planes.forEach((plan) => observador.observe(plan));
}

export async function setupPromo() {
  const raiz = document.querySelector('[data-promo]');
  if (!raiz) return;
  animarPrecios(raiz);
  activarPlanes(raiz);
  if (!promoVigente(new Date())) {
    marcarTerminada(raiz);
    return;
  }
  const cupos = await pedirCupos();
  if (cupos) pintarLugares(raiz, cupos);
}
