
const API = require('./Features/canalesWSP.js').getApiIA();

const fs = require('fs'); //Sistema de archivos
const Groq = require('groq-sdk'); //Groq

// Instanciamos el cliente de Groq
const groq = new Groq({ apiKey: API });

// Transcripción con Whisper en Groq
async function transcribirAudio(filePath) {
    console.log("Entro a transcribir audio")
    try {
        const transcripcion = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "es", // Ayuda mucho a la precisión forzar el idioma
        });
        return transcripcion.text;
    } catch (error) {
        console.error("Error transcribiendo con Groq:", error);
        return "";
    }
}

// Limpieza de texto gratuita con Llama 3 en Groq
async function formatearMensajeConIA(textoNormalizado) {
    try {
        // Los modelos open-source como Llama a veces son muy "conversacionales".
        // Este prompt es muy estricto para evitar que te responda con "¡Claro, aquí tienes!"
        const prompt = `
        Eres un sistema de ruteo de alertas de tránsito en San Juan, Argentina.
        Tu única función es leer el texto del usuario, extraer la ubicación del control policial u operativo, y devolver una cadena estandarizada.
        
        REGLAS ESTRICTAS:
        1. Formato de salida obligatorio: "OPERATIVO: [Ubicación] [Opcional:Altura o kilometro] - [Opcional: Departamento]".
        2. NO agregues saludos, ni explicaciones, ni comillas. Solo la salida final.
        3. Si el texto es una pregunta ("¿hay op?"), una broma, o no especifica un lugar, devuelve exactamente la palabra: FALSO_POSITIVO.
        4. El texto debe incluir obligatoriamente la ubicación entre calles en donde se encuentra el operativo o el kilometro, o la calle por donde se encuentra el operativo, sino devuelve exactamente la palabra: FALSO_POSITIVO.
        
        EJEMPLOS DE COMPORTAMIENTO:

        Usuario: "Op en lateral de circunvalación y españa, lado sur"
        Salida:  OPERATIVO: Lateral circunvalación y España. Lado Sur.

        Usuario: "alguien sabe si hay operativo en el centro"
        Salida: FALSO_POSITIVO

        Usuario: "algo por albardon"
        Salida: FALSO_POSITIVO
        
        Usuario: "Chicos este grupoo es de operativo unicamente"
        Salida:  FALSO_POSITIVO
        
        Usuario: "Cuidado muchachos, operativo de tránsito antes de saavedra por calle salta"
        Salida:  OPERATIVO: Calle Salta antes de Saavedra

        Usuario: "Busco flete economico en Rawson"
        Salida: FALSO_POSITIVO

        Usuario: "Operativo x calle mendoza antes de circunvalación"
        Salida:  OPERATIVO: Calle Mendoza y Circunvalación
        
        Usuario: "Lateral de circunvalación pasando España, yendo hacia Mendoza paran todo"
        Salida:  OPERATIVO: Lateral Circunvalación pasando España. Camino a Mendoza.
        
        Usuario: "Entrada de albardon libre"
        Salida: FALSO_POSITIVO
        
        Usuario: "República del Líbano pasano meglioli como alos 500mts oeste ambos lados operativo"
        Salida: OPERATIVO: República del Líbano y Meglioli. Oeste.
        
        Usuario: "libre albardon"
        Salida: FALSO_POSITIVO
        
        Usuario: "Operativo ruta 40 pasando 5 hacia el norte"
        Salida: OPERATIVO: Ruta 40 pasando Calle 5. Norte.
        
        Usuario: "Operativo ruta 40 pasando 5 hacia el norte"
        Salida: OPERATIVO: Ruta 40 pasando Calle 5. Norte.
        
        Usuario: "¿alguien vio operativo en calle Mendoza?"
        Salida: FALSO_POSITIVO
        
        Texto del usuario: "${textoNormalizado}"
        `;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant", // Modelo súper rápido y gratuito
            temperature: 0.1, // Casi cero creatividad, solo sigue instrucciones
        });

        formatearMensajeParaAPI( response.choices[0].message.content.trim());
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error limpiando texto con Groq:", error);
        return "FALSO_POSITIVO"; // Ante la duda, no enviamos nada
    }
}

// Limpieza de texto gratuita con Llama 3 en Groq
async function formatearMensajeParaAPI(textoNormalizado) {
    try {
        // Los modelos open-source como Llama a veces son muy "conversacionales".
        // Este prompt es muy estricto para evitar que te responda con "¡Claro, aquí tienes!"
        const prompt = `
        Eres un sistema de ruteo de alertas de tránsito en San Juan, Argentina.
        Tu única función es leer el texto del usuario, extraer la ubicación del control policial u operativo, y devolverlo para API de OpenStreetMap.
        
        REGLAS ESTRICTAS:
        1. Formato de salida obligatorio: "OPERATIVO: [Ubicación] [Opcional:Altura o kilometro] - [Opcional: Departamento]".
        2. NO agregues saludos, ni explicaciones, ni comillas. Solo la salida final.
        3. Si el texto es una pregunta ("¿hay op?"), una broma, o no especifica un lugar, devuelve exactamente la palabra: FALSO_POSITIVO.
        4. El texto debe incluir obligatoriamente la ubicación entre calles en donde se encuentra el operativo o el kilometro, o la calle por donde se encuentra el operativo, sino devuelve exactamente la palabra: FALSO_POSITIVO.
        
        EJEMPLOS DE COMPORTAMIENTO:

        Usuario: "Op en lateral de circunvalación y españa, lado sur"
        Salida:  OPERATIVO: Lateral circunvalación y España. Lado Sur.

        Usuario: "alguien sabe si hay operativo en el centro"
        Salida: FALSO_POSITIVO

        Usuario: " OPERATIVO: Calle Salta antes de Saavedra"
        Salida:  {
                "mensajes": [
                    {
                    "id": "user",
                    "callePrincipal": "Calle Salta",
                    "calle1": "Neuquen",
                    "calle2": "Patagonia"
                    },
                }

        Usuario: "algo por albardon"
        Salida: FALSO_POSITIVO
        
        Usuario: "Chicos este grupoo es de operativo unicamente"
        Salida:  FALSO_POSITIVO
        
        Usuario: "Cuidado muchachos, operativo de tránsito antes de saavedra por calle salta"
        Salida:  OPERATIVO: Calle Salta antes de Saavedra

        Usuario: "Busco flete economico en Rawson"
        Salida: FALSO_POSITIVO

        Usuario: "Operativo x calle mendoza antes de circunvalación"
        Salida:  OPERATIVO: Calle Mendoza y Circunvalación
        
        Usuario: "Lateral de circunvalación pasando España, yendo hacia Mendoza paran todo"
        Salida:  OPERATIVO: Lateral Circunvalación pasando España. Camino a Mendoza.
        
        Usuario: "Entrada de albardon libre"
        Salida: FALSO_POSITIVO
        
        Usuario: "República del Líbano pasano meglioli como alos 500mts oeste ambos lados operativo"
        Salida: OPERATIVO: República del Líbano y Meglioli. Oeste.
        
        Usuario: "libre albardon"
        Salida: FALSO_POSITIVO
        
        Usuario: "Operativo ruta 40 pasando 5 hacia el norte"
        Salida: OPERATIVO: Ruta 40 pasando Calle 5. Norte.
        
        Usuario: "Operativo ruta 40 pasando 5 hacia el norte"
        Salida: OPERATIVO: Ruta 40 pasando Calle 5. Norte.
        
        Usuario: "¿alguien vio operativo en calle Mendoza?"
        Salida: FALSO_POSITIVO
        
        Texto del usuario: "${textoNormalizado}"
        `;

        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant", // Modelo súper rápido y gratuito
            temperature: 0.1, // Casi cero creatividad, solo sigue instrucciones
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error limpiando texto con Groq:", error);
        return "FALSO_POSITIVO"; // Ante la duda, no enviamos nada
    }
}

module.exports = {
    transcribirAudio,
    formatearMensajeConIA
};