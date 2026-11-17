// Lugares de la promo de fin de año: lógica pura (sin DOM ni red), para probarla con `npm test`. La usa promo.js.
// Los lugares libres vienen de la función «pedido» del brief (GET ?cupos=1). Un valor que no sea un entero >= 0 se trata como
// desconocido: la página nunca muestra un error ni un número inventado, solo el texto fijo «Lugares limitados cada semana».

// Cierre de la promo: 31 de diciembre de 2026, 23:59:59 hora de Monterrey (UTC-6, sin horario de verano).
export const FIN_PROMO = '2026-12-31T23:59:59-06:00';

// Lugares por semana y plataforma (los mismos que la tabla limites_semana del brief).
export const LIMITES = { medida: 10, wix: 5, squarespace: 3, wordpress: 3 };

const TOTAL = Object.values(LIMITES).reduce((suma, n) => suma + n, 0);
const FIJO = 'Lugares limitados cada semana';
const esLugar = (valor) => Number.isInteger(valor) && valor >= 0;

// Estado de una plataforma según sus lugares libres.
export function estadoCupo(libres) {
  if (!esLugar(libres)) return { estado: 'desconocido', texto: FIJO, libres: null };
  if (libres === 0) return { estado: 'agotado', texto: 'Agotado esta semana', libres };
  if (libres === 1) return { estado: 'ultimo', texto: 'Último lugar', libres };
  return { estado: 'disponible', texto: `Quedan ${libres} lugares`, libres };
}

// Letrero de arriba: la suma de las cuatro plataformas sobre el total. Si falta alguna o no es válida, texto fijo.
export function resumenLugares(cupos) {
  const valores = cupos && typeof cupos === 'object' ? Object.keys(LIMITES).map((clave) => cupos[clave]) : [];
  if (valores.length !== Object.keys(LIMITES).length || !valores.every(esLugar)) return { texto: FIJO, total: null };
  const total = valores.reduce((suma, n) => suma + n, 0);
  if (total === 0) return { texto: 'Esta semana se agotaron los lugares. Se reinician el lunes', total };
  return { texto: `Esta semana ${total === 1 ? 'queda 1' : `quedan ${total}`} de ${TOTAL} lugares. Se reinician el lunes`, total };
}

// La promo sigue vigente hasta el cierre. Una fecha inválida no cierra la promo (mejor mostrarla que esconderla por un error).
export function promoVigente(ahora) {
  const t = ahora instanceof Date ? ahora.getTime() : NaN;
  return Number.isNaN(t) || t <= new Date(FIN_PROMO).getTime();
}

// Precio con signo de pesos y comas de miles, como se ve en la página ($1,290).
export const formatoPesos = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

// Conteo breve de un precio al entrar en pantalla: de 0 al precio final en t de 0 a 1, con frenado suave. Siempre entero, sin bajar
// ni pasarse; con un t raro muestra el precio final (nunca uno inventado).
export function contarHacia(final, t) {
  if (!Number.isFinite(t)) return final;
  const k = Math.min(1, Math.max(0, t));
  return Math.round(final * (1 - (1 - k) ** 3));
}
