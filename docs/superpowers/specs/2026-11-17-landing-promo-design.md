# Landing de la promo de fin de año (`lexmendoza.com/promo/`)

Diseño del 17 de noviembre de 2026. Estado: por aprobar.

## Intención

Una página para posicionar en redes (el enlace del perfil de Instagram, anuncios y mensajes) que convenza a un dueño de negocio o profesional independiente de **cotizar su página con la promo de fin de año**, y lo lleve al brief (`brief.lexmendoza.com`), que es el formulario de leads (pide nombre, WhatsApp, correo y consentimiento, y manda aviso y confirmación). La landing no tiene formulario propio.

Por qué ahora y para qué: Lex quiere captar leads con un producto de entrada («Landing Express») y que los pedidos entren por el brief. La urgencia tiene que ser **real**: lugares que se agotan cada semana y un cierre el 31 de diciembre.

## Metas, no metas y antimetas

- **Metas:** que quien llega sepa en 10 segundos qué se vende, cuánto cuesta y cuántos lugares quedan; que dé el primer paso (el brief) sin pagar nada; que quien no quiera llenar el brief tenga WhatsApp; que el tiempo de carga sea corto.
- **No metas:** tienda en línea, varias páginas, analítica o Pixel de Meta (requieren antes el banner de consentimiento), pruebas A/B, otro idioma, y cerrar la promo del lado del servidor (ver «Pendientes aparte»).
- **Antimetas** (aunque «funcione»): urgencia falsa (relojes que se reinician, «últimas horas» sin serlo), precios tachados de una lista que no es pública, promesas de resultados («garantizo ventas», «la mejor»), pedir contraseñas.

## Decisiones de Lex

- Va en `lexmendoza.com/promo/` (opción A: una página más del sitio, mismo estilo, menú y pie; HTML + Sass + JavaScript plano).
- **Los precios de la promo son públicos** (excepción a la regla de «sin precios en el repo»: solo los de la promo; la lista normal sigue privada). `CLAUDE.md` se actualiza.
- La promo dura **hasta el 31 de diciembre de 2026 o hasta agotar lugares**.
- Sin hablar de «olas» (decisión anterior).

## Enfoques considerados

- **A. Página del sitio** (elegida): coherente, rápida de hacer, dirección corta, un solo sistema que mantener.
- **B. Landing aparte con otro diseño:** se vería distinta del portafolio y habría dos sistemas. Descartada.
- **C. Servirla desde `brief.lexmendoza.com`:** habría permitido precios en un repo privado, pero Lex decidió que los precios son públicos y quiere `lexmendoza.com`. Descartada.

## Diseño

**Página.** `promo/index.html` sale de un generador (`scripts/render-promo.mjs`, `npm run promo`) con el contenido en `scripts/promo/promo.mjs` (como las páginas legales: cabecera, script del tema y pie salen de `index.html`; no se edita el HTML a mano). Una prueba falla si está desactualizada. Mismos tokens, ITCSS/BEMIT (`c-promo-*`), escala Fibonacci, un acento rojo y todo movimiento dentro de `prefers-reduced-motion: no-preference`.

**Secciones, en orden:**
1. **Hero:** `// promo de fin de año`, «Tu página web, lista en 5 días. Desde $549.», texto corto, botón «Cotiza con la promo» (al brief), segundo enlace «Prefiero escribirte por WhatsApp», y el letrero de lugares: «Esta semana quedan N de 21 lugares. Se reinician el lunes».
2. **Cómo funciona:** tres pasos (respondes el brief en unos 4 minutos; ves tu maqueta armarse en vivo; yo la armo y la publico) con el video del brief ya grabado (`assets/video/plan/`). «Cotiza sin pagar nada todavía».
3. **Opciones y precios** (con IVA incluido): cuatro tarjetas, cada una con precio, días de entrega, para quién es, qué se paga aparte y su estado de lugares. Código a la medida $549 · 5 días · 10 lugares; Wix $1,290 · 7 días · 5; Squarespace $1,990 · 10 días · 3; WordPress $2,190 · 8 días · 3. Extra: publicación asistida $390. El texto de cada plataforma se toma del brief para que no se contradigan.
4. **Qué incluye y qué no:** una página de seis secciones, tu contenido, una ronda de ajustes y 30 días de cambios menores (en código); no incluye tienda, varias páginas ni diseño distinto al de la plantilla.
5. **Tres casos de prueba:** CiiSA | PSW (sitios), Motociclismo (negocio local) y Daniel Ábrego (marca personal), como tarjetas con su imagen y enlace.
6. **Preguntas frecuentes** (`<details>`): qué incluye; qué no; dominio y hosting (con enlace a la guía); si piden contraseñas (no: acceso delegado y temporal); cuándo se paga (te confirmo por WhatsApp antes); qué pasa si necesito algo más grande (servicio normal); qué pasa cuando se agota un lugar.
7. **Cierre:** el mismo botón, WhatsApp, el cierre «hasta el 31 de diciembre o hasta agotar lugares».

**Lugares en vivo.** `assets/js/promo.js` consulta `GET https://jmnnodzdopnbvbkcxpvy.supabase.co/functions/v1/pedido?cupos=1` (devuelve los lugares libres por plataforma y el día de reinicio), con tiempo límite de 4 s. La lógica pura (`assets/js/cupos.js`, con pruebas) decide el estado de cada tarjeta: «Quedan N», «Último lugar» y «Agotado esta semana», donde el botón pasa a «Avísame el lunes» (WhatsApp). Si la consulta falla, la página muestra el texto fijo «lugares limitados cada semana»: nada depende de que cargue. Con la fecha pasada del 31 de diciembre de 2026 (hora de Monterrey) la página cambia a «La promo de fin de año terminó» con WhatsApp para cotizar.

**Integración.** El botón de la home y de los casos sigue yendo al brief; el enlace del perfil de Instagram apunta a `lexmendoza.com/promo/`. SEO: canónica, Open Graph con imagen propia (`build-og.mjs`), `sitemap.xml` y datos estructurados con las cuatro ofertas (`priceCurrency` MXN, vigencia hasta el 31 de diciembre). El aviso de privacidad suma que, al ver los lugares, el navegador se conecta a Supabase.

## Lo que queda al constructor

Textos finales, el orden fino de las tarjetas, el diseño visual de las tarjetas de precio y del letrero de lugares, y los textos de los estados agotado y terminada.

## Pendientes aparte (no bloquean construir)

1. Agregar `https://lexmendoza.com` a `ALLOWED_ORIGINS` en Supabase (si no, la consulta de lugares falla y se ve el texto fijo).
2. El brief y la función `pedido` siguen aceptando pedidos después del 31 de diciembre: hay que cerrar la promo del lado del servidor (cambio en `tpl-express-codigo`).
3. Los precios viven en dos lugares (esta página y `PLATAFORMAS` en el brief): hay que cambiarlos juntos.
4. Analítica o Pixel: primero el banner de consentimiento.
