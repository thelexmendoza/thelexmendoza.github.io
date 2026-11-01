const STORAGE_KEY = 'theme';
const THEMES = ['light', 'dark'];

// El valor guardado manda; si no hay uno valido, sigue la preferencia del sistema.
export function resolveTheme(stored, prefersDark) {
  if (THEMES.includes(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

// El almacenamiento puede no existir o lanzar (modo privado, datos bloqueados).
export function readStoredTheme(storage) {
  try {
    return storage ? storage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function saveTheme(storage, theme) {
  try {
    if (storage) storage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento el tema funciona igual, solo no se recuerda.
  }
}

export function nextTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}
