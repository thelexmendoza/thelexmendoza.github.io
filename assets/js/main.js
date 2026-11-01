import { nextTheme, readStoredTheme, resolveTheme, saveTheme } from './theme.js';

const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const toggles = document.querySelectorAll('.js-theme-toggle');

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = undefined;
}

function apply(theme) {
  root.dataset.theme = theme;
  toggles.forEach((button) => button.setAttribute('aria-pressed', String(theme === 'dark')));
}

apply(resolveTheme(readStoredTheme(storage), media.matches));

toggles.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = nextTheme(root.dataset.theme);
    apply(theme);
    saveTheme(storage, theme);
  });
});

// Si la persona no eligio un tema, acompana los cambios del sistema.
media.addEventListener('change', (event) => {
  if (!readStoredTheme(storage)) apply(resolveTheme(null, event.matches));
});
