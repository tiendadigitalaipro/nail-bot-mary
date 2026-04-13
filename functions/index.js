// ══════════════════════════════════════════════
// MARY BOT — Asistente Virtual de Voz
// Firebase Functions — v2.0.0
// ══════════════════════════════════════════════
//
// SECRETS de Firebase Functions (configurar con):
//   firebase functions:secrets:set GEMINI_API_KEY
//   firebase functions:secrets:set TWILIO_ACCOUNT_SID
//   firebase functions:secrets:set TWILIO_AUTH_TOKEN
//   firebase functions:secrets:set OWNER_WHATSAPP   (ej: +584121234567)
//   firebase functions:secrets:set TWILIO_WA_FROM   (ej: whatsapp:+14155238886)
// ══════════════════════════════════════════════

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

initializeApp();
const db = getFirestore();

// ══════════════════════════════════════════════
// SECRETS — env vars con fallback para dev local
// ══════════════════════════════════════════════
const GEMINI_API_KEY      = process.env.GEMINI_API_KEY      || '';
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID  || '';
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN   || '';
// Número WhatsApp del dueño del salón (con prefijo whatsapp:)
const OWNER_WHATSAPP      = process.env.OWNER_WHATSAPP      || 'whatsapp:+584121234567';
// Número de Twilio WhatsApp sandbox
const TWILIO_WA_FROM      = process.env.TWILIO_WA_FROM      || 'whatsapp:+14155238886';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const twilio = require('twilio');
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  logger.warn('TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configurados. Define los secrets antes de desplegar en produccion.');
}

// ══════════════════════════════════════════════
// CONFIGURACIÓN DEL SALÓN
// ══════════════════════════════════════════════
const SALON_CONFIG = {
  nombre: 'Nail Beautiful',
  asistente: 'Mary',
  horarios: 'Lunes a Domingo, 8:00 AM a 8:00 PM',
  tono: 'cálida, profesional, amigable y servicial',
};

// Servicios del salón (32 servicios)
const SERVICIOS = [
  { id: 's1',  nombre: 'Manicura Clásica',                       cat: 'Manicura',                precio: 10, duracion: 40,  desc: 'Limpieza, corte y limado de uñas' },
  { id: 's2',  nombre: 'Manicura con Esmaltado Tradicional',      cat: 'Manicura',                precio: 12, duracion: 50,  desc: 'Manicura clásica + esmalte tradicional al gusto' },
  { id: 's3',  nombre: 'Manicura con Semi Permanente',            cat: 'Manicura',                precio: 18, duracion: 60,  desc: 'Manicura clásica + esmalte semipermanente con cura UV/LED' },
  { id: 's4',  nombre: 'Manicura Spa Premium',                    cat: 'Manicura',                precio: 22, duracion: 60,  desc: 'Manicura completa con hidratación, exfoliación y masaje' },
  { id: 's5',  nombre: 'Pedicura Clásica',                        cat: 'Pedicura',                precio: 12, duracion: 50,  desc: 'Limpieza, corte y limado de uñas de pies' },
  { id: 's6',  nombre: 'Pedicura con Esmaltado Tradicional',      cat: 'Pedicura',                precio: 15, duracion: 60,  desc: 'Pedicura clásica + esmalte tradicional' },
  { id: 's7',  nombre: 'Pedicura con Semi Permanente',            cat: 'Pedicura',                precio: 18, duracion: 65,  desc: 'Pedicura clásica + esmalte semipermanente con cura UV/LED' },
  { id: 's8',  nombre: 'Pedicura Spa Premium',                    cat: 'Pedicura',                precio: 25, duracion: 75,  desc: 'Pedicura completa con hidratación, exfoliación y masaje' },
  { id: 's9',  nombre: 'Esmaltado Semi Permanente Manos',         cat: 'Esmaltado y Semi Permanente', precio: 18, duracion: 60, desc: 'Esmalte semipermanente con cura UV/LED en manos' },
  { id: 's10', nombre: 'Esmaltado Semi Permanente Pies',          cat: 'Esmaltado y Semi Permanente', precio: 15, duracion: 50, desc: 'Esmalte semipermanente con cura UV/LED en pies' },
  { id: 's11', nombre: 'Retoque Semi Permanente',                 cat: 'Esmaltado y Semi Permanente', precio: 10, duracion: 40, desc: 'Retoque de crecimiento con semipermanente' },
  { id: 's12', nombre: 'Esmaltado Tradicional Manos',             cat: 'Esmaltado Tradicional',   precio: 8,  duracion: 30,  desc: 'Esmalte tradicional al gusto en manos' },
  { id: 's13', nombre: 'Esmaltado Tradicional Pies',              cat: 'Esmaltado Tradicional',   precio: 10, duracion: 40,  desc: 'Esmalte tradicional al gusto en pies' },
  { id: 's14', nombre: 'Cambio de Esmalte',                       cat: 'Esmaltado Tradicional',   precio: 5,  duracion: 20,  desc: 'Retiro y cambio de esmalte tradicional' },
  { id: 's15', nombre: 'Uñas Gel Full Set',                       cat: 'Gel',                     precio: 25, duracion: 90,  desc: 'Uñas de gel constructor con extensión completa' },
  { id: 's16', nombre: 'Retoque Gel',                             cat: 'Gel',                     precio: 15, duracion: 60,  desc: 'Relleno y mantenimiento de uñas de gel' },
  { id: 's17', nombre: 'Gel Overlay (cubierto)',                  cat: 'Gel',                     precio: 20, duracion: 75,  desc: 'Cubierto de gel sobre uña natural para fortalecer' },
  { id: 's18', nombre: 'Sistema Dual Full Set',                   cat: 'Sistema Dual',            precio: 28, duracion: 100, desc: 'Extensiones con sistema dual (acrílico + gel)' },
  { id: 's19', nombre: 'Retoque Sistema Dual',                    cat: 'Sistema Dual',            precio: 18, duracion: 70,  desc: 'Relleno y mantenimiento de sistema dual' },
  { id: 's20', nombre: 'Uñas Acrílicas Full Set',                 cat: 'Uñas Acrílicas',          precio: 25, duracion: 90,  desc: 'Extensiones completas en polvo acrílico' },
  { id: 's21', nombre: 'Retoque Acrílico',                        cat: 'Uñas Acrílicas',          precio: 15, duracion: 60,  desc: 'Relleno y mantenimiento acrílico' },
  { id: 's22', nombre: 'Acrigel Full Set',                        cat: 'Acrigel',                 precio: 28, duracion: 90,  desc: 'Extensiones con sistema acrigel' },
  { id: 's23', nombre: 'Retoque Acrigel',                         cat: 'Acrigel',                 precio: 16, duracion: 65,  desc: 'Relleno y mantenimiento acrigel' },
  { id: 's24', nombre: 'Polygel Full Set',                        cat: 'Polygel',                 precio: 30, duracion: 100, desc: 'Extensiones con polygel' },
  { id: 's25', nombre: 'Retoque Polygel',                         cat: 'Polygel',                 precio: 18, duracion: 70,  desc: 'Relleno y mantenimiento de polygel' },
  { id: 's26', nombre: 'Nail Art (diseño por uña)',               cat: 'Nail Art',                precio: 3,  duracion: 10,  desc: 'Diseño artístico individual por uña' },
  { id: 's27', nombre: 'Nail Art Set Completo',                   cat: 'Nail Art',                precio: 10, duracion: 30,  desc: 'Diseños artísticos en set completo de uñas' },
  { id: 's28', nombre: 'Diseño con Accesorios',                   cat: 'Nail Art',                precio: 12, duracion: 35,  desc: 'Diseños con diamantes, charms o pedrería' },
  { id: 's29', nombre: 'Spa de Manos',                            cat: 'Spa Uñas',                precio: 12, duracion: 45,  desc: 'Hidratación, exfoliación y masaje de manos' },
  { id: 's30', nombre: 'Spa de Pies',                             cat: 'Spa Uñas',                precio: 15, duracion: 50,  desc: 'Hidratación, exfoliación y masaje de pies' },
  { id: 's31', nombre: 'Retiro de Acrílico/Gel',                  cat: 'Retoque',                 precio: 8,  duracion: 30,  desc: 'Retiro completo de uñas acrílicas o de gel' },
  { id: 's32', nombre: 'Encapsulado',                             cat: 'Retoque',                 precio: 15, duracion: 50,  desc: 'Encapsulado de uñas con gel o acrigel' },
];

// Extras / decoraciones
const EXTRAS = [
  { id: 'cristales',    nombre: 'Cristales regulares',     precio: 2   },
  { id: 'swarovski',   nombre: 'Swarovski',                precio: 5   },
  { id: 'chrome',      nombre: 'Efecto Espejo/Chrome',     precio: 3   },
  { id: 'humo',        nombre: 'Efecto Humo',              precio: 4   },
  { id: 'dibujo',      nombre: 'Dibujo a mano',            precio: 5   },
  { id: 'franjas',     nombre: 'Franjas',                  precio: 2   },
  { id: 'pepita',      nombre: 'Pepita/Confetti',          precio: 1.5 },
  { id: 'charms',      nombre: 'Charms',                   precio: 3   },
  { id: 'ombre',       nombre: 'Ombre/Baby Boomer',        precio: 3   },
  { id: '3d',          nombre: 'Diseño en 3D',             precio: 6   },
  { id: 'stickers',    nombre: 'Pegatinas/Stickers',       precio: 1   },
  { id: 'bullon',      nombre: 'Bullón',                   precio: 2   },
  { id: 'fluorescente',nombre: 'Fluorescente/UV',          precio: 2   },
  { id: 'cuticulas',   nombre: 'Retoque de cutículas',     precio: 1   },
  { id: 'rusa',        nombre: 'Manicura rusa',            precio: 2   },
];

// ══════════════════════════════════════════════
// PROMPT SISTEMA DE MARY
// ══════════════════════════════════════════════
function buildSystemPrompt(salonConfig) {
  const cfg = salonConfig || SALON_CONFIG;
  const serviciosTexto = SERVICIOS.map(s =>
    `  - ${s.nombre}: $${s.precio} (${s.duracion} min) — ${s.desc}`
  ).join('\n');

  const extrasTexto = EXTRAS.map(e =>
    `  - ${e.nombre}: $${e.precio}`
  ).join('\n');

  const categorias = [...new Set(SERVICIOS.map(s => s.cat))].join(', ');

  return `Eres ${cfg.asistente}, la asistente virtual del salón de belleza "${cfg.nombre}". Tu personalidad es ${cfg.tono}.

HORARIOS DE ATENCIÓN: ${cfg.horarios}

SERVICIOS DISPONIBLES (${categorias}):
${serviciosTexto}

EXTRAS Y DECORACIONES (se agregan al precio del servicio):
${extrasTexto}

POLÍTICAS DEL SALÓN:
- Se atiende con cita previa o por orden de llegada según disponibilidad
- Si la clienta llega tarde más de 15 minutos, la cita se puede reprogramar
- Las citas se pueden cancelar o reprogramar con al menos 2 horas de anticipación
- Se acepta pago en efectivo, pago móvil y transferencia bancaria
- Los precios pueden variar según la complejidad del diseño

TUS REGLAS DE CONVERSACIÓN:
1. Siempre saluda de forma cálida y profesional
2. Habla en español, de forma natural como una venezolana educada
3. Si preguntan por servicios, menciona los más relevantes según lo que pidan
4. Si preguntan por precios, da el precio exacto y menciona la duración
5. Si quieren agendar, pregunta: nombre, servicio deseado, fecha y hora preferida
6. Sé breve pero completa — las llamadas deben ser eficientes
7. Si no sabes algo (como disponibilidad exacta), ofrece que la dueña las confirmará
8. Nunca inventes precios ni servicios que no estén en la lista
9. Si preguntan por algo fuera de lo que sabes, sugiere contactar por WhatsApp
10. Si la clienta pide hablar con la dueña, dile que la dejarás un mensaje y la contactará pronto
11. Si la clienta pide que repitas algo, repite la información de forma clara y pausada

RESPUESTA: Responde de forma conversacional y natural, MAXIMO 2-3 oraciones. No uses markdown ni formato especial. Habla como si estuvieras al teléfono.`;
}

// ══════════════════════════════════════════════
// TWIML: GENERAR VOZ (Twilio Voice Response)
// ══════════════════════════════════════════════

/**
 * Genera un elemento <Say> con SSML para voz neural más natural.
 * Usa Polly.Lupe-Neural con prosody para pausa y entonación.
 */
function twimlSaySSML(ssmlContent, voice = 'Polly.Lupe-Neural') {
  return `<Say voice="${voice}" language="es-US"><prosody rate="95%" pitch="+2%">${ssmlContent}</prosody></Say>`;
}

/**
 * Convierte texto plano en SSML añadiendo pausas naturales.
 * Inserta <break> después de signos de puntuación y al inicio para pausa natural.
 */
function textToSSML(text) {
  const safe = escapeXml(text);
  return safe
    .replace(/\. /g, '.<break time="400ms"/> ')
    .replace(/\? /g, '?<break time="350ms"/> ')
    .replace(/! /g, '!<break time="350ms"/> ')
    .replace(/, /g, ',<break time="200ms"/> ');
}

function twimlSay(text, voice = 'Polly.Lupe-Neural') {
  const ssml = textToSSML(text);
  return twimlSaySSML(ssml, voice);
}

function twimlGather(text, action, method = 'POST', timeout = 8, numDigits = 1, speechTimeout = 'auto') {
  const inner = text ? twimlSay(text) : '';
  return `<Gather input="speech dtmf" action="${action}" method="${method}" timeout="${timeout}" numDigits="${numDigits}" speechTimeout="${speechTimeout}" language="es-US">
    ${inner}
  </Gather>`;
}

function twimlPause(duration = 1) {
  return `<Pause length="${duration}"/>`;
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ══════════════════════════════════════════════
// VALIDACIÓN DE FIRMA TWILIO
// ══════════════════════════════════════════════

/**
 * Valida la firma de Twilio en webhooks entrantes.
 * Retorna true si la firma es válida o si estamos en modo desarrollo (sin TWILIO_AUTH_TOKEN real).
 * En producción, si falla la validación se rechaza la solicitud.
 */
function validarFirmaTwilio(req) {
  // Si el token es el fallback de desarrollo, no validar
  if (TWILIO_AUTH_TOKEN === '') {
    return true; // modo dev: acepta todo
  }
  try {
    const twilioSignature = req.headers['x-twilio-signature'] || '';
    if (!twilioSignature) return false;

    const url = `https://${req.headers.host}${req.originalUrl}`;
    const params = req.body || {};
    return twilio.validateRequest(TWILIO_AUTH_TOKEN, twilioSignature, url, params);
  } catch (e) {
    logger.warn('Error validando firma Twilio:', e.message);
    return false;
  }
}

// ══════════════════════════════════════════════
// CEREBRO DE MARY (Gemini)
// ══════════════════════════════════════════════
async function maryResponde(transcripcion, historial, callSid, salonConfig) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const mensajes = [];

    if (historial && historial.length > 0) {
      historial.forEach(msg => {
        mensajes.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    mensajes.push({ role: 'user', parts: [{ text: `[Cliente dice por teléfono]: "${transcripcion}"` }] });

    const systemPrompt = buildSystemPrompt(salonConfig);

    const result = await model.generateContent({
      contents: mensajes,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
        topP: 0.9,
      },
    });

    const respuesta = result.response.text().trim();
    logger.info(`Mary responde para ${callSid}: "${respuesta}"`);
    return respuesta;
  } catch (error) {
    logger.error(`Error en Mary para ${callSid}:`, error);
    return 'Disculpa, tuve un pequeño problemita de conexión. Puedes repetir lo que necesitas, por favor?';
  }
}

// ══════════════════════════════════════════════
// DETECTAR INTENCIÓN
// ══════════════════════════════════════════════
function detectarIntencion(texto) {
  const t = texto.toLowerCase();

  if (t.match(/agend|cita|reserv|hora|dispon|cuándo|puedo ir|quiero ir|turno|reprogramar/)) return 'agendar';
  if (t.match(/precio|cuánto cuesta|cuánto es|valor|cobr|tarifa|costo/)) return 'precios';
  // precio específico de un servicio concreto
  if (t.match(/cuánto (cuesta|es|vale|cobran).*(manicur|pedicur|gel|acrí|nail|spa|esmalte|polygel|dual)/)) return 'precio_especifico';
  if (t.match(/servicio|ofrec|qué tienen|qué hacen|trabaj|lista/)) return 'servicios';
  if (t.match(/horario|abiert|atiend|cuándo abr|mañana|tarde/)) return 'horarios';
  if (t.match(/ubic|direcc|dónde|cómo lleg|ubicad/)) return 'ubicacion';
  if (t.match(/dueña|dueño|encargad|jefe|señora|propietari/)) return 'dueno';
  if (t.match(/gracia|nada|más|listo|adiós|bye|chao|hasta luego|nos vemos/)) return 'despedida';
  if (t.match(/promoción|descuento|oferta|especial|promo/)) return 'promociones';
  if (t.match(/pago móvil|transfer|pago|pagar|efectivo|zelle/)) return 'pagos';
  if (t.match(/cancelar|no voy|no puedo|posponer/)) return 'cancelar';
  // solicitud de repetir información
  if (t.match(/repite|repita|no (te |le )?(escuché|entendí|oí)|cómo|qué dijiste|de nuevo|otra vez/)) return 'repetir';

  return 'general';
}

// ══════════════════════════════════════════════
// WHATSAPP NOTIFICATIONS
// ══════════════════════════════════════════════

/**
 * Envía un mensaje de WhatsApp al dueño del salón.
 * Requiere que OWNER_WHATSAPP y TWILIO_WA_FROM estén configurados.
 */
async function enviarWhatsApp(mensaje) {
  try {
    if (!OWNER_WHATSAPP || OWNER_WHATSAPP === 'whatsapp:+584121234567') {
      logger.warn('OWNER_WHATSAPP no configurado. Saltando notificacion WhatsApp.');
      return;
    }
    await twilioClient.messages.create({
      from: TWILIO_WA_FROM,
      to: OWNER_WHATSAPP,
      body: mensaje,
    });
    logger.info(`WhatsApp enviado a ${OWNER_WHATSAPP}`);
  } catch (e) {
    logger.error('Error enviando WhatsApp:', e.message);
    // No relanzar — la notificación es best-effort
  }
}

/**
 * Notifica al dueño cuando se detecta una solicitud de cita.
 */
async function notificarCitaNueva(callerNumber, transcripcion, respuestaMary) {
  const numero = callerNumber.replace('+', '').slice(-10);
  const mensaje = [
    '📅 *Nueva solicitud de cita — Mary Bot*',
    `📞 Cliente: ${callerNumber}`,
    `🗣️ Pidió: ${transcripcion}`,
    `🤖 Mary respondió: ${respuestaMary}`,
    `🕐 Hora: ${new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`,
    '',
    'Confirma o comunícate con la clienta para agendar.',
  ].join('\n');
  await enviarWhatsApp(mensaje);
}

/**
 * Notifica al dueño al finalizar una llamada con un resumen.
 */
async function notificarResumenLlamada(callSid, callerNumber, duracion, intencion, historial) {
  const resumen = historial && historial.length > 0
    ? historial.slice(-4).map(m => `${m.role === 'user' ? 'Clienta' : 'Mary'}: ${m.text}`).join('\n')
    : 'Sin transcripción registrada.';

  const mensaje = [
    '📞 *Resumen de llamada — Mary Bot*',
    `📱 Número: ${callerNumber}`,
    `⏱️ Duración: ${duracion}s`,
    `🎯 Intención detectada: ${intencion || 'general'}`,
    `🕐 Hora: ${new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`,
    '',
    '*Últimos mensajes:*',
    resumen,
  ].join('\n');
  await enviarWhatsApp(mensaje);
}

// ══════════════════════════════════════════════
// FIRESTORE HELPERS
// ══════════════════════════════════════════════
async function guardarLlamada(callSid, data) {
  try {
    await db.collection('llamadas').doc(callSid).set(
      { ...data, ts: Date.now(), fecha: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) { logger.error('Error guardando llamada:', e); }
}

async function guardarCita(data) {
  try {
    const ref = await db.collection('citas_bot').add({
      ...data,
      ts: Date.now(),
      estado: 'pendiente',
      fecha: new Date().toISOString()
    });
    // Registrar también en colección de notificaciones
    await db.collection('notificaciones').add({
      tipo: 'cita_nueva',
      citaId: ref.id,
      ...data,
      ts: Date.now(),
      leida: false,
    });
    return ref.id;
  } catch (e) { logger.error('Error guardando cita:', e); return null; }
}

async function obtenerHistorial(callSid) {
  try {
    const doc = await db.collection('conversaciones').doc(callSid).get();
    return doc.exists ? (doc.data().mensajes || []) : [];
  } catch (e) { return []; }
}

async function guardarMensaje(callSid, role, text) {
  try {
    const ref = db.collection('conversaciones').doc(callSid);
    const doc = await ref.get();
    const mensajes = doc.exists ? (doc.data().mensajes || []) : [];
    mensajes.push({ role, text, ts: Date.now() });
    // Mantener máximo 20 mensajes por conversación (10 turnos)
    if (mensajes.length > 20) mensajes.splice(0, mensajes.length - 20);
    await ref.set({ mensajes, callSid, ultimaActualizacion: Date.now() }, { merge: true });
  } catch (e) { logger.error('Error guardando mensaje:', e); }
}

async function obtenerTurnos(callSid) {
  try {
    const doc = await db.collection('llamadas').doc(callSid).get();
    return doc.exists ? (doc.data().turnos || 0) : 0;
  } catch (e) { return 0; }
}

async function getSalonConfig() {
  try {
    const doc = await db.collection('config').doc('salon').get();
    if (doc.exists) return { ...SALON_CONFIG, ...doc.data() };
  } catch (e) { logger.error('Error obteniendo config:', e); }
  return SALON_CONFIG;
}

// ══════════════════════════════════════════════
// WEBHOOKS DE TWILIO (llamadas entrantes)
// ══════════════════════════════════════════════

// Endpoint 1: Llamada entrante
exports.incomingCall = onRequest({ cors: true }, async (req, res) => {
  try {
    // Validar firma Twilio
    if (!validarFirmaTwilio(req)) {
      logger.warn('Firma Twilio inválida en incomingCall');
      res.status(403).send('Forbidden');
      return;
    }

    const callSid = req.body.CallSid;
    const callerNumber = req.body.From || 'Desconocido';

    logger.info(`Llamada entrante: ${callSid} desde ${callerNumber}`);

    await guardarLlamada(callSid, {
      callSid,
      callerNumber,
      estado: 'activa',
      turnos: 0,
      ultimaIntencion: null,
    });

    const config = await getSalonConfig();

    // Saludo SSML con pausa natural al inicio
    const saludoSSML = `<break time="500ms"/>Hola,<break time="200ms"/> bienvenida a ${escapeXml(config.nombre)}.<break time="300ms"/> Soy ${escapeXml(config.asistente)},<break time="150ms"/> tu asistente virtual.<break time="400ms"/> Puedo contarte sobre nuestros servicios,<break time="150ms"/> precios,<break time="150ms"/> horarios,<break time="150ms"/> o ayudarte a agendar una cita.<break time="300ms"/> ¿En qué te puedo ayudar hoy?`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSaySSML(saludoSSML)}
  ${twimlPause(1)}
  ${twimlGather('Dime, qué necesitas?', `/conversar?callSid=${callSid}`, 'POST', 8, 1, 'auto')}
  ${twimlSay('No te escuché bien. Te dejo un saludo y espero que nos llames de nuevo. Que tengas un hermoso día!')}
  <Hangup/>
</Response>`;

    res.type('text/xml').send(twiml);
  } catch (error) {
    logger.error('Error en incomingCall:', error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSay('Hola, llamaste a Nail Beautiful. Por favor, intenta llamarnos de nuevo en unos minutos. Gracias!')}
  <Hangup/>
</Response>`;
    res.type('text/xml').send(errorTwiml);
  }
});

// Endpoint 2: Conversación (multi-turno, hasta 8 intercambios)
exports.conversar = onRequest({ cors: true }, async (req, res) => {
  try {
    // Validar firma Twilio
    if (!validarFirmaTwilio(req)) {
      logger.warn('Firma Twilio inválida en conversar');
      res.status(403).send('Forbidden');
      return;
    }

    const callSid = req.body.CallSid || req.query.callSid;
    const speechResult = req.body.SpeechResult || '';
    const digits = req.body.Digits || '';

    logger.info(`Conversación ${callSid}: speech="${speechResult}" digits="${digits}"`);

    if (!speechResult && !digits) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSay('Parece que hubo un problemita con la conexión. Gracias por llamar. Que tengas un lindo día!')}
  <Hangup/>
</Response>`;
      res.type('text/xml').send(twiml);
      return;
    }

    let transcripcion = speechResult || '';
    if (digits === '1') transcripcion = 'Quiero información sobre servicios y precios';
    if (digits === '2') transcripcion = 'Quiero agendar una cita';
    if (digits === '3') transcripcion = 'Necesito saber los horarios';
    if (digits === '0') transcripcion = 'Quiero hablar con la dueña del salón';
    if (digits === '9') transcripcion = 'Gracias, nada más, adiós';

    // Obtener contador de turnos actuales
    let turnos = await obtenerTurnos(callSid);
    turnos += 1;

    // Actualizar turno en Firestore
    await guardarLlamada(callSid, { turnos });

    // Detectar intención
    const intencion = detectarIntencion(transcripcion);

    // Despedida explícita o límite de 8 turnos alcanzado
    const MAX_TURNOS = 8;
    if (intencion === 'despedida' || turnos > MAX_TURNOS) {
      await guardarLlamada(callSid, { estado: 'finalizada', motivo: intencion === 'despedida' ? 'despedida' : 'max_turnos' });
      const despedidaSSML = `<break time="300ms"/>Ha sido un gusto atenderte.<break time="400ms"/> Recuerda que estamos de lunes a domingo,<break time="150ms"/> de 8 de la mañana a 8 de la noche.<break time="400ms"/> Que tengas un día hermoso!`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSaySSML(despedidaSSML)}
  <Hangup/>
</Response>`;
      res.type('text/xml').send(twiml);
      return;
    }

    await guardarMensaje(callSid, 'user', transcripcion);

    const historial = await obtenerHistorial(callSid);
    const config = await getSalonConfig();

    if (intencion === 'dueno') {
      await guardarLlamada(callSid, { estado: 'derivada_dueno', transcripcion });
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSay('Claro, con mucho gusto voy a dejarle un mensaje a la dueña del salón para que te contacte lo antes posible. Me puedes dejar tu nombre y número para que te pueda devolver la llamada?')}
  ${twimlGather('', `/conversar?callSid=${callSid}`, 'POST', 8, 1, 'auto')}
  ${twimlPause(1)}
  ${twimlSay('Perfecto, le dejaré el mensaje. Gracias por llamar a Nail Beautiful. Ten un hermoso día!')}
  <Hangup/>
</Response>`;
      res.type('text/xml').send(twiml);
      return;
    }

    // Para 'repetir': obtener la última respuesta de Mary del historial
    if (intencion === 'repetir') {
      const ultimaRespuesta = historial
        .filter(m => m.role === 'model')
        .slice(-1)[0];
      if (ultimaRespuesta) {
        await guardarMensaje(callSid, 'model', ultimaRespuesta.text);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlPause(0.5)}
  ${twimlSay('Claro, te repito.')} ${twimlPause(0.3)} ${twimlSay(ultimaRespuesta.text)}
  ${twimlPause(1)}
  ${twimlGather('', `/conversar?callSid=${callSid}`, 'POST', 8, 1, 'auto')}
  ${twimlSay(`Muchas gracias por llamar a ${escapeXml(config.nombre)}. Esperamos verte pronto. Que tengas un lindo día!`)}
  <Hangup/>
</Response>`;
        res.type('text/xml').send(twiml);
        return;
      }
    }

    // Generar respuesta con Gemini
    const respuestaMary = await maryResponde(transcripcion, historial, callSid, config);
    await guardarMensaje(callSid, 'model', respuestaMary);

    // Detectar si hubo intención de agendar
    const quizoAgendar = intencion === 'agendar' || intencion === 'precio_especifico' ||
      transcripcion.toLowerCase().match(/agend|cita|reserv|turno/) ||
      respuestaMary.toLowerCase().match(/qué día|qué hora|para cuándo|fecha.*prefer/);

    if (quizoAgendar) {
      const citaId = await guardarCita({
        callSid,
        transcripcion,
        respuestaMary,
        callerNumber: req.body.From || 'Desconocido',
        estado: 'pendiente_confirmacion',
      });
      // Notificar al dueño por WhatsApp
      await notificarCitaNueva(req.body.From || 'Desconocido', transcripcion, respuestaMary);
    }

    await guardarLlamada(callSid, {
      estado: 'en_conversacion',
      transcripcion,
      respuestaMary,
      ultimaIntencion: intencion,
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlPause(0.5)}
  ${twimlSay(respuestaMary)}
  ${twimlPause(1)}
  ${twimlGather('', `/conversar?callSid=${callSid}`, 'POST', 8, 1, 'auto')}
  ${twimlSay(`Muchas gracias por llamar a ${escapeXml(config.nombre)}. Esperamos verte pronto. Que tengas un lindo día!`)}
  <Hangup/>
</Response>`;

    res.type('text/xml').send(twiml);
  } catch (error) {
    logger.error('Error en conversar:', error);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twimlSay('Disculpa los inconvenientes. Por favor, llámanos de nuevo en unos minutos. Gracias!')}
  <Hangup/>
</Response>`;
    res.type('text/xml').send(twiml);
  }
});

// Endpoint 3: Status callback — resumen final por WhatsApp
exports.callStatus = onRequest({ cors: true }, async (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const duration = req.body.CallDuration || '0';
  const callerNumber = req.body.From || 'Desconocido';

  logger.info(`Status ${callSid}: ${callStatus} (${duration}s)`);

  if (['completed', 'no-answer', 'failed', 'busy'].includes(callStatus)) {
    await guardarLlamada(callSid, {
      estado: callStatus,
      duracion: parseInt(duration),
      fechaFin: new Date().toISOString()
    });

    // Enviar resumen de la llamada al dueño por WhatsApp (solo para llamadas completadas)
    if (callStatus === 'completed' && parseInt(duration) > 5) {
      const historial = await obtenerHistorial(callSid);
      const doc = await db.collection('llamadas').doc(callSid).get();
      const llamadaData = doc.exists ? doc.data() : {};
      await notificarResumenLlamada(callSid, callerNumber, duration, llamadaData.ultimaIntencion, historial);
    }
  }

  res.status(200).send('OK');
});

// ══════════════════════════════════════════════
// API REST (Panel de Administración)
// ══════════════════════════════════════════════

exports.getLlamadas = onCall(async () => {
  try {
    const snapshot = await db.collection('llamadas').orderBy('ts', 'desc').limit(100).get();
    return { success: true, data: snapshot.docs.map(doc => doc.data()) };
  } catch (error) {
    logger.error('Error getLlamadas:', error);
    throw new HttpsError('internal', 'Error obteniendo llamadas');
  }
});

exports.getCitas = onCall(async () => {
  try {
    const snapshot = await db.collection('citas_bot').orderBy('ts', 'desc').limit(100).get();
    return { success: true, data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    logger.error('Error getCitas:', error);
    throw new HttpsError('internal', 'Error obteniendo citas');
  }
});

exports.updateConfig = onCall(async (data) => {
  try {
    await db.collection('config').doc('salon').set(data, { merge: true });
    return { success: true };
  } catch (error) {
    logger.error('Error updateConfig:', error);
    throw new HttpsError('internal', 'Error actualizando config');
  }
});

exports.getConfig = onCall(async () => {
  try {
    const doc = await db.collection('config').doc('salon').get();
    const config = doc.exists ? { ...SALON_CONFIG, ...doc.data() } : SALON_CONFIG;
    return { success: true, data: config };
  } catch (error) {
    logger.error('Error getConfig:', error);
    throw new HttpsError('internal', 'Error obteniendo config');
  }
});

exports.getStats = onCall(async () => {
  try {
    const llamadasSnapshot = await db.collection('llamadas').get();
    const citasSnapshot = await db.collection('citas_bot').get();
    const llamadas = llamadasSnapshot.docs.map(doc => doc.data());
    const citas = citasSnapshot.docs.map(doc => doc.data());

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hoyTs = hoy.getTime();

    const llamadasHoy = llamadas.filter(l => l.ts >= hoyTs).length;
    const citasHoy = citas.filter(c => c.ts >= hoyTs).length;
    const citasPendientes = citas.filter(c =>
      c.estado === 'pendiente' || c.estado === 'pendiente_confirmacion'
    ).length;
    const duraciones = llamadas.filter(l => l.duracion).map(l => l.duracion);
    const duracionPromedio = duraciones.length
      ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length)
      : 0;
    const citasConfirmadas = citas.filter(c => c.estado === 'confirmada').length;
    const tasaConversion = llamadas.length > 0
      ? Math.round((citasConfirmadas / llamadas.length) * 100)
      : 0;

    return {
      success: true,
      data: {
        llamadasHoy,
        citasHoy,
        citasPendientes,
        llamadasTotal: llamadas.length,
        duracionPromedio,
        citasTotal: citas.length,
        citasConfirmadas,
        tasaConversion,
      }
    };
  } catch (error) {
    logger.error('Error getStats:', error);
    throw new HttpsError('internal', 'Error obteniendo estadísticas');
  }
});

exports.updateCita = onCall(async (data) => {
  try {
    const { id, estado, notas } = data;
    const update = {};
    if (estado) update.estado = estado;
    if (notas) update.notas = notas;
    update.actualizada = Date.now();
    await db.collection('citas_bot').doc(id).update(update);
    return { success: true };
  } catch (error) {
    logger.error('Error updateCita:', error);
    throw new HttpsError('internal', 'Error actualizando cita');
  }
});

/**
 * Callable: Enviar recordatorio de cita por WhatsApp.
 * Llamado desde el panel admin antes de una cita.
 */
exports.enviarRecordatorio = onCall(async (data) => {
  try {
    const { citaId, mensaje } = data;
    if (!citaId) throw new HttpsError('invalid-argument', 'citaId requerido');

    const doc = await db.collection('citas_bot').doc(citaId).get();
    if (!doc.exists) throw new HttpsError('not-found', 'Cita no encontrada');

    const cita = doc.data();
    const mensajeFinal = mensaje || [
      `Hola! Te recordamos tu cita en ${SALON_CONFIG.nombre}.`,
      `Solicitud registrada: ${cita.transcripcion || 'Ver detalles en el panel.'}`,
      'Para confirmar o reprogramar, responde este mensaje o llama al salon.',
    ].join('\n');

    await enviarWhatsApp(mensajeFinal);

    // Registrar recordatorio en Firestore
    await db.collection('notificaciones').add({
      tipo: 'recordatorio',
      citaId,
      mensaje: mensajeFinal,
      ts: Date.now(),
      leida: false,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error enviarRecordatorio:', error);
    throw new HttpsError('internal', 'Error enviando recordatorio: ' + error.message);
  }
});
