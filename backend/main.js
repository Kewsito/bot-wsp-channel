const { Client,LocalAuth, MessageAck } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const {transcribirAudio, formatearMensajeConIA} = require("./Features/controladorIA.js");
const {listarMisGrupos, listarMisCanales} = require("./Features/listar.js");
const {escucharMensajes} = require("./Features/procesadorTexto.js");
const fs = require('fs'); //Sistema de archivos
const http = require('http');
const { getOperativos } = require('./Features/api.js');
const { getAdmin } = require('./Features/canalesWSP.js');


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
    escucharMensajes(client);

    await client.sendMessage(getAdmin(), 'SERVICIO: Online. Bot Activo ✅');
    console.log('Mensaje de inicio enviado al canal.');
});

async function apagarBot(señal) {
    console.log(`Señal ${señal} recibida. Apagando bot...`);
    try {
        await client.sendMessage(getAdmin(), 'SERVICIO: En mantenimiento. Bot Apagado 🔴');
        console.log('Mensaje de apagado enviado al canal.');
    } catch (error) {
        console.error('No se pudo enviar el mensaje de apagado:', error);
    } finally {
        process.exit(0);
    }
}

process.on('SIGINT', () => apagarBot('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => apagarBot('SIGTERM')); // kill / systemd stop

// 3. Arrancamos el cliente
client.initialize();

const API_PORT = process.env.API_PORT || 3001;
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/api/operativos') {
    const body = getOperativos();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(body));
  }

  res.writeHead(404, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('Not Found');
});

server.listen(API_PORT, () => {
  console.log(`API server listening on http://localhost:${API_PORT}`);
});