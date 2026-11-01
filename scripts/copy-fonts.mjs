import fs from 'node:fs';
import path from 'node:path';

const families = [
  { pkg: 'ibm-plex-sans', name: 'IBM Plex Sans' },
  { pkg: 'ibm-plex-sans-condensed', name: 'IBM Plex Sans Condensed' },
  { pkg: 'ibm-plex-serif', name: 'IBM Plex Serif' },
  { pkg: 'ibm-plex-mono', name: 'IBM Plex Mono' },
];

const outDir = 'assets/fonts/plex';
const scssOut = 'src/scss/0-settings/_fonts.scss';
const urlBase = '../fonts/plex';

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(scssOut), { recursive: true });

let scss = '// Archivo generado por scripts/copy-fonts.mjs. No se edita a mano.\n\n';
let copied = 0;

for (const { pkg, name } of families) {
  const srcDir = path.join('node_modules', '@fontsource', pkg, 'files');
  const files = fs
    .readdirSync(srcDir)
    .map((file) => ({ file, match: file.match(/-latin-(\d+)-(normal|italic)\.woff2$/) }))
    .filter((entry) => entry.match)
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]) || a.match[2].localeCompare(b.match[2]));

  for (const { file, match } of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
    copied += 1;
    scss += [
      '@font-face {',
      `  font-family: "${name}";`,
      `  font-style: ${match[2]};`,
      `  font-weight: ${match[1]};`,
      '  font-display: swap;',
      `  src: url("${urlBase}/${file}") format("woff2");`,
      '}',
      '',
      '',
    ].join('\n');
  }
}

// Respaldos con las medidas de Plex. Mientras llega la fuente, el texto se dibuja con Arial o Courier New
// ajustados para ocupar casi lo mismo, asi que al hacer el cambio el texto no se reacomoda.
// size-adjust parte del ancho medio de Plex / ancho medio del respaldo (metricas de @capsizecss/metrics) y se
// afino midiendo texto real en los pesos que usa el sitio (Sans 300, Condensed 700, Mono 300);
// ascent y descent = metrica de Plex / size-adjust; line-gap = 0.
const fallbacks = [
  { name: 'IBM Plex Sans Fallback', local: 'Arial', size: 98.9, ascent: 103.6, descent: 27.8 },
  { name: 'IBM Plex Sans Condensed Fallback', local: 'Arial', size: 95, ascent: 107.9, descent: 28.9 },
  { name: 'IBM Plex Mono Fallback', local: 'Courier New', size: 100, ascent: 102.5, descent: 27.5 },
];
for (const { name, local, size, ascent, descent } of fallbacks) {
  scss += [
    '@font-face {',
    `  font-family: "${name}";`,
    `  src: local("${local}");`,
    `  size-adjust: ${size}%;`,
    `  ascent-override: ${ascent}%;`,
    `  descent-override: ${descent}%;`,
    '  line-gap-override: 0%;',
    '}',
    '',
    '',
  ].join('\n');
}

scss += [
  '$font-sans: "IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;',
  '$font-condensed: "IBM Plex Sans Condensed", "IBM Plex Sans Condensed Fallback", "Arial Narrow", "IBM Plex Sans", sans-serif;',
  '$font-serif: "IBM Plex Serif", Georgia, "Times New Roman", serif;',
  '$font-mono: "IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "Cascadia Code", Consolas, monospace;',
  '',
].join('\n');

fs.writeFileSync(scssOut, scss);
console.log(`Copiadas ${copied} caras de IBM Plex a ${outDir}`);
