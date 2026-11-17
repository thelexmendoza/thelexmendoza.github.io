// Contenido de lexmendoza.com/promo/ (la landing de la promo de fin de año). El HTML lo genera scripts/render-promo.mjs (npm run promo): no se edita a mano.
// Los precios son públicos por decisión de Lex (solo los de la promo; su lista normal sigue privada) y llevan IVA incluido.
// Los precios, los días y los textos de cada opción son los mismos que PLATAFORMAS en el brief (tpl-express-codigo): hay que cambiarlos juntos.
// Español, tuteo y primera persona. Sin urgencia falsa: los lugares salen del servidor y el cierre es el 31 de diciembre de 2026.

export const BRIEF_URL = 'https://brief.lexmendoza.com/';
export const WHATSAPP = '528129043592';
export const whatsappUrl = (mensaje) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

export const promo = {
  slug: 'promo',
  title: 'Promo de fin de año: tu página web desde $549',
  description: 'Tu página web lista en 5 días, desde $549 con IVA. Precios exclusivos de fin de año con lugares limitados cada semana. Respondes unas preguntas y ves tu página armarse en vivo.',
  hero: {
    eyebrow: 'promo de fin de año',
    titulo: 'Tu página web, lista en 5 días.',
    palabra: 'Desde $549.',
    lead: 'Precios exclusivos de fin de año, con lugares limitados cada semana. Respondes unas preguntas, ves tu página armarse en vivo y yo la dejo publicada.',
    boton: 'Cotiza con la promo',
    nota: 'Sin pagar nada todavía: ves tu maqueta antes de decidir.',
    whatsapp: 'Prefiero escribirte por WhatsApp',
    whatsappMensaje: 'Hola Lex, vi la promo de fin de año y quiero cotizar mi página.',
    cierre: 'Promo vigente hasta el 31 de diciembre de 2026 o hasta agotar lugares.',
    resumenFijo: 'Lugares limitados cada semana',
  },
  // Cinta decorativa bajo el hero (aria-hidden): solo repite lo que ya dice la página.
  cinta: ['Promo de fin de año', 'Precios exclusivos', 'Lugares limitados cada semana', 'Hasta el 31 de diciembre', 'Cotiza sin pagar nada todavía', 'Entrega en 5 días hábiles'],
  // Numeros gigantes en contorno detras de cada seccion (decorativos, aria-hidden): solo repiten cifras que ya dice la pagina o el sitio.
  fantasmas: { pasos: '5', precios: '549', casos: '15', preguntas: '?', cierre: '31/12' },
  pasos: {
    titulo: 'Así funciona',
    items: [
      { titulo: 'Respondes el brief', texto: 'Unas preguntas cortas, unos 4 minutos: tu negocio, la voz de tu marca, tus colores, tu logotipo y tus fotos.' },
      { titulo: 'Ves tu página armarse', texto: 'Mientras respondes, una maqueta se arma a la vista con tus colores y tu estilo. No es tu sitio final, pero ves por dónde va.' },
      { titulo: 'Yo la armo y la publico', texto: 'Te escribo por WhatsApp para confirmar tu pedido y darte los datos de pago. Los días de tu opción cuentan desde tu pago y con tu contenido completo.' },
    ],
  },
  precios: {
    titulo: 'Elige cómo quieres tu página',
    lead: 'Todos los precios incluyen IVA. Cada opción es una página de seis secciones con tu contenido, tu logotipo y tus colores.',
    boton: 'Cotiza esta opción',
    plataformas: [
      {
        id: 'medida',
        nombre: 'Código a la medida',
        precio: '$549',
        dias: 5,
        resumen: '*HTML, CSS y JavaScript puros*: el *más rápido y ligero*, sin plataforma de por medio.',
        paraQuien: 'Si quieres lo *más rápido y ligero*, y no te importa pedirme los cambios.',
        aparte: 'Solo el *dominio* y un lugar donde publicarlo.',
        edicion: 'Me pides los cambios y yo los hago (*30 días* de cambios menores incluidos).',
      },
      {
        id: 'wix',
        nombre: 'Wix',
        precio: '$1,290',
        dias: 7,
        resumen: 'Lo armo dentro de *tu cuenta de Wix* para que luego lo *edites tú*.',
        paraQuien: 'Si quieres *editarla tú mismo* y *salir pronto*.',
        aparte: 'Tu *plan de Wix* (el alojamiento va incluido) y tu *dominio*.',
        edicion: 'Editas tú con su *editor visual*; te grabo un *video de 10 minutos* para que sepas cómo.',
      },
      {
        id: 'squarespace',
        nombre: 'Squarespace',
        precio: '$1,990',
        dias: 10,
        resumen: 'Lo armo dentro de *tu cuenta de Squarespace*, con *más cuidado en estilos*.',
        paraQuien: 'Si quieres *editarla tú* y *cuidar mucho el estilo*.',
        aparte: 'Tu *plan de Squarespace* (el alojamiento va incluido) y tu *dominio*.',
        edicion: 'Editas tú con su *editor*; te grabo un *video de 10 minutos*.',
      },
      {
        id: 'wordpress',
        nombre: 'WordPress',
        precio: '$2,190',
        dias: 8,
        resumen: 'Lo instalo en *tu hosting*, con tema, *plugins esenciales*, *seguridad* y *respaldos básicos*.',
        paraQuien: 'Si quieres editarla tú desde un *panel muy conocido*.',
        aparte: 'Tu *hosting* y tu *dominio* (te guío para comprarlos).',
        edicion: 'Editas tú desde su *panel*; te grabo un *video de 10 minutos*.',
      },
    ],
    extra: { nombre: 'Publicación asistida', precio: '$390', texto: 'Te acompaño a conectar tu dominio y a publicar tu página, paso a paso.' },
  },
  alcance: {
    incluye: {
      titulo: 'Qué incluye',
      items: [
        'Una página de seis secciones, con tu contenido, tu logotipo (o uno que armamos) y tus colores.',
        'La voz de tu marca: la forma, el movimiento y el tono de los textos salen de lo que me cuentas.',
        'Una ronda de ajustes con lo que me cuentes.',
        'Soporte por WhatsApp o correo antes, durante y después de publicar.',
        'Transparencia: ves cómo se arma tu página y por qué, paso a paso.',
      ],
    },
    noIncluye: {
      titulo: 'Qué no incluye',
      items: [
        'Tienda en línea ni pagos dentro de la página.',
        'Varias páginas ni un portal.',
        'Un diseño distinto al de la plantilla: eso es mi servicio normal, aparte de la promo.',
        'El dominio y el hosting: se pagan aparte y te guío a elegirlos.',
      ],
    },
  },
  casos: {
    titulo: 'Mira cómo trabajo',
    lead: 'Tres casos reales, con clientes reales.',
    items: [
      { slug: 'ciisa-psw', titulo: 'CiiSA | PSW', texto: 'Sitios de eventos y de producto, publicados y en uso.', etiqueta: 'Sitios web' },
      { slug: 'motociclismo', titulo: 'Motociclismo', texto: 'Motoplex Monterrey y Motoland Driving School: contenido para negocios locales.', etiqueta: 'Negocio local' },
      { slug: 'daniel-abrego', titulo: 'Daniel Ábrego', texto: 'Psicología práctica y divulgación: una marca personal sostenida en el tiempo.', etiqueta: 'Marca personal' },
    ],
    verCaso: 'Ver caso',
  },
  // Las respuestas son fragmentos de HTML de confianza (llevan un enlace a la guía).
  faq: [
    {
      pregunta: '¿Qué pasa después de enviar el brief?',
      respuesta: 'Te escribo por WhatsApp para confirmar tu pedido y darte los datos de pago. Hasta entonces no pagas nada, y tu lugar queda apartado hasta la fecha que te indico en la confirmación.',
    },
    {
      pregunta: '¿Necesito dominio y hosting?',
      respuesta: 'Depende de tu opción. Wix y Squarespace incluyen el alojamiento en su plan; con código a la medida y con WordPress necesitas un lugar donde publicar. Si no tienes dominio ni hosting, aquí hay una <a href="../guia-dominio-hosting/">guía para elegirlos</a>.',
    },
    {
      pregunta: '¿Me vas a pedir mis contraseñas?',
      respuesta: 'No. Nunca te pido contraseñas por correo ni por WhatsApp. Si necesito entrar a una cuenta tuya, te explico cómo darme un acceso temporal y delegado, que puedes quitar cuando terminemos.',
    },
    {
      pregunta: '¿Cuánto tarda?',
      respuesta: 'Los días cuentan desde tu pago y con tu contenido completo: 5 días hábiles con código a la medida, 7 con Wix, 8 con WordPress y 10 con Squarespace.',
    },
    {
      pregunta: '¿Qué pasa si necesito más que una página?',
      respuesta: 'Entonces ya no es la promo: es mi servicio normal. Escríbeme por WhatsApp, cuéntame qué necesitas y lo cotizamos.',
    },
    {
      pregunta: '¿Qué pasa si se agota mi opción?',
      respuesta: 'Los lugares se reinician cada lunes. Si tu opción ya se agotó esta semana, escríbeme por WhatsApp y te aviso cuando abran lugares.',
    },
    {
      pregunta: '¿Hasta cuándo es la promo?',
      respuesta: 'Hasta el 31 de diciembre de 2026 o hasta agotar lugares, lo que ocurra primero. Los lugares son por semana y por opción.',
    },
  ],
  cierre: {
    titulo: '¿Te late? Aparta tu lugar.',
    lead: 'Hasta el 31 de diciembre o hasta agotar lugares. Cotizar no cuesta nada.',
    terminada: 'La promo de fin de año terminó. Escríbeme por WhatsApp y te cotizo tu página.',
    terminadaBoton: 'Escribirme por WhatsApp',
    terminadaMensaje: 'Hola Lex, vi tu promo de fin de año y quiero cotizar mi página.',
    avisame: 'Avísame el lunes',
    avisameMensaje: (plataforma) => `Hola Lex, la opción ${plataforma} de la promo de fin de año está agotada esta semana. ¿Me avisas cuando abran lugares?`,
  },
};
