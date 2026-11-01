import path from 'node:path';

// Convierte el nombre de un archivo en algo que se pueda leer como descripcion de la imagen.
// Quita lo que solo importa en produccion (copias, versiones, fechas, sesiones) y descarta los nombres
// genericos ("Mesa de trabajo 1", "IMG_4821", un hash), que no dicen nada de lo que se ve: en ese caso
// devuelve '' y la pieza se describe con el nombre de su grupo, o con un pie escrito a mano.

const GENERIC = /^(mesa de trabajo|artboard|untitled|sin titulo|img|dsc|dscn|captura( de pantalla)?|screenshot|imagen|image|frame|group|layer|capa|copia|copy|final|export)( ?\d+)?$/i;
const FIXES = [
  [/^Album FB\b/i, 'Álbum de Facebook'],
  [/^Linked ?In\b/i, 'LinkedIn'],
];

const strip = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function describeName(file) {
  const raw = path.basename(file, path.extname(file));
  if (/^[a-f0-9]{8,}(-\d+)?$/i.test(raw)) return '';
  let name = raw
    .replace(/@\dx/gi, '')
    .replace(/([a-záéíóúñ])([A-Z])/g, '$1 $2') // CloudIntegration -> Cloud Integration
    .replace(/([A-Z])([A-Z][a-záéíóúñ])/g, '$1 $2') // ERPImplementación -> ERP Implementación
    .replace(/([a-záéíóúñ])(\d{2,})/g, '$1 $2') // Integration2025 -> Integration 2025
    .replace(/([a-záéíóúñ])(\d)$/, '$1 $2') // Webinar2 -> Webinar 2
    .replace(/[\s_-]+/g, ' ')
    .trim();

  name = name
    .replace(/\b(copia|copy)( \d+)?\b/gi, ' ')
    .replace(/^\d{1,2} \d{1,2}( \d{2,4})?\b/, ' ') // fecha al inicio: "10 02 25"
    .replace(/\b\d{1,2} \d{1,2} \d{2,4}\b/g, ' ') // fecha en medio: "11 7 25"
    .replace(/\bS\d+\b/g, ' ') // sesion de produccion
    .replace(/\bV\d+\b/gi, ' ') // version
    .replace(/(?:\s\d+)+$/g, ' ') // numeros sueltos al final
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, text] of FIXES) {
    if (pattern.test(name)) name = name.replace(pattern, text);
  }

  const bare = strip(name);
  if (!bare || /^\d+$/.test(bare) || /^[a-f0-9]{8,}$/.test(bare) || /^[a-z]{1,4}\d{3,}$/.test(bare.replace(/\s/g, '')) || GENERIC.test(bare)) return '';
  // El "Webinar 2025" de una fecha suelta ya no aporta: se quita un ano al final.
  return name.replace(/\s(19|20)\d{2}$/, '').trim();
}

export function altFor(topic, file) {
  const name = describeName(file);
  return name ? `${topic}: ${name}` : topic;
}
