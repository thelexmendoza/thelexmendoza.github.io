# Diseño del sitio personal de Lex Mendoza

Fecha: 2026-11-01. Estado: borrador para revisión de Lex. Fuente de textos: `docs/brand/pitch.md`.

## 1. Propósito

Sitio de marca personal y profesional de Alejandro "Lex" Mendoza, diseñador gráfico y desarrollador web, para ofrecer sus servicios de identidad visual y sitios web.

**Éxito:** un visitante entiende en 10 segundos qué ofrece Lex, ve pruebas reales de su trabajo y puede contactarlo o armar su plan sin fricción. Lex puede demostrar con el propio código cómo trabaja (Sass, BEMIT, build, Supabase, Actions).

**Público:** marcas personales y profesionales independientes, y negocios locales y pymes. Secundario: empresas medianas y reclutadores.

**Postura:** autenticidad práctica. Sin personaje. Primera persona, tuteo, humor ligero y sin aspereza.

## 2. Alcance

Dentro: las 11 páginas del mapa, el sistema de diseño con modo claro y oscuro, los 6 casos con tema propio, el formulario "Arma tu plan" con Supabase, el flujo de compilación de Sass y la higiene del repositorio.

Fuera por ahora: blog, multilenguaje (solo español), cotizador público, pagos en línea, panel de administración propio, GitHub Actions (queda como mejora posterior).

## 3. Estructura del sitio

```
/                       Home
/casos/valtre/          Valtre: identidad y contenido
/casos/ciisa-web/       CiiSA: sitios web de eventos y producto
/casos/bmw-mini/        BMW / MINI Euromotors Monterrey
/casos/daniel-abrego/   Psicología Práctica, Daniel Ábrego
/casos/etics-live/      Etic's Live
/casos/motociclismo/    Motoplex Monterrey + Motoland
/plan/                  Arma tu plan
/sobre-mi/              Trayectoria, habilidades, detalles personales
/como-trabajo/          Proceso, tiempos, lo que no hago, política de pago
/privacidad/            Aviso de privacidad
```

Páginas estáticas en carpetas con `index.html`, para URL limpias en GitHub Pages.

**Home (capa rápida):** Hero → Servicios (3 paquetes, sin cifras) → Casos (6 tarjetas) → Arma tu plan → Sobre mí (resumen de tres líneas) → Contacto directo (WhatsApp y correo).

**Página de caso:** título camaleónico → rol, año y contexto → problema → qué hice → resultado → galería → siguiente caso → Arma tu plan.

**Navegación:** Casos, Servicios, Sobre mí, Cómo trabajo, enlace discreto de contacto y botón de tema. "Arma tu plan" no va en el menú: aparece solo después del portafolio.

**Orden de los casos:** CiiSA | PSW, Valtre, BMW/MINI, Daniel Ábrego, Etic's Live, Motociclismo.

**Llamados a la acción, en orden:** Ver casos (hero) → Arma tu plan (tras ver el portafolio) → Contacto simple (cierre).

## 4. Sistema visual

### Temas

Un tema oscuro y uno claro, ambos con base en blanco y negro y el rojo como firma personal.

| | Oscuro | Claro |
|---|---|---|
| Fondo | `#0a0a0a` | `#fafafa` |
| Texto | `#fafafa` | `#0a0a0a` |
| Texto secundario | `#bdbdbd` | `#4a4a4a` |
| Acento | `#e10600` | `#d90429` |

El rojo `#e10600` sobre `#0a0a0a` queda alrededor de 4 a 1: sirve para titulares, botones e interfaz, pero no para texto pequeño. Para texto pequeño en modo oscuro se usa un rojo más claro, `#ff5a4d` (token `--color-accent-text`); en modo claro el acento ya cumple.

Por defecto sigue la preferencia del sistema (`prefers-color-scheme`). Un botón permite cambiarlo y la elección se guarda en `localStorage`, con fallback si no está disponible. Se aplica con `data-theme` en `<html>`.

Regla: **un acento rojo por vista** y **un degradado animado por pantalla**, solo sobre una palabra clave. La animación se desactiva con `prefers-reduced-motion`.

### Modo camaleón

Cada caso redefine acento, degradado y tipografía de titulares con `data-case="valtre"`, etc. La base blanca y negra y la estructura no cambian.

| Caso | Colores del degradado |
|---|---|
| Valtre | azul cielo `#38bdf8` (de valtre.com) y `#7dd3fc`; en claro `#0369a1` y `#0c4a6e` |
| CiiSA | PSW | verde CiiSA `#bcf200` hacia cian `#00ccff` (de CiiSA Beyond); en claro `#5c7a00` y `#00758f` |
| BMW / MINI | `#0066b1` y azul oscuro `#001489` |
| Daniel Ábrego | `#7c3aed` y `#ec4899` |
| Etic's Live | `#065f46` y `#10b981` |
| Motociclismo | `#c2410c` y `#f97316` |

En la home, la palabra camaleónica del hero recorre los colores de los casos.

### Tipografía

Base: **toda la familia IBM Plex** (Sans, Sans Condensed, Serif y Mono, en todos sus pesos y con cursivas), alojada en el propio sitio en `woff2` con subset latino. Licencia SIL OFL. Se obtiene con los paquetes `@fontsource/ibm-plex-*` y un script copia al sitio solo los archivos latinos, para que la descarga sea reproducible.

Declarar todos los pesos no penaliza el rendimiento: el navegador solo descarga los que la página usa. Se precargan únicamente las 2 o 3 caras críticas del primer pantallazo.

Roles por familia, para sostener la jerarquía:

- **Plex Sans Condensed:** titulares de impacto y numerales grandes.
- **Plex Sans:** cuerpo, interfaz y botones.
- **Plex Mono:** etiquetas, años, datos y detalles técnicos.
- **Plex Serif:** citas y el momento camaleónico (cursiva).

Los pesos extremos (Thin y ExtraLight) se reservan para titulares muy grandes. El cuerpo no baja de Light y se lee en Regular.

### Escala Fibonacci

- **Espaciado:** 8, 13, 21, 34, 55, 89 y 144 px, como tokens (`$space-1` a `$space-7`), expresados en `rem`.
- **Tipografía:** pasos de razón áurea (φ ≈ 1.618) a partir de una base de 16 px: 10, 16, 26, 42, 68 y 110 px. Es la versión continua de Fibonacci, porque el cociente de números consecutivos tiende a φ.
- **Escala responsiva:** en móvil la razón baja a √φ (≈ 1.272) para que el titular grande no desborde la pantalla, y sube hacia φ en pantallas amplias. Se resuelve con `clamp()`, sin saltos bruscos.
- **Interlineado:** titulares entre 1.0 y 1.2; cuerpo cercano a 1.6.
- **Composición:** las divisiones del hero y de las secciones usan la proporción 61.8 / 38.2.

Titulares camaleónicos de cada caso, según licencia:

- **Fuente libre** (por ejemplo Roboto Condensed, Ysabeau, New Rocker, Aileron): texto real con `@font-face`, archivo en `assets/fonts/`.
- **Fuente propietaria** (BMW Group, Avenir, Eloquia, Bahnschrift): título exportado como **SVG con contornos**. El archivo de la fuente se queda en `private/`.
- Antes de publicar cualquier fuente se verifica su licencia.

## 5. Arquitectura del código

### Sass con ITCSS y BEMIT

```
src/scss/
  main.scss
  0-settings/   _tokens  _fonts  _cases
  1-tools/      _mixins  _functions
  2-generic/    _reset
  3-elements/   _page  _headings  _links
  4-objects/    _o-container  _o-stack  _o-grid
  5-components/ _c-nav  _c-hero  _c-chameleon-title  _c-service
                _c-case-card  _c-button  _c-theme-toggle  _c-form-step  _c-footer
  6-utilities/  _u-visually-hidden
```

- **Nombres BEMIT:** `c-` componentes, `o-` objetos, `u-` utilidades, `is-` y `has-` estados, `js-` ganchos de JavaScript. Ejemplo: `c-case-card__title--featured`.
- **Tokens en Sass como mapas**, emitidos como variables CSS. Hace falta que sean variables CSS porque el tema y el caso cambian en el navegador.
- Sin frameworks de CSS.

### Compilación

- `npm run build`: compila a `assets/css/main.min.css`, comprimido y sin mapa de fuente. Lex compila antes de hacer commit y push.
- `npm run dev`: modo observador con mapas de fuente (ignorados por git).
- Dependencia de desarrollo: `sass` (Dart Sass). Sin Bootstrap.
- JavaScript plano en `assets/js/`, módulos pequeños: tema, formulario, WhatsApp.

### Higiene del repositorio

- `.gitignore`: `private/`, `node_modules/`, `*.map`, archivos del sistema.
- `private/` (nunca se publica): originales pesados, notas del pitch, precios, fuentes propietarias.
- Se retira del repo: `node_modules/`, Bootstrap, `assets/output.css`, `assets/type/` (Montserrat).
- Imágenes: solo versiones optimizadas en `assets/img/`, en WebP o AVIF, con tamaños responsivos.

## 6. "Arma tu plan"

Formulario tipo Typeform: una pregunta por pantalla, con la identidad del sitio. Funciona sin JavaScript como un formulario normal; con JavaScript se convierte en pasos.

**Pasos:** qué necesita → sobre el cliente → preguntas de identidad (solo si aplica) → preguntas de sitio web (solo si aplica) → tiempo → referencias → presupuesto opcional en rangos amplios → contacto y consentimiento de privacidad → resumen.

**Salidas:** enviar por correo y mandar por WhatsApp (enlace `wa.me` con el mensaje armado en el navegador, número 81 2904 3592).

**Supabase:**

1. El navegador envía el brief a la Edge Function `submit-brief`.
2. La función valida, aplica un campo trampa y un límite de envíos, guarda en la tabla `briefs` y envía el correo con Resend a lex.mendozaleon@gmail.com.
3. La tabla `briefs` tiene RLS activado y ninguna política pública. Solo la función, con su clave privada, escribe.
4. Si la función falla, el formulario ofrece solo el botón de WhatsApp para no perder el contacto.

El código de la función y las migraciones viven en `supabase/functions/submit-brief/` y `supabase/migrations/`. Las claves privadas son *secrets* de Supabase, nunca van al repo.

**Riesgo:** los proyectos gratuitos de Supabase se pausan tras una semana sin actividad (verificar en su documentación actual). Mitigación: una tarea programada con GitHub Actions que haga una petición diaria. Es el primer caso de uso de Actions que Lex quiere aprender.

**Privacidad:** el formulario recoge nombre, teléfono y correo. El aviso de privacidad debe nombrar a Supabase y Resend como encargados del tratamiento e indicar el tiempo de conservación.

## 7. Contenido

- Textos: `docs/brand/pitch.md`.
- Los **precios no se publican** y no hay cotizador. Son una regla interna que vive en `private/pricing/`. Los paquetes públicos describen qué incluyen, sin cifras.
- Las cifras que se citan deben estar verificadas (por ejemplo: canal de Etic's Live con 200 mil suscriptores, video con más de 5 millones de vistas).
- Fotos de Lex: las aporta Lex.

## 7b. Responsivo por dispositivo

Diseño de abajo hacia arriba (mobile first) con puntos de quiebre nombrados por tipo de dispositivo, tomados de los que Lex ya definió en Figma:

| Clase | Ancho |
|---|---|
| Teléfono pequeño | 320 |
| Teléfono | 375 a 390 |
| Teléfono grande | 430 |
| Tableta vertical | 768 |
| Tableta horizontal y laptop pequeña | 1024 |
| Laptop | 1280 |
| Escritorio | 1440 |
| Pantalla grande | 1920 |
| Pantalla muy grande o TV | 2560 |

Además de los anchos:

- **Contenedores de consulta (`container queries`)** para que cada componente (por ejemplo la tarjeta de caso) se adapte al espacio que tiene y no solo al ancho de la pantalla.
- **Unidades dinámicas** (`dvh`, `svh`) para que el hero no salte con las barras del navegador móvil.
- **Zonas seguras** (`env(safe-area-inset-*)`) para teléfonos con muesca.
- **Táctil y puntero:** objetivos táctiles de al menos 55 px (un número de Fibonacci) cuando `pointer: coarse`; efectos de hover solo cuando `hover: hover`.
- **Orientación** vertical y horizontal en teléfonos y tabletas.
- **Preferencias:** `prefers-reduced-motion`, `prefers-contrast` y `prefers-color-scheme`.
- Se prueba en cada clase de dispositivo antes de dar por terminada una página.

## 8. Accesibilidad, rendimiento y SEO

- Contraste AA en ambos temas. Foco visible. Navegación completa con teclado. Un solo `h1` por página. Texto alternativo en imágenes.
- Fuentes con `font-display: swap`, precarga de las críticas, imágenes con `loading="lazy"` y dimensiones declaradas.
- Metadatos, Open Graph y favicon por página. `sitemap.xml` y `robots.txt`.

## 9. Fases

1. **Fundamentos:** limpieza del repo, Sass, tokens, temas, fuentes, `CLAUDE.md` y `README.md`.
2. **Home** completa. Aquí se instala Impeccable (ver sección 10).
3. **Los 6 casos.**
   - 3b. **Arma tu plan** con Supabase y Resend, más el aviso de privacidad.
4. **Sobre mí y Cómo trabajo.**
5. **Pulido:** accesibilidad, rendimiento, SEO, metadatos.
6. **Después:** GitHub Actions para compilar y publicar.

Cada fase tendrá su plan de implementación propio.

## 10. Herramientas

**Impeccable** (skill de diseño) se instala al empezar la fase 2, cuando existen el pitch, los tokens, los temas y las fuentes. Su `init` guarda el contexto de diseño del proyecto, `shape` ayuda a planear cada página antes de programarla, y `critique`, `audit` y `polish` se usan sobre lo ya construido. Antes de hacer commit se revisan los archivos que agregue al repo. Debe respetar las convenciones de `CLAUDE.md` (Sass, BEMIT, sin frameworks).

## 11. Pendientes

- Textos y paleta de Valtre y CiiSA para sus casos.
- Fotos de Lex.
- Imágenes optimizadas de cada caso.
- Aviso de privacidad y política de pago.
- Definir los tres paquetes públicos (nombre y contenido, sin cifras).
- Proyecto de Supabase. La cuenta de Resend ya existe; la clave de API se guardará como *secret* de Supabase y nunca se comparte por chat ni se sube al repo.
- Revisar la licencia de cada fuente antes de publicarla.
