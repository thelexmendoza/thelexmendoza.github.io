# Fundamentos y primera iteración de la home: plan de implementación

> **Para quien ejecute:** SUB-SKILL REQUERIDA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para llevar el avance.

**Meta:** Dejar el repo sin Bootstrap, con Sass compilado a un CSS comprimido, tokens Fibonacci, temas claro y oscuro, IBM Plex completa, y una primera versión navegable de la home con contenido provisional.

**Arquitectura:** Sass organizado en capas ITCSS con nombres BEMIT. Los tokens se definen en Sass y se emiten como variables CSS, porque el tema cambia en el navegador. HTML estático y JavaScript plano en módulos pequeños. Las pruebas usan `node --test` y la API de JavaScript de Sass; la revisión visual usa el navegador integrado.

**Stack:** Dart Sass, `@fontsource/ibm-plex-*`, Node 20 o superior, HTML y JS plano.

**Especificación:** `docs/superpowers/specs/2026-11-01-sitio-personal-design.md` (secciones 3, 4, 5, 7b y 8). Textos en `docs/brand/pitch.md`.

## Restricciones globales

- Sin frameworks de CSS ni de JS. Idioma del sitio: español, tuteo.
- Prefijos BEMIT: `c-` componente, `o-` objeto, `u-` utilidad, `is-`/`has-` estado, `js-` gancho de JS.
- Espaciado Fibonacci: 8, 13, 21, 34, 55, 89, 144 px, **expresado en `rem`** (px ÷ 16).
- Tipografía: base 16 px con pasos de razón áurea 10, 16, 26, 42, 68, 110 px, en `rem`. En móvil la razón baja a √φ y se interpola con `clamp()`.
- Puntos de quiebre (px): 320, 375, 430, 768, 1024, 1280, 1440, 1920, 2560.
- Colores. Oscuro: fondo `#0a0a0a`, texto `#fafafa`, secundario `#bdbdbd`, acento `#e10600`. Claro: fondo `#fafafa`, texto `#0a0a0a`, secundario `#4a4a4a`, acento `#d90429`.
- Un acento rojo y un degradado animado por vista. Todo movimiento respeta `prefers-reduced-motion`.
- Objetivos táctiles de 55 px o más con `pointer: coarse`; hover solo con `hover: hover`.
- Nunca va al repo: precios, `private/`, claves de API, fuentes con licencia propietaria.
- WhatsApp 81 2904 3592; correo lex.mendozaleon@gmail.com.
- Se ejecuta `npm run build` antes de cada commit. Solo se hace commit con el visto bueno de Lex. Cada mensaje de commit termina con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Puntos a vigilar (no cubiertos por una tarea de forma obvia)

1. `localStorage` no disponible (modo privado, bloqueado): el tema debe funcionar con la preferencia del sistema. *Prueba en la tarea 6.*
2. JavaScript desactivado: la página se lee completa y el tema sigue `prefers-color-scheme` solo con CSS. *Prueba en la tarea 4 (CSS) y revisión en la tarea 9.*
3. Parpadeo del tema equivocado al cargar cuando el guardado difiere del sistema. *Revisión en navegador en la tarea 6.*
4. Palabras largas en español con acentos ("DISEÑADOR") desbordan a 320 px. *Medición con `scrollWidth` en la tarea 9.*
5. Si falla la carga de una fuente, el texto sigue legible con fuente de respaldo sin saltos grandes. *Revisión en la tarea 3.*

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json` | Scripts `build`, `dev`, `fonts`, `test`; dependencias de desarrollo |
| `scripts/copy-fonts.mjs` | Copia los `woff2` latinos de Plex a `assets/fonts/plex/` y genera `_fonts.scss` |
| `src/scss/main.scss` | Punto de entrada que importa las capas |
| `src/scss/0-settings/` | `_tokens`, `_fonts` (generado), `_themes`, `_cases` |
| `src/scss/1-tools/` | `_functions`, `_mixins` |
| `src/scss/2-generic/` a `6-utilities/` | Reset, elementos, objetos, componentes, utilidades |
| `assets/js/theme.js` | Lógica pura del tema |
| `assets/js/main.js` | Conecta el botón de tema |
| `tests/*.test.mjs` | Pruebas de tokens, contraste, tema y HTML |
| `scripts/check-html.mjs` | Revisa estructura de las páginas |
| `index.html` | Home |
| `CLAUDE.md`, `README.md` | Convenciones del proyecto y presentación |

---

### Tarea 1: Limpieza del repo y herramientas de compilación

**Archivos:**
- Modificar: `package.json`, `.gitignore`, `README.md`
- Crear: `CLAUDE.md`, `src/scss/main.scss`
- Eliminar del repo: `node_modules/`, `assets/output.css`, `assets/type/`

**Interfaces:**
- Produce: `npm run build` genera `assets/css/main.min.css`; `npm run dev` observa cambios; `npm test` corre `node --test tests/`.

- [ ] **Paso 1:** Quitar del índice de git lo que no debe vivir en el repo, sin borrarlo del disco: `git rm -r --cached node_modules`; luego `git rm -r assets/output.css assets/type`. Verifica con `git ls-files | grep -c node_modules` y espera `0`.
- [ ] **Paso 2:** En `package.json` quitar `bootstrap`, agregar `sass` y `@fontsource/ibm-plex-sans`, `-sans-condensed`, `-serif`, `-mono` como `devDependencies`, y definir los scripts: `build` (`sass src/scss/main.scss assets/css/main.min.css --style=compressed --no-source-map`), `dev` (mismo comando con `--watch --style=expanded --source-map`), `fonts` (`node scripts/copy-fonts.mjs`), `test` (`node --test tests/`). Ejecuta `npm install`.
- [ ] **Paso 3:** Crear `src/scss/main.scss` vacío con un comentario. Ejecuta `npm run build`. Espera que exista `assets/css/main.min.css` sin errores.
- [ ] **Paso 4:** Escribir `CLAUDE.md` con: convenciones BEMIT, capas ITCSS, regla "sin frameworks", unidad rem con escala Fibonacci, qué va a `private/`, regla de licencias de fuentes, y la orden de compilar antes de commit. Reescribir `README.md` como presentación pública corta del proyecto y de cómo compilar.
- [ ] **Paso 5:** Commit: `git add -A && git commit -m "chore: retira Bootstrap y node_modules, agrega Sass y convenciones"`.

### Tarea 2: Canalización de fuentes IBM Plex

**Archivos:**
- Crear: `scripts/copy-fonts.mjs`, `tests/fonts.test.mjs`
- Generados: `assets/fonts/plex/*.woff2`, `src/scss/0-settings/_fonts.scss`

**Interfaces:**
- Produce: `_fonts.scss` con un `@font-face` por cara (familias `IBM Plex Sans`, `IBM Plex Sans Condensed`, `IBM Plex Serif`, `IBM Plex Mono`; pesos 100 a 700; normal e itálica), con `font-display: swap`. Variables Sass `$font-sans`, `$font-condensed`, `$font-serif`, `$font-mono` con pila de respaldo.

- [ ] **Paso 1:** Escribir `tests/fonts.test.mjs` con la prueba `"cada url() de _fonts.scss apunta a un archivo existente"` (lee el SCSS, extrae las rutas y comprueba `fs.existsSync`) y `"declara las cuatro familias"`.
- [ ] **Paso 2:** `npm test` debe fallar porque aún no existe `_fonts.scss`.
- [ ] **Paso 3:** Implementar `scripts/copy-fonts.mjs`: por cada paquete Fontsource copia solo `*-latin-{peso}-{normal|italic}.woff2` y escribe `_fonts.scss`. La ruta en el CSS es relativa a `assets/css/`.
- [ ] **Paso 4:** Ejecutar `npm run fonts` y `npm test`; esperan pasar. Importar `_fonts.scss` en `main.scss`.
- [ ] **Paso 5:** Definir las pilas de respaldo con `sans-serif`, `serif` y `monospace` y confirmar a mano que el texto sigue legible al bloquear las fuentes en el navegador.
- [ ] **Paso 6:** Commit: `feat: agrega la familia IBM Plex alojada en el sitio`.

### Tarea 3: Tokens y escala Fibonacci

**Archivos:**
- Crear: `src/scss/1-tools/_functions.scss`, `src/scss/0-settings/_tokens.scss`, `tests/tokens.test.mjs`

**Interfaces:**
- Produce: `rem($px) -> rem` (px ÷ 16); `space($n) -> rem` con `$n` de 1 a 7; mixin `fluid-type($min-px, $max-px)` que emite `clamp()`. `:root` emite `--space-1` a `--space-7`, `--step--1` a `--step-4`, y `--ratio-mobile`, `--ratio-desktop`.

- [ ] **Paso 1:** Escribir `tests/tokens.test.mjs` que compila `main.scss` con la API de Sass y afirma: `--space-1: 0.5rem`, `--space-2: 0.8125rem`, `--space-3: 1.3125rem`, `--space-4: 2.125rem`, `--space-5: 3.4375rem`, `--space-6: 5.5625rem`, `--space-7: 9rem`; `--step-0: 1rem`; y que `--step-4` comienza con `clamp(`.
- [ ] **Paso 2:** Correr el test y verificar que falla.
- [ ] **Paso 3:** Implementar las funciones y el mixin, y emitir los tokens en `:root`. En móvil (320) los pasos usan √φ y en 1440 usan φ; los valores intermedios los resuelve `clamp()`.
- [ ] **Paso 4:** Correr el test; debe pasar. Commit: `feat: tokens de espaciado y tipografía con escala Fibonacci`.

### Tarea 4: Temas claro y oscuro, y modo camaleón

**Archivos:**
- Crear: `src/scss/0-settings/_themes.scss`, `src/scss/0-settings/_cases.scss`, `tests/contrast.test.mjs`

**Interfaces:**
- Produce: variables `--color-bg`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-text`, `--color-on-accent`, `--gradient-a`, `--gradient-b`, definidas para `[data-theme="dark"]` y `[data-theme="light"]`. Sin atributo, `@media (prefers-color-scheme: dark)` aplica el oscuro. `[data-case="bmw"]`, `"daniel"`, `"etics"`, `"moto"` redefinen `--gradient-a`, `--gradient-b` y `--color-accent`.

- [ ] **Paso 1:** Escribir `tests/contrast.test.mjs`: lee el CSS compilado, extrae los valores de cada tema y afirma contraste de **4.5 o más** para texto y texto secundario sobre el fondo, y para `--color-on-accent` sobre `--color-accent`; **3 o más** para `--color-accent` sobre el fondo (texto grande e interfaz); y **4.5 o más** para `--color-accent-text`.
- [ ] **Paso 2:** Correr y verificar que falla.
- [ ] **Paso 3:** Implementar los temas con los valores de las restricciones globales. El rojo `#e10600` sobre `#0a0a0a` da alrededor de 4 a 1, así que para texto pequeño en oscuro se define `--color-accent-text: #ff5a4d`; en claro coincide con el acento. Los casos usan los degradados de la sección 4 de la especificación.
- [ ] **Paso 4:** Correr el test; debe pasar. Commit: `feat: temas claro y oscuro y paletas por caso`.

### Tarea 5: Capas base y puntos de quiebre

**Archivos:**
- Crear: `src/scss/1-tools/_mixins.scss`, `2-generic/_reset.scss`, `3-elements/_page.scss`, `_headings.scss`, `_links.scss`, `4-objects/_o-container.scss`, `_o-stack.scss`, `_o-grid.scss`, `6-utilities/_u-visually-hidden.scss`, `tests/breakpoints.test.mjs`

**Interfaces:**
- Produce: `respond-to($name)` con nombres `phone-s`, `phone`, `phone-l`, `tablet`, `laptop-s`, `laptop`, `desktop`, `wide`, `tv`; objetos `o-container`, `o-stack`, `o-grid`; utilidad `u-visually-hidden`. Elementos con las familias y pasos de tokens.

- [ ] **Paso 1:** Escribir `tests/breakpoints.test.mjs` que compila un fixture usando cada nombre de `respond-to` y afirma que aparece `min-width: 20rem`, `23.4375rem`, `26.875rem`, `48rem`, `64rem`, `80rem`, `90rem`, `120rem`, `160rem`.
- [ ] **Paso 2:** Correr y verificar que falla. Implementar el mixin.
- [ ] **Paso 3:** Escribir las capas 2, 3, 4 y 6. El reset incluye `scroll-behavior` condicionado a `prefers-reduced-motion`, `min-height: 100dvh` en el cuerpo y `padding` con `env(safe-area-inset-*)` en el contenedor. Los objetivos táctiles de 55 px aplican con `@media (pointer: coarse)`; el hover con `@media (hover: hover)`.
- [ ] **Paso 4:** Importar todo en `main.scss` en orden ITCSS, correr `npm test` y `npm run build`. Commit: `feat: capas base, objetos y puntos de quiebre por dispositivo`.

### Tarea 6: Lógica del tema y botón

**Archivos:**
- Crear: `assets/js/theme.js`, `assets/js/main.js`, `tests/theme.test.mjs`, `src/scss/5-components/_c-theme-toggle.scss`

**Interfaces:**
- Produce en `theme.js`: `resolveTheme(stored: string | null, prefersDark: boolean): "light" | "dark"`; `readStoredTheme(storage: Storage | undefined): string | null`; `saveTheme(storage: Storage | undefined, theme: string): void`. Ninguna lanza error si `storage` es indefinido o falla.

- [ ] **Paso 1:** Escribir `tests/theme.test.mjs` con estas pruebas: `"el guardado manda sobre el sistema"`, `"sin guardado sigue al sistema"`, `"un valor guardado inválido se ignora"`, `"readStoredTheme no lanza si el storage lanza"`, `"saveTheme no lanza si storage es undefined"`.
- [ ] **Paso 2:** Correr y verificar que fallan.
- [ ] **Paso 3:** Implementar `theme.js` como módulo ES. `main.js` lee el guardado, aplica `data-theme` y conecta `.js-theme-toggle`, que alterna y guarda.
- [ ] **Paso 4:** Correr el test; debe pasar. Agregar en el `<head>` de `index.html` (tarea 7) un script en línea de pocas líneas que aplique el valor guardado antes de pintar, para evitar el parpadeo.
- [ ] **Paso 5:** Estilar el botón (`c-theme-toggle`, con `aria-pressed` y etiqueta accesible). Commit: `feat: cambio de tema con respaldo sin almacenamiento`.

### Tarea 7: Página base, navegación y hero

**Archivos:**
- Modificar: `index.html` (reescribir sin Bootstrap)
- Crear: `scripts/check-html.mjs`, `tests/html.test.mjs`, `src/scss/5-components/_c-nav.scss`, `_c-hero.scss`, `_c-chameleon-title.scss`, `_c-button.scss`

**Interfaces:**
- Produce: `scripts/check-html.mjs` exporta `checkHtml(filePath: string): string[]` (lista de problemas). Reglas: un solo `h1`, `lang="es"`, todas las `img` con `alt`, ningún `href` interno roto, sin referencias a `bootstrap`.
- Componentes: `c-nav`, `c-hero` con `c-hero__title`, `c-chameleon-title` (la palabra con degradado animado).

- [ ] **Paso 1:** Escribir `tests/html.test.mjs` que llama `checkHtml("index.html")` y afirma lista vacía, más una prueba con un HTML mínimo defectuoso que debe devolver los problemas esperados.
- [ ] **Paso 2:** Correr y verificar que falla.
- [ ] **Paso 3:** **Punto de control con Lex:** preguntar si ya se instala Impeccable en este momento (según la sección 10 de la especificación). Si dice que sí, ejecutar `npx impeccable install`, revisar con `git status` qué archivos agregó y mostrárselos antes de cualquier commit.
- [ ] **Paso 4:** Reescribir `index.html` con la cabecera (metas, favicon, enlace a `assets/css/main.min.css`, script del tema), la navegación (Casos, Servicios, Sobre mí, Cómo trabajo, Contacto discreto y botón de tema) y el hero "¿Buscas diseñador?" con la palabra camaleónica y el botón "Ver casos". Usar los textos de `docs/brand/pitch.md`.
- [ ] **Paso 5:** Implementar `checkHtml`, correr `npm run build && npm test`, y revisar en el navegador integrado a 390 px y 1440 px, en los dos temas. Commit: `feat: base de la home con navegación y hero`.

### Tarea 8: Servicios, casos, "Arma tu plan", sobre mí y contacto

**Archivos:**
- Modificar: `index.html`
- Crear: `src/scss/5-components/_c-service.scss`, `_c-case-card.scss`, `_c-section.scss`, `_c-footer.scss`

**Interfaces:**
- Consumes: `o-container`, `o-grid`, `o-stack`, `c-button`, `data-case`.
- Produce: `c-service` (3), `c-case-card` (6, con `data-case`, título y descripción de una línea), `c-section--plan` con el botón hacia `/plan/`, resumen "Sobre mí" de tres líneas, `c-footer` con WhatsApp (`https://wa.me/528129043592`) y correo.

- [ ] **Paso 1:** Agregar a `tests/html.test.mjs` la prueba `"la home enlaza los seis casos y el plan"` que busca los `href` a `casos/valtre/`, `casos/ciisa-web/`, `casos/bmw-mini/`, `casos/daniel-abrego/`, `casos/etics-live/`, `casos/motociclismo/` y `plan/`. Debe fallar.
- [ ] **Paso 2:** Agregar las secciones en el orden de la especificación. Los enlaces a páginas que aún no existen llevan `aria-disabled` y la marca "Próximamente"; `checkHtml` los exime solo si tienen esa marca.
- [ ] **Paso 3:** Los tres paquetes usan el contenido de `docs/brand/pitch.md` **sin cifras**. Las tarjetas de caso usan imagen provisional y avatar provisional hasta que lleguen las fotos.
- [ ] **Paso 4:** Estilar con tokens y `container queries` en `c-case-card`. Correr `npm run build && npm test`; debe pasar. Commit: `feat: secciones de servicios, casos, plan y contacto en la home`.

### Tarea 9: Revisión por dispositivo y cierre de la primera iteración

**Archivos:**
- Modificar: los estilos que la revisión muestre defectuosos.

- [ ] **Paso 1:** Con el servidor de vista previa, abrir la home y para cada ancho (320, 375, 430, 768, 1024, 1280, 1440, 1920) medir con JavaScript en la página que `document.documentElement.scrollWidth <= window.innerWidth`. Espera `true` en todos.
- [ ] **Paso 2:** Tomar una captura por ancho en los dos temas y corregir desbordes, cortes de palabras y textos que no se lean.
- [ ] **Paso 3:** Con JavaScript desactivado (o bloqueando `assets/js/`), confirmar que la página se lee completa y que el tema sigue la preferencia del sistema.
- [ ] **Paso 4:** Con `prefers-reduced-motion` activo, confirmar que el degradado queda quieto.
- [ ] **Paso 5:** `npm run build && npm test`. Mostrarle la home a Lex en el navegador y recoger sus ajustes. Commit: `chore: revisión responsiva de la primera iteración`.

---

## Revisión del plan frente a la especificación

- **Cubierto aquí:** sección 4 (temas, tipografía, Fibonacci, camaleón), sección 5 (Sass, BEMIT, limpieza, compilación), sección 7b (responsivo) y la home de la sección 3.
- **Fuera de este plan, para planes siguientes:** los 6 casos, "Arma tu plan" con Supabase y Resend, Sobre mí, Cómo trabajo, Privacidad, SEO completo y GitHub Actions.
- **Dependencia con Lex:** fotos y el momento de instalar Impeccable.
