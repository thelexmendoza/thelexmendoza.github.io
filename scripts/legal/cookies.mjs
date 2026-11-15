// Política de cookies y almacenamiento. Texto estático: scripts/render-legal.mjs arma la página.
// Debe coincidir con lo que el sitio y el formulario realmente guardan (la prueba tests/legal.test.mjs revisa las claves).

export const cookies = {
  slug: 'cookies',
  eyebrow: 'Cookies y almacenamiento',
  title: 'Política de cookies',
  word: 'cookies',
  description: 'Qué guarda este sitio en tu navegador, para qué, por cuánto tiempo y cómo cambiarlo. Hoy no uso publicidad ni analítica.',
  updated: '15 de noviembre de 2026',
  lead: 'Te cuento exactamente qué guarda este sitio en tu navegador. Hoy es muy poco, y nada de seguimiento ni publicidad.',
  body: `
<p>Responsable: <strong>Manuel Alejandro Mendoza León</strong> (Lex Mendoza), Fresnos 931, Col. Hacienda Los Morales, San Nicolás de los Garza, Nuevo León, C. P. 66495. Contacto: <a href="mailto:lex.mendozaleon@gmail.com">lex.mendozaleon@gmail.com</a>.</p>

<h2>1. Qué son</h2>
<p>Las <strong>cookies</strong> y el <strong>almacenamiento local</strong> del navegador son pequeños archivos o registros que un sitio guarda en tu dispositivo para recordar algo. Aquí uso el término «almacenamiento» para ambos.</p>

<h2>2. Qué uso hoy</h2>
<div class="c-legal__scroll">
<table class="c-legal__table">
<thead><tr><th scope="col">Qué</th><th scope="col">Dónde</th><th scope="col">Para qué</th><th scope="col">Cuánto dura</th><th scope="col">Quién</th></tr></thead>
<tbody>
<tr><th scope="row"><code>theme</code></th><td>Este sitio</td><td>Recordar si prefieres el tema claro u oscuro. Es una preferencia que tú eliges.</td><td>Hasta que lo borres</td><td>Yo</td></tr>
<tr><th scope="row"><code>landing-express-borrador</code></th><td>Formulario «Arma tu Landing Express»</td><td>Guardar tu avance en <strong>tu navegador</strong>, para que no lo pierdas. <strong>No se envía a ningún servidor.</strong></td><td>Hasta que lo borres</td><td>Yo</td></tr>
<tr><th scope="row">Verificación de Cloudflare Turnstile</th><td>Solo al enviar tu pedido</td><td>Comprobar que eres una persona y no un robot (seguridad).</td><td>Lo define Cloudflare</td><td>Cloudflare, tercero</td></tr>
<tr><th scope="row">Datos de conexión del alojamiento</th><td>GitHub Pages y Surge</td><td>Entregarte el sitio (por ejemplo, tu IP y tu navegador).</td><td>Según sus políticas</td><td>GitHub y Surge, terceros</td></tr>
</tbody>
</table>
</div>
<p><strong>No instalo cookies de seguimiento propias.</strong> Cloudflare Turnstile se carga <strong>solo en el paso final del formulario</strong>, no al entrar al sitio.</p>

<h2>3. Lo que no uso hoy</h2>
<p>Analítica de visitas, publicidad o remarketing, píxeles de redes sociales, botones de «compartir» incrustados, mapas ni videos de terceros incrustados.</p>

<h2>4. Lo que podría usar mañana (siempre con tu aceptación)</h2>
<p>Si activo la <strong>medición de anuncios</strong> (por ejemplo el píxel de Meta) o <strong>analítica</strong>, actualizaré esta política <strong>antes</strong> y verás un aviso con tres opciones: <strong>Aceptar</strong>, <strong>Rechazar</strong> y <strong>Configurar</strong>. Mientras no aceptes esas categorías, <strong>no se carga ningún script de ese tipo</strong>. Rechazar no te quita nada del servicio. Tu decisión se guardaría en tu navegador (categorías, fecha y versión) y caducaría a los 12 meses o si esta política cambia.</p>

<h2>5. Cómo cambiar o retirar tu decisión</h2>
<ul>
<li>Desde tu navegador, en <strong>Configuración → Privacidad → Borrar datos de sitios</strong>, puedes eliminar el almacenamiento de este sitio en cualquier momento. Si borras <code>landing-express-borrador</code>, pierdes el avance de tu formulario; si borras <code>theme</code>, el sitio vuelve al tema de tu sistema.</li>
<li>Puedes bloquear las cookies de terceros en tu navegador; el formulario podría no poder verificar que eres una persona.</li>
<li>Cuando exista aceptación de categorías opcionales, podrás cambiarla desde «Preferencias de cookies» en el pie de cada página.</li>
</ul>

<h2>6. Terceros</h2>
<ul>
<li><strong>Cloudflare (Turnstile):</strong> consulta su política de privacidad en cloudflare.com.</li>
<li><strong>GitHub y Surge:</strong> alojan el sitio; consulta sus políticas.</li>
<li><strong>Meta:</strong> solo si activo el píxel y tú lo aceptas.</li>
</ul>

<h2>7. Cambios</h2>
<p>Si esta política cambia, la publicaré aquí con una nueva fecha. Si agrego algo opcional, te pediré aceptación otra vez. Para más sobre tus datos personales, lee mi <a href="../privacidad/">aviso de privacidad</a>.</p>
`,
};
