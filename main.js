const { Client,LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


const regexOp= /\bOp(erativo)?\b/gi;
const canalAdmin = '120363430202189129@newsletter';

const operativo1 = '5492646626422-1573439574@g.us'
const operativo2 = '5492645154002-1504281800@g.us'
const operativo3 = '5492645758661-1619047499@g.us'
const operativo4 = '120363155356920741@g.us'
const operativo5 = '5492645526785-1463415811@g.us'


// Este Set guardará los mensajes que ya enviamos al canal
const mensajesEnviados = new Set();

// Tiempo que debe pasar para que el bot vuelva a aceptar el mismo mensaje (ej: 30 minutos)
const TIEMPO_CACHE_MS = 30 * 60 * 1000;

gruposPermitidos = [
    operativo1,operativo2,operativo3,operativo4,operativo5
]

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'Cuentas',
        clientId: 'Cliente1',
    })
});


// 1. Definimos los eventos ANTES de inicializar
client.on('qr', qr => {
    console.log('Escanea este QR para iniciar sesión:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', async () => {
    console.log('¡Bot conectado y listo!');
    //await listarMisCanales(client);
    //await listarMisGrupos(client);
    extraerPorCuerpoOperativo(client);
});




function extraerPorCuerpoOperativo(client) {
    console.log("Escuchando mensajes de Operativos...");

    client.on('message', message => {
        if (message.fromMe) return;
        if (message.from === canalAdmin) return;

        if (gruposPermitidos.includes(message.from)) {
            
            const mensajeOriginal = message.body;
            const match = mensajeOriginal.match(regexOp);
            
            if (match) {
                // 1. Normalizamos el mensaje para compararlo mejor
                const textoNormalizado = normalizarTexto(mensajeOriginal);

                // 2. Verificamos si ya enviamos este mensaje recientemente
                if (mensajesEnviados.has(textoNormalizado)) {
                    console.log(`[DUPLICADO IGNORADO] ${textoNormalizado}`);
                    return; // Cortamos acá, no enviamos nada
                }

                // 3. Si es nuevo, lo enviamos al canal
                console.log(`¡Alerta Nueva! Enviando al Canal...`);
                enviarMensajeCanal(client, mensajeOriginal);

                // 4. Lo guardamos en nuestra memoria (Caché)
                mensajesEnviados.add(textoNormalizado);

                // 5. Programamos que se borre de la memoria después del tiempo definido
                setTimeout(() => {
                    mensajesEnviados.delete(textoNormalizado);
                    console.log(`Caché limpiado para: ${textoNormalizado}`);
                }, TIEMPO_CACHE_MS);
            }
        }
    });
}
async function enviarMensajeCanal(client, mensaje) {
        // Obtenemos el chat (que internamente será una instancia de Channel)
        try {
            await client.sendMessage(canalAdmin,mensaje)
            //await client.sendMessage(canalAdmin,mensaje);
            console.log('Mensaje enviado al canal con éxito');
            
        } catch (error) {
            console.log(error);
        }
        return;
}

// Convierte: "  OpERATivo en  salta!! " -> "operativo en salta"
function normalizarTexto(texto) {
    return texto.toLowerCase()
                .trim()
                .replace(/[^\w\s]/g, '') // Quita signos de puntuación (!, ?, .)
                .replace(/\s+/g, ' ');   // Quita espacios extra
}
/*
async function listarMisCanales(client) {
    console.log('Buscando canales...');
    
    // ✅ Agregamos el 'await' para esperar los datos reales
    const canales = await client.getChannels(); 
    
    // Ahora 'canales' ya no es una promesa, es un Array de objetos
    console.log('Tipo de dato:', typeof(canales)); 
    console.log('Contenido:', canales);

    if (canales.length === 0) {
        console.log("La lista de canales está vacía.");
    } else {
        canales.forEach(canal => {
            console.log(`Nombre: ${canal.name} | ID: ${canal.id._serialized}`);
        });
    }
}



async function listarMisGrupos(client) {
    console.log('\nBuscando grupos...');
    
    try {
        // Obtenemos todos los chats
        const chats = await client.getChats();
        
        // Filtramos solo los que son grupos
        const grupos = chats.filter(chat => chat.isGroup);
        
        if (grupos.length === 0) {
            console.log('No se encontró ningún grupo.');
            return;
        }
        
        console.log(`\n=== LISTA DE TUS GRUPOS (${grupos.length} encontrados) ===`);
        
        // Listamos nombre e ID
        grupos.forEach(grupo => {
            console.log(`Nombre: ${grupo.name}`);
            console.log(`ID: ${grupo.id._serialized}`);
            console.log('---------------------------');
        });
        
    } catch (error) {
        console.error('Error al obtener los grupos:', error);
    }
}
*/
// 3. Arrancamos el cliente
client.initialize();