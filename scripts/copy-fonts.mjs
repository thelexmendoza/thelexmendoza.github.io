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

scss += [
  '$font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;',
  '$font-condensed: "IBM Plex Sans Condensed", "Arial Narrow", "IBM Plex Sans", sans-serif;',
  '$font-serif: "IBM Plex Serif", Georgia, "Times New Roman", serif;',
  '$font-mono: "IBM Plex Mono", ui-monospace, "Cascadia Code", Consolas, monospace;',
  '',
].join('\n');

fs.writeFileSync(scssOut, scss);
console.log(`Copiadas ${copied} caras de IBM Plex a ${outDir}`);
