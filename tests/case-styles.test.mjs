import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sass from 'sass';

const css = sass.compile('src/scss/main.scss', { style: 'expanded' }).css;

test('el carrusel pasa de 3 a 2 y a 1 columna segun el espacio del propio carrusel', () => {
  assert.match(css, /\.c-gallery\s*\{[^}]*container-type:\s*inline-size/);
  assert.match(css, /\.c-gallery__slide\s*\{[^}]*flex:\s*0 0 calc\(\(100% - 2 \* var\(--space-2\)\) \/ 3\)/);
  assert.match(css, /@container \(max-width: 52rem\)[\s\S]*?\.c-gallery__slide\s*\{[^}]*calc\(\(100% - var\(--space-2\)\) \/ 2\)/);
  assert.match(css, /@container \(max-width: 30rem\)[\s\S]*?\.c-gallery__slide\s*\{[^}]*flex-basis:\s*100%/);
});

test('el carrusel se desliza con el dedo sin JavaScript', () => {
  assert.match(css, /\.c-gallery__track\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.c-gallery__track\s*\{[^}]*scroll-snap-type:\s*x mandatory/);
  assert.match(css, /\.c-gallery__slide\s*\{[^}]*scroll-snap-align:\s*start/);
});

test('la barra de vistas solo existe con JavaScript y es pegajosa', () => {
  assert.match(css, /\.c-bar\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.has-js \.c-bar\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.has-js \.c-bar\s*\{[^}]*position:\s*sticky/);
});

test('los botones de vista solo filtran imagenes, nunca el texto', () => {
  assert.match(css, /main\[data-lens=iconos\] \[data-kind\]:not\(\[data-kind=iconos\]\)/);
  assert.match(css, /main\[data-lens=disenos\] \[data-kind\]:not\(\[data-kind=disenos\]\)/);
  assert.match(css, /main\[data-lens=fotos\] \[data-kind\]:not\(\[data-kind=fotos\]\)/);
  assert.doesNotMatch(css, /\[data-lens=[a-z]+\][^{]*\.c-chapter__text/, 'el filtro no toca el texto');
});

test('la hoja de iconos es una cuadricula de casillas cuadradas', () => {
  assert.match(css, /\.c-icons__grid\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.c-icons__item\s*\{[^}]*aspect-ratio:\s*1/);
});

test('el formato cuadricula pone la galeria en tres columnas de casillas cuadradas, por galeria o por eleccion', () => {
  assert.match(css, /\.c-gallery\[data-format=grid\] \.c-gallery__track,\s*main\[data-format=grid\] \.c-gallery \.c-gallery__track\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.c-gallery\[data-format=grid\] \.c-gallery__track[^{]*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/);
  assert.match(css, /\.c-gallery\[data-format=grid\] \.c-gallery__open img[^{]*\{[^}]*aspect-ratio:\s*1/);
  assert.match(css, /\.c-gallery\[data-format=grid\] \.c-gallery__open img[^{]*\{[^}]*object-fit:\s*cover/);
});

test('elegir carrusel anula la cuadricula por defecto de las publicaciones', () => {
  assert.match(css, /main\[data-format=carousel\] \.c-gallery \.c-gallery__track\s*\{[^}]*display:\s*flex/);
  assert.match(css, /main\[data-format=carousel\] \.c-gallery \.c-gallery__open img[^{]*\{[^}]*object-fit:\s*contain/);
});

test('en cuadricula no se muestran las flechas del carrusel', () => {
  assert.match(css, /\.c-gallery\[data-format=grid\] \.c-gallery__controls,\s*main\[data-format=grid\] \.c-gallery \.c-gallery__controls\s*\{[^}]*display:\s*none/);
  assert.match(css, /main\[data-format=carousel\] \.c-gallery \.c-gallery__controls\s*\{[^}]*display:\s*flex/);
});

test('los logotipos van en casillas con margen interno y fondo segun su tono', () => {
  assert.match(css, /\.c-gallery--logos \.c-gallery__open\s*\{[^}]*padding:\s*var\(--space-4\)/);
  assert.match(css, /\.c-gallery--logos \.c-gallery__open img\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/);
  assert.match(css, /\.c-gallery__slide--logo\[data-tone=light\] \.c-gallery__open\s*\{[^}]*background:\s*#14202b/);
  assert.match(css, /\.c-gallery__slide--logo\[data-tone=dark\] \.c-gallery__open\s*\{[^}]*background:\s*#f4f6f8/);
});

test('el lightbox usa dialog a pantalla completa con fondo oscuro', () => {
  assert.match(css, /\.c-lightbox\s*\{[^}]*inline-size:\s*100vw/);
  assert.match(css, /\.c-lightbox::backdrop/);
  assert.match(css, /\.c-lightbox\[open\]\s*\{[^}]*display:\s*grid/);
});

test('las imagenes abiertas con teclado tienen foco visible', () => {
  assert.match(css, /\.c-gallery__open:focus-visible/);
});

test('en cuadricula se pliegan las piezas de mas y los botones de mostrar mas o menos solo existen con JavaScript', () => {
  assert.match(css, /\.has-js main:not\(\[data-format=carousel\]\) \.c-gallery\[data-format=grid\] \.is-folded,\s*\.has-js main\[data-format=grid\] \.c-gallery \.is-folded\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.c-gallery__more\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.has-js main\[data-format=grid\] \.c-gallery \.c-gallery__more[^{]*\{[^}]*display:\s*(flex|block)/);
});

test('las flechas se dibujan centradas en su caja, no con el glifo de la fuente', () => {
  assert.match(css, /\.c-lightbox__nav--prev\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center/);
  assert.match(css, /\.c-lightbox__nav--next::before\s*\{[^}]*rotate\(45deg\)/);
  assert.match(css, /\.c-gallery__step:first-child::before\s*\{[^}]*rotate\(-135deg\)/);
});

test('en cuadricula los logotipos no se recortan: casilla cuadrada con el dibujo completo', () => {
  assert.match(css, /main\[data-format=grid\] \.c-gallery\.c-gallery--logos \.c-gallery__open img,\s*\.c-gallery\.c-gallery--logos\[data-format=grid\] \.c-gallery__open img\s*\{[^}]*aspect-ratio:\s*1;[^}]*object-fit:\s*contain/);
});

test('el contenido de las casillas se centra', () => {
  assert.match(css, /\.c-gallery__open\s*\{[^}]*place-items:\s*center/);
});

test('el modal se desvanece al abrir y al cerrar, solo si la persona acepta movimiento', () => {
  const block = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.c-lightbox\s*\{[\s\S]*?\n\}(?:\n|$)/)?.[0] ?? '';
  assert.match(block, /\.c-lightbox\s*\{[^}]*opacity:\s*0;[^}]*transition:[^;]*opacity 0\.2s[^;]*display 0\.2s allow-discrete[^;]*overlay 0\.2s allow-discrete/);
  assert.match(block, /\.c-lightbox\[open\]\s*\{[^}]*opacity:\s*1/);
  assert.match(block, /@starting-style/);
});

test('el cambio de vista se anima con un fundido de la zona de contenido', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*::view-transition-old\(case\),\s*::view-transition-new\(case\)\s*\{[^}]*animation-duration:\s*0\.3s/);
});

test('el boton de volver arriba esta al alcance del pulgar, oculto hasta bajar del hero y solo con JavaScript', () => {
  assert.match(css, /\.c-to-top\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.has-js \.c-to-top\s*\{[^}]*position:\s*fixed;[^}]*inset-inline-end:[^;]*safe-area-inset-right/);
  assert.match(css, /\.has-js \.c-to-top\s*\{[^}]*inset-block-end:[^;]*safe-area-inset-bottom/);
  assert.match(css, /\.has-js \.c-to-top\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none/);
  assert.match(css, /\.has-js \.c-to-top\.is-visible\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto/);
});

test('en cuadricula, en movil, los pies de foto se esconden para no romper las filas, y en carrusel siempre se ven', () => {
  assert.match(css, /\.c-gallery\[data-format=grid\] figcaption,\s*main\[data-format=grid\] \.c-gallery figcaption\s*\{[^}]*display:\s*none/);
  assert.match(css, /@media \(min-width: 48rem\)\s*\{\s*\.c-gallery\[data-format=grid\] figcaption,\s*main\[data-format=grid\] \.c-gallery figcaption\s*\{[^}]*display:\s*block/);
  assert.match(css, /main\[data-format=carousel\] \.c-gallery figcaption\s*\{[^}]*display:\s*block/);
});
