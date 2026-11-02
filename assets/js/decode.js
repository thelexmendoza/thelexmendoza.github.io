// Gimmicks de texto y botones del sitio. La lógica pura vive aquí para probarla con `npm test`; el DOM, en `ornaments.js`.

// Solo ASCII: la fuente monoespaciada los tiene todos, así que el ancho no se mueve mientras se decodifica.
export const GLYPHS = '#$%&*+<>/\\_-=0123456789';

// Un cuadro del decodificado: de izquierda a derecha las letras ya son las de verdad (con un poco de desorden)
// y el resto son símbolos al azar. Espacios y signos de puntuación se respetan para que la frase no cambie de forma.
export function decodeFrame(text, progress, rnd = Math.random) {
  const letters = [...text];
  const total = letters.filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
  const done = Math.floor(Math.min(1, Math.max(0, progress)) * (total + 1));
  let seen = 0;
  return letters
    .map((char) => {
      if (!/[\p{L}\p{N}]/u.test(char)) return char;
      seen += 1;
      if (progress >= 1 || seen <= done - 1) return char;
      return GLYPHS[Math.floor(rnd() * GLYPHS.length)];
    })
    .join('');
}

// Botón magnético: dentro del alcance se corre hacia el cursor, más cuanto más cerca, y nunca más de `max` px.
export function magnetOffset(dx, dy, { radius = 96, pull = 0.3, max = 9 } = {}) {
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance >= radius) return { x: 0, y: 0 };
  const strength = Math.min(max, distance * pull * (1 - distance / radius) * 2);
  return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}

// Posición del foco de luz dentro de una caja (en px desde su esquina), sin salirse de ella.
export function spotAt(clientX, clientY, rect) {
  return {
    x: Math.min(rect.width, Math.max(0, clientX - rect.left)),
    y: Math.min(rect.height, Math.max(0, clientY - rect.top)),
  };
}
