// Política de cookies y almacenamiento. Texto estático: scripts/render-legal.mjs arma la página.
// Debe coincidir con lo que el sitio y el formulario realmente guardan (la prueba tests/legal.test.mjs revisa las claves).

export const cookies = {
  slug: 'cookies',
  eyebrow: 'Cookies y almacenamiento',
  title: 'Política de cookies',
  word: 'cookies',
  description: 'Qué guarda este sitio en tu navegador, para qué, por cuánto tiempo y cómo cambiarlo. La medición de anuncios (píxel de Meta) solo se activa si tú la aceptas.',
  updated: '17 de noviembre de 2026',
  lead: 'Te cuento exactamente qué guarda este sitio en tu navegador. Lo necesario es muy poco; la medición de anuncios solo se activa si tú la aceptas.',
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
<tr><th scope="row"><code>tagorq_consent</code></th><td>Este sitio</td><td>Recordar tu decisión sobre las cookies opcionales: qué aceptaste, cuándo y con qué versión de esta política.</td><td>12 meses, o hasta que esta política cambie</td><td>Yo</td></tr>
<tr><th scope="row"><code>_fbp</code> y <code>_fbc</code></th><td>Este sitio (cookies de Meta)</td><td>Identificar tu navegador y, si llegas desde un anuncio, ese clic, para medir si mis anuncios funcionan. <strong>Solo existen si aceptas la medición de anuncios.</strong></td><td>Hasta 3 meses</td><td>Meta, tercero</td></tr>
<tr><th scope="row">Verificación de Cloudflare Turnstile</th><td>Solo al enviar tu pedido</td><td>Comprobar que eres una persona y no un robot (seguridad).</td><td>Lo define Cloudflare</td><td>Cloudflare, tercero</td></tr>
<tr><th scope="row">Datos de conexión del alojamiento</th><td>GitHub Pages y Surge</td><td>Entregarte el sitio (por ejemplo, tu IP y tu navegador).</td><td>Según sus políticas</td><td>GitHub y Surge, terceros</td></tr>
</tbody>
</table>
</div>
<p><strong>No instalo cookies de seguimiento propias.</strong> Las únicas de seguimiento son las de <strong>Meta</strong> (<code>_fbp</code> y <code>_fbc</code>), y <strong>solo después de que aceptes la medición de anuncios</strong>. Cloudflare Turnstile se carga <strong>solo en el paso final del formulario</strong>, no al entrar al sitio.</p>

<h2>3. Lo que no uso hoy</h2>
<p>Analítica de visitas, píxeles de plataformas distintas de Meta (Google, TikTok y otras), botones de «compartir» incrustados ni mapas.</p>

<h2>4. La medición de anuncios (píxel de Meta), siempre con tu aceptación</h2>
<p>Uso el <strong>píxel de Meta</strong> para saber si mis anuncios funcionan. Al entrar al sitio verás un aviso con tres opciones de igual peso: <strong>Aceptar</strong>, <strong>Rechazar</strong> y <strong>Configurar</strong>, y nada viene premarcado. Mientras no aceptes la <strong>medición de anuncios</strong>, <strong>no se carga el píxel ni se envía nada a Meta</strong>. Rechazar no te quita nada del sitio.</p>
<p>Si aceptas, Meta recibe datos de tu visita: las páginas que ves, tus clics en WhatsApp, correo o teléfono, datos técnicos de tu navegador y tu IP, junto con los identificadores de sus cookies. Meta los trata conforme a su política de privacidad (sus servidores están, entre otros lugares, en Estados Unidos). Hoy la medición de anuncios es la única categoría opcional que existe. Tu decisión se guarda en tu navegador (categorías, fecha y versión) y caduca a los 12 meses o si esta política cambia.</p>

<h2>5. Cómo cambiar o retirar tu decisión</h2>
<ul>
<li>Desde tu navegador, en <strong>Configuración → Privacidad → Borrar datos de sitios</strong>, puedes eliminar el almacenamiento de este sitio en cualquier momento. Si borras <code>landing-express-borrador</code>, pierdes el avance de tu formulario; si borras <code>theme</code>, el sitio vuelve al tema de tu sistema.</li>
<li>Puedes bloquear las cookies de terceros en tu navegador; el formulario podría no poder verificar que eres una persona.</li>
<li>Puedes cambiar o retirar tu decisión cuando quieras desde <strong>«Preferencias de cookies»</strong>, en el pie de cada página. También puedes borrar <code>tagorq_consent</code> y las cookies <code>_fbp</code> y <code>_fbc</code> desde tu navegador; si borras tu decisión, el aviso vuelve a aparecer.</li>
</ul>

<h2>6. Terceros</h2>
<ul>
<li><strong>Cloudflare (Turnstile):</strong> consulta su política de privacidad en cloudflare.com.</li>
<li><strong>GitHub y Surge:</strong> alojan el sitio; consulta sus políticas.</li>
<li><strong>Meta (píxel):</strong> solo si aceptas la medición de anuncios; consulta su política de privacidad en facebook.com/privacy/policy.</li>
</ul>

<h2>7. Cambios</h2>
<p>Si esta política cambia, la publicaré aquí con una nueva fecha. Si agrego algo opcional, te pediré aceptación otra vez. Para más sobre tus datos personales, lee mi <a href="../privacidad/">aviso de privacidad</a>.</p>
`,
};
