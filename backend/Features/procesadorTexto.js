const TIEMPO_CACHE_MS = 60 * 60 * 1000;

// Tiempo que esperamos para acumular mensajes del mismo usuario antes de enviarlos a la IA
const VENTANA_ACUMULACION_MS = 8 * 1000; // 8 segundos

const { grupos, getAdmin } = require('./canalesWSP.js');
const { transcribirAudio, formatearMensajeConIA } = require("./controladorIA.js");
const { agregarOperativo } = require('./api.js');
const fs = require('fs');

const gruposPermitidos = grupos();
const mensajesEnviados = new Set();

// Acumulador: { [userId]: { mensajes: [], timerId } }
const colasUsuario = {};

function escucharMensajes(client) {
    try {
        client.on('message_create', async (message) => {
            const canalAdmin = getAdmin();
            if (message.from === canalAdmin) return;

            const esGrupoPrueba = message.from === '120363407894842075@g.us';
            if (message.fromMe && esGrupoPrueba) return;

            if (gruposPermitidos.includes(message.id.remote)) {
                console.log("Analizando mensaje entrante...");
                const textoAnalizar = message.body;

                if (!textoAnalizar) {
                    console.log('Sticker o imagen detectada. FALSO_POSITIVO');
                    return;
                } else if (message.type === 'chat') {
                    acumularMensaje(message.author || message.from, textoAnalizar, client);
                } else if (message.hasMedia && message.type === 'ptt') {
                    console.log("Audio detectado");
                    await enviarAIA(message, client);
                }
            }
        });
    } catch (error) {
        console.log("Error al conectar bot:", error);
    }
}

// Acumula mensajes del mismo usuario. Cuando pasan VENTANA_ACUMULACION_MS
// sin nuevos mensajes, une todo y lo manda a la IA.
function acumularMensaje(userId, texto, client) {
    if (!colasUsuario[userId]) {
        colasUsuario[userId] = { mensajes: [], timerId: null };
    }

    const cola = colasUsuario[userId];
    cola.mensajes.push(texto);
    console.log(`[Cola ${userId}] ${cola.mensajes.length} mensaje(s) acumulado(s): "${texto}"`);

    // Reiniciar el timer cada vez que llega un mensaje nuevo
    clearTimeout(cola.timerId);
    cola.timerId = setTimeout(async () => {
        const textoUnido = cola.mensajes.join(' ');
        console.log(`[Cola ${userId}] Ventana cerrada. Enviando a IA: "${textoUnido}"`);
        cola.mensajes = [];
        delete colasUsuario[userId];
        await extraerTexto(textoUnido, client);
    }, VENTANA_ACUMULACION_MS);
}

async function enviarAIA(message, client) {
    console.log("Transcribiendo audio con Groq...");
    try {
        const media = await message.downloadMedia();
        const tempFilePath = `./temp_audio_${Date.now()}.ogg`;
        fs.writeFileSync(tempFilePath, media.data, 'base64');
        const textoTranscripto = await transcribirAudio(tempFilePath);
        fs.unlinkSync(tempFilePath);
        // Los audios se mandan directo, no se acumulan
        await extraerTexto(textoTranscripto, client);
    } catch (error) {
        console.error("Error procesando audio:", error);
    }
}

async function extraerTexto(textoAnalizar, client) {
    console.log("Texto a analizar:", textoAnalizar);

    if (!analizarConRegex(textoAnalizar)) {
        console.log("Falso positivo (regex).");
        return;
    }

    console.log(`Sospechoso detectado. Enviando a IA...`);
    const textoNormalizado = normalizarTexto(textoAnalizar);
    const mensajeLimpio = await formatearMensajeConIA(textoNormalizado);
    console.log("Respuesta IA:", mensajeLimpio);

    if (mensajeLimpio.includes('FALSO_POSITIVO')) {
        console.log("Descartado por la IA.");
        return;
    }

    if (mensajesEnviados.has(mensajeLimpio)) {
        console.log(`Duplicado ignorado: ${mensajeLimpio}`);
        return;
    }

    console.log(`¡Alerta nueva! → ${mensajeLimpio}`);

    await agregarOperativo(mensajeLimpio);

    if (client) {
        const canalAdmin = getAdmin();
        await enviarMensajeCanal(client, canalAdmin, mensajeLimpio);
    }

    mensajesEnviados.add(mensajeLimpio);
    setTimeout(() => {
        mensajesEnviados.delete(mensajeLimpio);
        console.log(`Caché limpiado: ${mensajeLimpio}`);
    }, TIEMPO_CACHE_MS);
}

function analizarConRegex(texto) {
    const regexOp = /\b(Op(erativo)?|control)\b/gi;
    if (!texto.match(regexOp)) {
        console.log("Sin 'operativo' o 'control'. FALSO POSITIVO.");
        return false;
    }
    return true;
}

function normalizarTexto(texto) {
    return texto.toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ');
}

async function enviarMensajeCanal(client, canalAdmin, mensaje) {
    try {
        await client.sendMessage(canalAdmin, mensaje);
        console.log('Mensaje enviado al canal.');
    } catch (error) {
        console.error('Error al enviar al canal:', error);
    }
}

module.exports = { escucharMensajes };
