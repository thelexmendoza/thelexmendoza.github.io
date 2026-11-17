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

// Conteo breve de los precios al entrar en pantalla (0.7 s). Solo con movimiento; el texto final siempre es el del HTML.
function contarPrecio(elemento) {
  const final = elemento.textContent;
  const valor = Number(final.replace(/[^0-9]/g, ''));
  const inicio = performance.now();
  const paso = (ahora) => {
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

export async function setupPromo() {
  const raiz = document.querySelector('[data-promo]');
  if (!raiz) return;
  animarPrecios(raiz);
  if (!promoVigente(new Date())) {
    marcarTerminada(raiz);
    return;
  }
  const cupos = await pedirCupos();
  if (cupos) pintarLugares(raiz, cupos);
}
