// Contenido de la guía de dominio y hosting (lexmendoza.com/guia-dominio-hosting/). Es un texto de ayuda, sin precios ni capturas de nadie.
// El HTML se genera con `npm run guia` (scripts/render-guia.mjs); no se edita guia-dominio-hosting/index.html a mano.
// Los capítulos llevan su HTML aquí, igual que las páginas legales. Si cambias un texto, vuelve a generar.

export const GUIA_SLUG = 'guia-dominio-hosting';

const WA = '528129043592';
export const guiaWhatsapp = (mensaje) => `https://wa.me/${WA}?text=${encodeURIComponent(mensaje)}`;

// Iconos de linea del sitio (mascara CSS, siempre decorativos: el texto dice lo mismo). Ver src/scss/0-settings/_icons.scss.
const ico = (nombre) => `<span class="c-icon c-icon--${nombre}" aria-hidden="true"></span>`;

// Tarjetas: un helper para no repetir el marcado.
const card = (titulo, texto, extra = '', icono = '') => `<article class="c-guia__card">${icono ? `<span class="c-guia__icono">${ico(icono)}</span>` : ''}<h3>${titulo}</h3><p>${texto}</p>${extra}</article>`;
// Tarjeta de una forma de armar el sitio: un pictograma de lo que ES (no el logotipo de nadie) y una etiqueta corta.
const plat = (titulo, etiqueta, texto, icono) => `<article class="c-guia__card c-guia__card--plat"><span class="c-guia__marca">${ico(icono)}</span><h3>${titulo}</h3><p class="c-guia__etiqueta">${etiqueta}</p><p>${texto}</p></article>`;
const cards = (n, items) => `<div class="c-guia__tarjetas c-guia__tarjetas--${n}">${items.join('')}</div>`;
const nota = (texto, icono = 'alert') => `<p class="c-guia__nota c-guia__nota--ico">${ico(icono)}<span>${texto}</span></p>`;
// Subtitulo con su icono: ayuda a encontrar cada tema al hojear.
const h3 = (texto, icono) => `<h3 class="c-guia__h3">${ico(icono)}<span>${texto}</span></h3>`;

const SVG_CASA = `<figure class="c-guia__figura c-guia__figura--estrecha">
  <svg class="c-guia__svg" viewBox="0 0 420 270" role="img" aria-labelledby="f0t f0d">
    <title id="f0t">Una casa para explicar el dominio, el hosting, el DNS y el HTTPS</title>
    <desc id="f0d">El dominio es la dirección de la casa, el hosting es la casa, el DNS es el mapa que lleva hasta ella y el HTTPS es la cerradura.</desc>
    <rect class="caja" x="8" y="8" width="196" height="118"/><path class="marca" d="M3 11V3H11 M201 3H209V11 M209 123V131H201 M11 131H3V123"/>
    <g class="trazo" transform="translate(22 24)"><path d="M30 4l15 18-15 28-15-28z"/><path d="M26 18h8v8h-8z"/></g>
    <text class="t" x="90" y="50">Dominio</text><text class="t2" x="90" y="74">la dirección</text><text class="t2" x="90" y="96">de la casa</text>

    <rect class="caja caja--acc" x="216" y="8" width="196" height="118"/><path class="marca marca--acc" d="M211 11V3H219 M409 3H417V11 M417 123V131H409 M219 131H211V123"/>
    <g class="trazo" transform="translate(228 22)"><path d="M10 38l22-20 22 20M16 34v26h32V34"/><path d="M32 60V46h8v14"/></g>
    <text class="t" x="298" y="50">Hosting</text><text class="t2" x="298" y="74">la casa donde</text><text class="t2" x="298" y="96">vive tu sitio</text>

    <rect class="caja" x="8" y="140" width="196" height="118"/><path class="marca" d="M3 143V135H11 M201 135H209V143 M209 255V263H201 M11 263H3V255"/>
    <g class="trazo" transform="translate(20 154)"><path d="M10 18l16-6 16 6 16-6v42l-16 6-16-6-16 6z"/><path d="M26 12v42M42 18v42"/></g>
    <text class="t" x="90" y="182">DNS</text><text class="t2" x="90" y="206">el mapa que</text><text class="t2" x="90" y="228">lleva a ella</text>

    <rect class="caja" x="216" y="140" width="196" height="118"/><path class="marca" d="M211 143V135H219 M409 135H417V143 M417 255V263H409 M219 263H211V255"/>
    <g class="trazo" transform="translate(228 156)"><rect x="12" y="26" width="38" height="28"/><path d="M20 26V14h22v12"/><path d="M29 38h4v6h-4z"/></g>
    <text class="t" x="298" y="182">HTTPS</text><text class="t2" x="298" y="206">la cerradura:</text><text class="t2" x="298" y="228">visita segura</text>
  </svg>
  <figcaption>Si piensas en una casa, todo lo de abajo se vuelve más fácil.</figcaption>
</figure>`;

const SVG_CAMINO = `<figure class="c-guia__figura c-guia__figura--estrecha">
  <svg class="c-guia__svg" viewBox="0 0 420 336" role="img" aria-labelledby="f1t f1d">
    <title id="f1t">Cómo llega una persona a tu sitio</title>
    <desc id="f1d">Una persona escribe tu dirección; el DNS le dice dónde vive tu sitio; el hosting entrega el sitio.</desc>
    <defs><marker id="pta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="punta" d="M0 0 10 5 0 10z"/></marker></defs>

    <rect class="caja" x="20" y="10" width="380" height="76"/><path class="marca" d="M15 13V5H23 M397 5H405V13 M405 83V91H397 M23 91H15V83"/>
    <rect class="trazo" x="46" y="24" width="26" height="46"/><line class="trazo" x1="55" y1="62" x2="63" y2="62"/>
    <text class="t" x="96" y="44">Una persona</text>
    <text class="t2" x="96" y="68">escribe tunegocio.com</text>

    <line class="flecha" x1="210" y1="90" x2="210" y2="124" marker-end="url(#pta)"/>
    <text class="t2" x="226" y="112">¿dónde vive ese sitio?</text>

    <rect class="caja caja--acc" x="20" y="130" width="380" height="76"/><path class="marca marca--acc" d="M15 133V125H23 M397 125H405V133 M405 203V211H397 M23 211H15V203"/>
    <rect class="trazo" x="44" y="148" width="30" height="40"/><line class="trazo" x1="51" y1="160" x2="67" y2="160"/><line class="trazo" x1="51" y1="170" x2="67" y2="170"/><line class="trazo" x1="51" y1="180" x2="61" y2="180"/>
    <text class="t" x="96" y="164">DNS</text>
    <text class="t2" x="96" y="188">la libreta de direcciones</text>

    <line class="flecha" x1="210" y1="210" x2="210" y2="244" marker-end="url(#pta)"/>
    <text class="t2" x="226" y="232">«en este servidor»</text>

    <rect class="caja" x="20" y="250" width="380" height="76"/><path class="marca" d="M15 253V245H23 M397 245H405V253 M405 323V331H397 M23 331H15V323"/>
    <rect class="trazo" x="42" y="264" width="36" height="18"/><rect class="trazo" x="42" y="288" width="36" height="18"/>
    <rect class="punta" x="47.5" y="270.5" width="5" height="5"/><rect class="punta" x="47.5" y="294.5" width="5" height="5"/>
    <text class="t" x="96" y="284">Hosting</text>
    <text class="t2" x="96" y="308">aquí vive tu sitio y se entrega</text>
  </svg>
  <figcaption>El dominio es tu dirección; el DNS dice dónde está; el hosting es la casa.</figcaption>
</figure>`;

const SVG_DNS = `<figure class="c-guia__figura">
  <svg class="c-guia__svg f3" viewBox="0 0 600 300" role="img" aria-labelledby="f3t f3d">
    <title id="f3t">Dónde se edita el DNS según los servidores de nombres</title>
    <desc id="f3d">A la izquierda, los servidores de nombres siguen en el registrador y ahí se editan los registros. A la derecha, se cambian al hosting y los registros se editan allá; el DNS del registrador deja de mandar.</desc>
    <defs><marker id="ptb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="punta" d="M0 0 10 5 0 10z"/></marker></defs>

    <text class="t3" x="10" y="26">CAMINO A</text>
    <text class="t" x="10" y="52">DNS en el registrador</text>
    <rect class="caja caja--acc" x="10" y="72" width="270" height="74"/><path class="marca marca--acc" d="M5 75V67H13 M277 67H285V75 M285 143V151H277 M13 151H5V143"/>
    <text class="t" x="26" y="102">Registrador</text>
    <text class="t2" x="26" y="128">aquí editas los registros</text>
    <line class="flecha" x1="145" y1="150" x2="145" y2="178" marker-end="url(#ptb)"/>
    <rect class="caja" x="10" y="182" width="270" height="74"/><path class="marca" d="M5 185V177H13 M277 177H285V185 M285 253V261H277 M13 261H5V253"/>
    <text class="t" x="26" y="212">Hosting</text>
    <text class="t2" x="26" y="238">solo te da los datos</text>

    <text class="t3" x="320" y="26">CAMINO B</text>
    <text class="t" x="320" y="52">DNS en el hosting</text>
    <rect class="caja" x="320" y="72" width="270" height="74"/><path class="marca" d="M315 75V67H323 M587 67H595V75 M595 143V151H587 M323 151H315V143"/>
    <text class="t" x="336" y="102">Registrador</text>
    <text class="t2" x="336" y="128">solo guarda el dominio</text>
    <line class="flecha" x1="455" y1="150" x2="455" y2="178" marker-end="url(#ptb)"/>
    <rect class="caja caja--acc" x="320" y="182" width="270" height="74"/><path class="marca marca--acc" d="M315 185V177H323 M587 177H595V185 M595 253V261H587 M323 261H315V253"/>
    <text class="t" x="336" y="212">Hosting</text>
    <text class="t2" x="336" y="238">aquí editas los registros</text>

    <text class="t2" x="10" y="288">Resalté (en rojo) el lugar donde se edita en cada camino.</text>
  </svg>
  <figcaption>Si cambias los servidores de nombres al hosting (camino B), los registros que tengas en el registrador dejan de contar.</figcaption>
</figure>`;

export const guia = {
  slug: GUIA_SLUG,
  title: 'Guía de dominio y hosting',
  description: 'Qué son el dominio, el hosting y el DNS, qué conviene comprar, qué evitar y cómo conectar tu sitio paso a paso. Gratis, sin precios y sin letra chica.',
  hero: {
    eyebrow: 'Guía gratis · dominio y hosting',
    titulo: 'Dominio y hosting,',
    palabra: 'sin misterio',
    lead: 'Soy Lex. Esta guía es gratis, sin letra chica y no te vende nada: son las cosas que me gustaría que supiera cualquiera antes de pagar. Está pensada para alguien que nunca ha hecho esto. Si algo no queda claro, escríbeme por WhatsApp y te ayudo.',
    aviso: '<strong>Verifica siempre en el sitio oficial.</strong> Los precios, promociones y pasos de cada proveedor cambian seguido, y sus paneles se ven distintos de un año a otro. Por eso aquí no hay cifras ni capturas de pantalla de nadie: te enseño qué mirar y por qué, con dibujos propios.',
    actualizada: 'Actualizada en noviembre de 2026',
  },
  cinta: ['Dominio', 'Hosting', 'DNS', 'HTTPS', 'Registrador', 'Servidores de nombres', 'Propagación', 'Correo con tu dominio'],
  capitulos: [
    {
      id: 'idea',
      icono: 'globe',
      nav: 'La idea',
      titulo: 'La idea completa en una imagen',
      corto: 'Qué pasa cuando alguien escribe tu dirección.',
      encorto: 'Tu dominio es la dirección, el hosting es la casa y el DNS es el mapa que une las dos.',
      html: `<p>Cuando alguien escribe tu dirección en su celular, pasan tres cosas en una fracción de segundo. Entender este camino te sirve para casi todo lo demás de la guía.</p>
${SVG_CAMINO}
${h3('Y si lo piensas como una casa', 'home')}
<p>Cuatro palabras que suenan técnicas y que en realidad son de la vida diaria:</p>
${SVG_CASA}`,
    },
    {
      id: 'basico',
      icono: 'book',
      nav: 'Lo básico',
      titulo: 'Lo básico en un minuto',
      corto: 'Seis palabras que vas a ver en todos lados.',
      encorto: 'Casi todo el misterio es vocabulario. Con estas seis palabras ya lees cualquier panel.',
      html: cards(2, [
        card('Dominio', 'Tu dirección en internet, como <em>tunegocio.com</em>. Se renta a un registrador y se renueva cada año.', '', 'globe'),
        card('Registrador', 'La tienda donde compras y administras el dominio. Es independiente del hosting: puedes comprar el dominio en un lugar y publicar el sitio en otro.', '', 'tag'),
        card('Hosting', 'El lugar donde vive tu sitio para que cualquiera lo abra a cualquier hora. En Wix y Squarespace va incluido en tu plan.', '', 'server'),
        card('DNS', 'La libreta que le dice al mundo «este dominio vive en este hosting». Conectar tu dominio es, sobre todo, editar esa libreta.', '', 'book'),
        card('HTTPS', 'El candado del navegador. Cifra la conexión y da confianza; hoy es obligatorio para que no marque «no seguro». Casi todos los hostings y plataformas lo activan sin costo extra: confírmalo.', '', 'lock'),
        card('Correo con tu dominio', 'Direcciones como <em>hola@tunegocio.com</em>. Es un servicio aparte del sitio: se configura con un tipo de registro DNS llamado MX (más abajo).', '', 'mail'),
      ]),
    },
    {
      id: 'direccion',
      icono: 'link',
      nav: 'Tu dirección',
      titulo: 'Tu dirección: cómo se lee y cómo elegirla',
      corto: 'Las partes de una dirección y las reglas antes de pagar.',
      encorto: 'Compra el dominio a tu nombre, mira la renovación y no aceptes extras que no pediste.',
      html: `${h3('Cómo se lee una dirección', 'link')}
<p>Una dirección parece un solo bloque, pero tiene partes. La que importa, y la que compras, es la tercera.</p>
<div class="c-guia__url" role="img" aria-label="https://www.tunegocio.com.mx/promo dividida en protocolo, subdominio, dominio, extensión y ruta">
  <div class="s1"><code>https://</code><small>protocolo<br>(el candado)</small></div>
  <div class="s2"><code>www.</code><small>subdominio<br>(opcional)</small></div>
  <div class="s3"><code>tunegocio</code><small>tu dominio<br>(tu marca)</small></div>
  <div class="s4"><code>.com.mx</code><small>extensión<br>(.com, .mx…)</small></div>
  <div class="s5"><code>/promo</code><small>ruta<br>(una página)</small></div>
</div>
<p>Si sabes cómo se llama cada parte, los paneles de DNS dejan de intimidar: casi siempre piden «el nombre» (tu dominio o un subdominio como <em>www</em>) y «el valor» (a dónde apunta).</p>

${h3('Antes de comprar: las reglas que sí se mantienen', 'lock')}
<ol class="c-guia__reglas">
  <li><strong>El dominio va a tu nombre, en tu cuenta.</strong> Nunca en la cuenta de otra persona, aunque te lo ofrezca como favor: si algún día se pierde la relación, se pierde tu dirección.</li>
  <li><strong>Mira el precio de renovación</strong> antes de pagar. Muchas ofertas son del primer año y la renovación cuesta bastante más.</li>
  <li><strong>No compres extras</strong> que el registrador ofrece al final (correo, «protección», sitio web, seguros). Casi nunca los necesitas.</li>
  <li><strong>Activa la privacidad del dominio</strong> para que tus datos no queden públicos, y la <strong>renovación automática</strong> para no perderlo por un descuido.</li>
  <li><strong>Activa la verificación en dos pasos</strong> y guarda tus accesos en un gestor de contraseñas.</li>
  <li><strong>Usa un correo tuyo y que revises.</strong> Ahí llegan los avisos de renovación y de recuperación de cuenta; si es un correo que ya no usas, el aviso se pierde.</li>
  <li><strong>Elige un nombre corto</strong>, fácil de decir y de escribir, sin guiones ni números. <em>.com</em> si buscas alcance general; <em>.mx</em> o <em>.com.mx</em> si tu público es local.</li>
</ol>

${h3('Cómo revisar un nombre antes de enamorarte de él', 'search')}
<ul class="c-guia__lista">
  <li><strong>Que esté libre:</strong> cualquier registrador te lo dice al buscarlo. Para ver de quién es uno ya ocupado, usa el buscador público <a href="https://lookup.icann.org" rel="noopener">lookup.icann.org</a>.</li>
  <li><strong>Que no se parezca demasiado a otra marca.</strong> Si es muy parecido al nombre de un negocio conocido, mejor otro: puedes tener problemas más adelante.</li>
  <li><strong>Que lo puedas decir por teléfono</strong> sin deletrearlo. Si cuesta trabajo dictarlo, cuesta trabajo recordarlo.</li>
  <li><strong>Que tus redes se puedan llamar igual</strong> (o muy parecido), para que todo se vea como una sola marca.</li>
</ul>`,
    },
    {
      id: 'contratar',
      icono: 'tag',
      nav: 'Contratar',
      titulo: 'Dónde se contrata cada cosa y qué cuesta',
      corto: 'Tres formas de juntar dominio y sitio, y qué pide cada plataforma.',
      encorto: 'Dominio en tu propia cuenta y hosting aparte: así el dominio siempre es tuyo, cambies lo que cambies.',
      html: `<p>Hay tres formas comunes de juntar dominio y sitio. Ninguna es la correcta para todos:</p>
${cards(3, [
  card('Todo en la plataforma', 'Wix o Squarespace: pagas un plan y el alojamiento va incluido; el dominio lo compras ahí o lo conectas.', '<p><strong>Ventaja:</strong> menos piezas.<br><strong>Cuidado:</strong> si te vas, mover el sitio es más trabajo.</p>', 'layers'),
  card('Registrador + hosting', 'Compras el dominio en un lugar y el hosting en otro, y los conectas con el DNS.', '<p><strong>Ventaja:</strong> eliges cada pieza y cambias una sin tocar la otra.<br><strong>Cuidado:</strong> hay que conectarlas bien.</p>', 'link'),
  card('Hosting que incluye dominio', 'Algunos hostings regalan el dominio el primer año si contratas su plan.', '<p><strong>Ventaja:</strong> cómodo al inicio.<br><strong>Cuidado:</strong> revisa a nombre de quién queda y cuánto cuesta renovarlo.</p>', 'server'),
])}
<p>Mi recomendación general: el <strong>dominio en tu propia cuenta de un registrador</strong> y el hosting o la plataforma aparte. Así el dominio siempre es tuyo, aunque cambies de proveedor.</p>

${h3('Qué necesitas según cómo armemos tu sitio', 'code')}
${cards(2, [
  plat('Código a la medida', 'Hecho a mano', 'Dominio y un hosting donde publicar (hay opciones gratuitas para sitios estáticos, como <a href="https://docs.github.com/pages" rel="noopener">GitHub Pages</a>). Sin mensualidad de plataforma.', 'code'),
  plat('Wix', 'Arrastrar y soltar', 'Tu plan de Wix (incluye alojamiento) y tu dominio, o el que ofrece el plan. <a href="https://support.wix.com" rel="noopener">Ayuda oficial de Wix</a>.', 'cursor'),
  plat('Squarespace', 'Plantillas de diseño', 'Tu plan de Squarespace (incluye alojamiento) y tu dominio. <a href="https://support.squarespace.com" rel="noopener">Ayuda oficial de Squarespace</a>.', 'layout'),
  plat('WordPress', 'Editor de bloques', 'Un hosting para WordPress y tu dominio. Pide más mantenimiento: actualizaciones y copias de respaldo. <a href="https://wordpress.org/hosting/" rel="noopener">Qué pide WordPress.org</a>.', 'blocks'),
])}

${h3('Los costos que debes contemplar', 'tag')}
<ul class="c-guia__lista">
  <li><strong>Una vez:</strong> mi trabajo de armar tu sitio, que te confirmo por WhatsApp antes de que pagues.</li>
  <li><strong>Cada año:</strong> el dominio (y su renovación).</li>
  <li><strong>Cada mes o cada año:</strong> tu hosting o tu plan de plataforma, según lo que elijas.</li>
  <li><strong>Opcional:</strong> la publicación asistida, un costo extra que te confirmo en tu pedido.</li>
  <li><strong>Si quieres correo con tu dominio:</strong> es un servicio aparte, normalmente por usuario y por mes.</li>
</ul>`,
    },
    {
      id: 'conectar',
      icono: 'server',
      nav: 'Conectar',
      titulo: 'Cómo se conecta, paso a paso',
      corto: 'Del dominio comprado al sitio funcionando: DNS, registros y propagación.',
      encorto: 'Conectar es editar la libreta (DNS) en el lugar correcto, copiar los valores exactos y esperar a que se propague.',
      html: `<ol class="c-guia__recorrido">
  <li><strong>Compra el dominio</strong> en tu cuenta y activa privacidad, renovación automática y verificación en dos pasos.</li>
  <li><strong>Ten listo tu hosting o tu plan de plataforma.</strong> Ahí te dan los datos que vas a necesitar: una o varias direcciones, o los servidores de nombres.</li>
  <li><strong>Apunta el dominio a tu sitio.</strong> En el panel del registrador se editan los registros DNS (o los servidores de nombres), con los datos que te dio tu hosting o plataforma.</li>
  <li><strong>Espera la propagación:</strong> de unos minutos a 24 o 48 horas.</li>
  <li><strong>Activa HTTPS</strong> y la redirección entre la versión con <em>www</em> y la que no lo lleva.</li>
  <li><strong>Revisa:</strong> ábrelo desde tu celular con datos móviles, con y sin <em>www</em>, y compártelo por WhatsApp para ver cómo se ve la vista previa.</li>
</ol>
<p>Si prefieres no tocar nada de esto, la <strong>publicación asistida</strong> existe para eso: conecto tu dominio y verifico que quede funcionando. Cómo lo hacemos sin que me des tus contraseñas está en el capítulo siguiente.</p>

${h3('La decisión que más confunde: ¿dónde edito el DNS?', 'alert')}
<p>El DNS solo se edita en <strong>un</strong> lugar: el que esté marcado como «servidores de nombres» (nameservers) de tu dominio. Hay dos caminos:</p>
${SVG_DNS}
<p>Cuál es mejor depende de tu proveedor: algunos piden un camino y otros el otro. Lo importante es <strong>no editar en el lugar equivocado</strong>: es el error más común (y por eso a veces «hiciste todo bien» y no pasa nada).</p>

${h3('Los registros DNS que vas a ver', 'book')}
<p>En el panel de DNS aparece una tabla. Solo necesitas reconocer cinco tipos:</p>
<div class="c-guia__tabla" role="region" aria-label="Tabla de tipos de registro DNS" tabindex="0">
  <table>
    <thead><tr><th>Tipo</th><th>Para qué sirve</th><th>Ejemplo de valor</th></tr></thead>
    <tbody>
      <tr><td><code>A</code></td><td>Apunta tu dominio a un servidor por su dirección numérica (IPv4).</td><td><code>192.0.2.10</code></td></tr>
      <tr><td><code>AAAA</code></td><td>Lo mismo, con direcciones IPv6 (más largas).</td><td><code>2001:db8::10</code></td></tr>
      <tr><td><code>CNAME</code></td><td>Hace que un subdominio (como <em>www</em>) sea un alias de otro nombre.</td><td><code>usuario.github.io</code></td></tr>
      <tr><td><code>TXT</code></td><td>Guarda un texto. Se usa para verificar que el dominio es tuyo (Google, Meta…).</td><td><code>google-site-verification=…</code></td></tr>
      <tr><td><code>MX</code></td><td>Dice a dónde se entrega el correo del dominio.</td><td><code>10 mail.tuproveedor.com</code></td></tr>
    </tbody>
  </table>
</div>
<p class="c-guia__desliza" aria-hidden="true">↔ Desliza la tabla de lado para verla completa.</p>
<p>Los valores de la tabla son ficticios, de ejemplo: <strong>los reales te los da tu hosting o tu plataforma</strong>, y hay que copiarlos exactos (sin espacios al final ni punto de más).</p>
${nota('<strong>Cuidado con el correo.</strong> Si tu dominio ya tiene correo funcionando, antes de cambiar servidores de nombres (camino B) anota o copia sus registros MX: si no los llevas al nuevo lugar, el correo deja de llegar.')}

${h3('Propagación y cómo comprobar que quedó', 'clock')}
<p>Cuando cambias un registro, el cambio no se ve en todo el mundo al mismo tiempo: cada red guarda una copia (caché) durante cierto tiempo, llamado TTL. Por eso tarda: de minutos a 48 horas, casi siempre menos de una hora. Mientras tanto puede abrir en tu casa y no en la de tu amigo, y eso es normal.</p>
<ul class="c-guia__lista">
  <li><strong>Del dominio:</strong> en <a href="https://lookup.icann.org" rel="noopener">lookup.icann.org</a> ves a nombre de quién está y cuándo vence.</li>
  <li><strong>Del DNS:</strong> en <a href="https://dnschecker.org" rel="noopener">dnschecker.org</a> ves si el registro ya cambió en distintas partes del mundo.</li>
  <li><strong>Del candado:</strong> en <a href="https://www.ssllabs.com/ssltest/" rel="noopener">ssllabs.com/ssltest</a> ves si el HTTPS está bien puesto.</li>
</ul>
<p>Y si te gusta la terminal, esto te dice a dónde apunta tu dominio (cambia <em>tunegocio.com</em> por el tuyo): <code>nslookup tunegocio.com</code></p>

${h3('Con o sin <em>www</em>', 'globe')}
<p>Tu sitio puede abrir como <em>tunegocio.com</em> o como <em>www.tunegocio.com</em>. Son direcciones distintas y las dos deberían llevar al mismo lugar. Lo ideal es elegir <strong>una</strong> como principal y que la otra la <strong>redirija</strong>: así Google no las cuenta como dos sitios y todos ven lo mismo. La mayoría de las plataformas lo hacen sola una vez que conectas el dominio; en un sitio de código se configura al publicar.</p>`,
    },
    {
      id: 'contrasenas',
      icono: 'key',
      nav: 'Sin contraseñas',
      titulo: 'Cómo te ayudo sin pedirte tus contraseñas',
      corto: 'Tres formas de darme acceso, y una mini guía para crear cada una.',
      encorto: 'Nunca te pido tus contraseñas. Lo haces tú con mi guía, o me das un acceso propio y temporal que tú creas y quitas.',
      html: `<p>No te pido tus contraseñas ni las guardo, nunca. Cuando necesito entrar a algo tuyo, hay tres formas, de la más segura a la menos:</p>
<ol class="c-guia__recorrido">
  <li><strong>Lo haces tú y yo te guío.</strong> Videollamada con pantalla compartida: tú tecleas, yo te dicto cada paso, y al terminar no queda ningún acceso que quitar.</li>
  <li><strong>Me das un acceso propio y temporal.</strong> Me invitas con mi correo como colaborador (<a href="https://support.wix.com/en/article/wix-app-inviting-and-managing-collaborators" rel="noopener">Wix</a>, <a href="https://support.squarespace.com/hc/en-us/articles/206537297" rel="noopener">Squarespace</a>), me creas un usuario (<a href="https://wordpress.org/documentation/article/users-add-new-screen/" rel="noopener">WordPress</a>) o me delegas acceso en el registrador o el hosting (por ejemplo, el <a href="https://www.godaddy.com/es/help/que-es-el-acceso-delegado-12378" rel="noopener">acceso delegado de GoDaddy</a>). Entro con mi cuenta y mi verificación en dos pasos, y tú me quitas cuando terminemos.</li>
  <li><strong>Último recurso:</strong> si una plataforma no permite invitados, me compartes la contraseña con un enlace de un solo uso que caduca (<a href="https://bitwarden.com/es-la/help/about-send/" rel="noopener">Bitwarden Send</a> o <a href="https://support.1password.com/share-items/" rel="noopener">1Password</a>), la cambias al terminar y nunca me la mandas por WhatsApp ni por correo.</li>
</ol>
${nota('<strong>Antes de entrar</strong> te mando por escrito qué voy a hacer, en qué cuenta y hasta cuándo, y esperas a responder «acepto». <strong>Al terminar,</strong> revoca mi acceso y cambia tus contraseñas. La cuenta, el dominio y el sitio son tuyos en todo momento.', 'shield')}

${h3('Mini guía: cómo crear cada acceso', 'key')}
<p>Los menús cambian de un año a otro y según tu idioma: si algo no se llama igual, busca la palabra parecida («colaboradores», «permisos», «usuarios», «acceso delegado»). Dame siempre el <strong>rol más bajo que alcance</strong>: para tocar solo el contenido basta un rol de editor; para conectar el dominio o ver la facturación hace falta uno de administrador.</p>
<div class="c-promo__faq c-guia__faq c-guia__mini">
  <details class="c-promo__pregunta"><summary>Wix: invitarme como colaborador</summary>
    <div class="c-guia__mini-cuerpo">
      <ol class="c-guia__recorrido">
        <li>Abre tu sitio en la app de Wix y toca <strong>Administrar</strong>.</li>
        <li>Entra a <strong>Configuración</strong> y luego a <strong>Roles y permisos</strong> (<em>Roles &amp; Permissions</em>).</li>
        <li>Toca <strong>Colaboradores</strong> y después <strong>Invitar a otros</strong> (<em>+ Invite Others</em>).</li>
        <li>Escribe mi correo y elige un <strong>rol</strong>. Toca <strong>Enviar</strong>.</li>
      </ol>
      <p><strong>Ojo:</strong> solo el propietario y los administradores (copropietarios) pueden invitar. <strong>Para quitarme:</strong> Colaboradores → «Más acciones» junto a mi nombre → Quitar (Wix no avisa a quien se quita). <a href="https://support.wix.com/en/article/wix-app-inviting-and-managing-collaborators" rel="noopener">Ayuda oficial de Wix</a> (en inglés).</p>
    </div>
  </details>
  <details class="c-promo__pregunta"><summary>Squarespace: invitarme como colaborador</summary>
    <div class="c-guia__mini-cuerpo">
      <ol class="c-guia__recorrido">
        <li>Entra a tu sitio, abre <strong>Configuración</strong> y luego <strong>Permisos</strong> (<em>Permissions</em>).</li>
        <li>Elige <strong>Invitar colaborador</strong> (<em>Invite Contributor</em>).</li>
        <li>Escribe mi nombre y mi correo, y marca los permisos que quieres darme.</li>
        <li>Pulsa <strong>Invitar</strong>. Yo acepto desde el correo; mientras no lo acepte aparece como invitación enviada.</li>
      </ol>
      <p><strong>Ojo:</strong> solo el propietario y los administradores pueden invitar, y los límites de colaboradores dependen de tu plan. <strong>Para quitarme:</strong> en la misma pantalla de Permisos, eliminas mi nombre. Aquí están los <a href="https://support.squarespace.com/hc/en-us/articles/206537297" rel="noopener">roles y permisos de Squarespace</a> (en inglés).</p>
    </div>
  </details>
  <details class="c-promo__pregunta"><summary>WordPress: crearme un usuario</summary>
    <div class="c-guia__mini-cuerpo">
      <ol class="c-guia__recorrido">
        <li>Entra al panel (normalmente <em>tusitio.com/wp-admin</em>) con tu cuenta.</li>
        <li>Ve a <strong>Usuarios</strong> y luego <strong>Añadir nuevo</strong>.</li>
        <li>Pon un nombre de usuario, mi correo y deja que WordPress me envíe el aviso para elegir mi propia contraseña.</li>
        <li>En <strong>Rol</strong>, elige <strong>Administrador</strong> si voy a instalar el tema y los plugins, o <strong>Editor</strong> si solo es contenido. Pulsa <strong>Añadir nuevo usuario</strong>.</li>
      </ol>
      <p><strong>Para quitarme:</strong> Usuarios → pasa el cursor sobre mi nombre → Borrar. Todo lo que publiqué te lo puedes quedar. Más en la <a href="https://wordpress.org/documentation/article/users-add-new-screen/" rel="noopener">documentación de WordPress</a> y en sus <a href="https://wordpress.org/documentation/article/roles-and-capabilities/" rel="noopener">roles y permisos</a>.</p>
    </div>
  </details>
  <details class="c-promo__pregunta"><summary>Registrador u hosting: acceso delegado</summary>
    <div class="c-guia__mini-cuerpo">
      <p>Muchos proveedores permiten dar acceso a otra persona <strong>sin compartir tu contraseña</strong>. Búscalo como «acceso delegado», «usuarios» o «miembros del equipo». Ejemplo con GoDaddy:</p>
      <ol class="c-guia__recorrido">
        <li>Entra a la página de <a href="https://account.godaddy.com/access" rel="noopener">acceso de tu cuenta de GoDaddy</a>.</li>
        <li>En «Personas que pueden acceder a mi cuenta», elige <strong>Invitar para acceder</strong>.</li>
        <li>Escribe mi nombre y mi correo, y elige el <strong>nivel de acceso</strong>: con el que solo administre productos y dominios, sin compras, alcanza.</li>
        <li>Pulsa <strong>Invitar</strong>. La invitación vence en unos días si no se acepta.</li>
      </ol>
      <p><strong>Para quitarme:</strong> en la misma página, «Editar» junto a mi nombre y luego «Eliminar». Más en la <a href="https://www.godaddy.com/es/help/que-es-el-acceso-delegado-12378" rel="noopener">ayuda de GoDaddy</a>. Si tu proveedor no ofrece nada parecido, usamos la opción 1 (videollamada).</p>
    </div>
  </details>
  <details class="c-promo__pregunta"><summary>Enlace de un solo uso con Bitwarden Send</summary>
    <div class="c-guia__mini-cuerpo">
      <ol class="c-guia__recorrido">
        <li>En Bitwarden, entra a <strong>Enviar</strong> y elige <strong>Enviar nuevo</strong>.</li>
        <li>Tipo <strong>Texto</strong>. Ponle un nombre (por ejemplo «Acceso para Lex») y pega ahí la contraseña.</li>
        <li>Abre <strong>Opciones</strong>: pon el <strong>número máximo de accesos en 1</strong> y una <strong>fecha de eliminación</strong> cercana (por defecto son 7 días). Si quieres, añade una contraseña al enlace y mándamela por otro medio, y activa que el texto se oculte por defecto.</li>
        <li>Pulsa <strong>Guardar</strong>, luego en Opciones <strong>Copiar enlace de Enviar</strong>, y pásame el enlace. El enlace sí puede ir por WhatsApp: ya no sirve después de abrirse.</li>
      </ol>
      <p>Si la plataforma te pide un código de verificación en dos pasos al entrar, tendrás que estar conmigo para dármelo. <a href="https://bitwarden.com/es-la/help/create-send/" rel="noopener">Cómo crear un Enviar</a> · <a href="https://bitwarden.com/es-la/help/send-lifespan/" rel="noopener">Vida útil de un Enviar</a>.</p>
    </div>
  </details>
  <details class="c-promo__pregunta"><summary>Enlace temporal con 1Password</summary>
    <div class="c-guia__mini-cuerpo">
      <ol class="c-guia__recorrido">
        <li>Abre 1Password, busca el elemento y elige <strong>Compartir</strong> (<em>Share</em>).</li>
        <li>Elige <strong>cuándo caduca</strong> el enlace y, para que solo yo pueda abrirlo, toca <strong>Agregar correo</strong> y escribe el mío.</li>
        <li>Pulsa <strong>Copiar enlace</strong> y pásamelo; yo lo abro sin necesitar cuenta de 1Password.</li>
      </ol>
      <p>Según 1Password, el enlace se puede abrir hasta que caduque: pon una caducidad corta y limítalo a mi correo. <a href="https://support.1password.com/share-items/" rel="noopener">Cómo compartir elementos con 1Password</a>.</p>
    </div>
  </details>
</div>
${nota('<strong>Cuando terminemos:</strong> quita mi acceso con los pasos de arriba, cambia la contraseña de lo que compartiste y revisa que mi nombre ya no aparezca en la lista de usuarios, colaboradores o delegados. Si compartiste una contraseña por un enlace, cámbiala aunque el enlace ya haya caducado.', 'check')}`,
    },
    {
      id: 'errores',
      icono: 'alert',
      nav: 'Errores',
      titulo: 'Errores comunes y lista de verificación',
      corto: 'Lo que más sale mal y cómo comprobar que todo quedó bien.',
      encorto: 'Casi todos los problemas son los mismos ocho. Revisa la lista al terminar y, si algo falla, avísame.',
      html: `${h3('Los errores más comunes', 'alert')}
<ul class="c-guia__lista c-guia__lista--no">
  <li>Comprar el dominio con el correo de un tercero y luego no poder recuperarlo.</li>
  <li>Pagar un hosting carísimo por tres años solo por el descuento y llegar a la renovación sin saberlo.</li>
  <li>Editar el DNS equivocado (si cambias los servidores de nombres, el DNS del registrador ya no manda).</li>
  <li>Esperar que funcione al instante: la propagación tarda.</li>
  <li>Olvidar la renovación y perder el dominio.</li>
  <li>Copiar mal un valor del DNS (un espacio de más, o pegar la dirección completa <em>https://…</em> donde pedía solo el nombre).</li>
  <li>Cambiar servidores de nombres sin respaldar los registros de correo, y quedarse sin correo.</li>
  <li>Tener solo una versión del dominio funcionando (con <em>www</em> o sin él).</li>
</ul>

${h3('Lista de verificación al terminar', 'check')}
<p>Cuando todo esté conectado, repasa esto. Puedes ir marcando cada punto.</p>
<ul class="c-guia__verificacion">
  <li><label><input type="checkbox"><span>El dominio está a tu nombre y con tu correo.</span></label></li>
  <li><label><input type="checkbox"><span>Privacidad, renovación automática y verificación en dos pasos activadas.</span></label></li>
  <li><label><input type="checkbox"><span>El sitio abre con y sin <em>www</em> y las dos llevan al mismo lugar.</span></label></li>
  <li><label><input type="checkbox"><span>Sale el candado (HTTPS) y no hay avisos de «no seguro».</span></label></li>
  <li><label><input type="checkbox"><span>Se ve bien en tu celular con datos móviles, no solo con tu Wi-Fi.</span></label></li>
  <li><label><input type="checkbox"><span>Al compartirlo por WhatsApp se ve una vista previa con título e imagen.</span></label></li>
  <li><label><input type="checkbox"><span>El correo con tu dominio (si lo tienes) sigue funcionando.</span></label></li>
  <li><label><input type="checkbox"><span>Sabes dónde vence el dominio y dónde está guardada la contraseña.</span></label></li>
</ul>`,
    },
    {
      id: 'preguntas',
      icono: 'message',
      nav: 'Preguntas',
      titulo: 'Preguntas rápidas y glosario',
      corto: 'Las dudas más comunes y el diccionario de la guía.',
      encorto: 'Si una palabra te frena, búscala aquí; y si tu duda no está, escríbeme.',
      html: `<div class="c-promo__faq c-guia__faq">
  <details class="c-promo__pregunta"><summary>¿Puedo cambiar de hosting después sin perder mi dominio?</summary><p>Sí, si el dominio está en tu cuenta de un registrador. Cambias a dónde apunta el DNS y el dominio sigue siendo tuyo. Por eso recomiendo tenerlo aparte.</p></details>
  <details class="c-promo__pregunta"><summary>¿Qué pasa si no renuevo mi dominio?</summary><p>Primero queda en un periodo de gracia, luego puede ponerse en venta y cualquiera podría comprarlo. Con la renovación automática y un correo vigente casi nunca pasa.</p></details>
  <details class="c-promo__pregunta"><summary>¿Necesito comprar el dominio antes de pedir mi página?</summary><p>No. Puedes pedirla y comprarlo después, antes de publicar. Si no tienes uno elegido, en tu pedido me lo dices y te ayudo a escogerlo.</p></details>
  <details class="c-promo__pregunta"><summary>¿El hosting gratuito sirve?</summary><p>Para un sitio estático (sin tienda ni base de datos) sí hay opciones gratuitas confiables. Para algo con más movimiento, un hosting de paga da más tranquilidad. Te digo cuál conviene según lo que vayas a hacer.</p></details>
  <details class="c-promo__pregunta"><summary>¿Qué es mejor, .com o .mx?</summary><p>Si tu público es de todo el mundo, <em>.com</em>. Si es local, <em>.mx</em> o <em>.com.mx</em> da confianza en México. Si puedes, consigue la que elijas y, si es barata, también la otra para que nadie la use.</p></details>
</div>

${h3('Glosario', 'book')}
<dl class="c-guia__glosario">
  <div><dt>Registrador</dt><dd>La empresa donde compras y administras tu dominio.</dd></div>
  <div><dt>Servidores de nombres (nameservers)</dt><dd>Los servidores que mandan sobre el DNS de tu dominio. Donde apuntan es donde editas.</dd></div>
  <div><dt>Registro DNS</dt><dd>Una línea de la libreta: dice qué hacer con tu dominio o un subdominio.</dd></div>
  <div><dt>Propagación</dt><dd>El tiempo que tarda un cambio de DNS en verse en todos lados.</dd></div>
  <div><dt>TTL</dt><dd>Cuánto tiempo guarda una red su copia de un registro antes de volver a preguntar.</dd></div>
  <div><dt>Subdominio</dt><dd>Un prefijo de tu dominio, como <em>www</em> o <em>tienda</em>.</dd></div>
  <div><dt>HTTPS / certificado</dt><dd>El cifrado de la conexión. El certificado es lo que lo prueba; lo normal es que tu proveedor lo renueve solo.</dd></div>
  <div><dt>Redirección</dt><dd>Mandar automáticamente a quien entra a una dirección hacia otra.</dd></div>
  <div><dt>Alojamiento</dt><dd>Lo mismo que hosting.</dd></div>
</dl>`,
    },
  ],
  cierre: {
    eyebrow: 'Qué sigue',
    titulo: '¿Prefieres que lo haga contigo?',
    lead: 'Pronto agrego una página con proveedores de hosting y dominios que recomiendo, con el porqué de cada uno. Cuando esté lista te aviso por WhatsApp. Mientras tanto, si algo no quedó claro, escríbeme y lo vemos.',
    boton: 'Escribirme por WhatsApp',
    mensaje: 'Hola Lex, leí tu guía de dominio y hosting y quiero preguntarte algo.',
  },
};
