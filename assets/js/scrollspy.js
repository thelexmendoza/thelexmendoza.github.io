// Devuelve el id de la seccion activa: la ultima que ya empezo en la linea de lectura.
// `sections` trae las posiciones en coordenadas de la ventana: { id, top, bottom }.
export function pickActive(sections, line) {
  const ordered = [...sections].sort((a, b) => a.top - b.top);
  let active = null;
  for (const section of ordered) {
    if (section.top <= line) active = section.id;
  }
  return active;
}
