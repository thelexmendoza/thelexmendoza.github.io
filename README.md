# Lex Mendoza

Sitio personal y de portafolio de Alejandro "Lex" Mendoza, diseñador gráfico y desarrollador web en Monterrey.

Hecho a mano con HTML, Sass y JavaScript plano, sin frameworks. Publicado en GitHub Pages.

## Cómo trabajar en el proyecto

```bash
npm install
npm run build   # compila Sass a assets/css/main.min.css
npm run dev     # observa cambios mientras desarrollas
npm test        # corre las pruebas
npm run case -- private/content/<caso>/caso.plan.json   # genera la pagina de un caso (--sin-imagenes solo regenera la pagina)
npm run legal   # genera el aviso de privacidad y la politica de cookies
npm run seo     # genera robots.txt, sitemap.xml y el bloque de SEO de la home
```

El sitio se publica en [lexmendoza.com](https://lexmendoza.com) desde la rama `main` (el archivo `CNAME` fija el dominio). Los planes de los casos, los originales y las notas viven en `private/`, que no se sube.

El CSS sigue ITCSS con nombres BEMIT. Las convenciones completas están en [CLAUDE.md](CLAUDE.md).

## Licencia

GPL-3.0 (ver LICENSE). Las fuentes IBM Plex se distribuyen bajo SIL OFL 1.1.
