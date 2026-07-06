// Store en memoria: lista de operativos activos con coords
const operativosActivos = [];

const DURACION_MS = 4 * 60 * 60 * 1000; // 4 horas

// Normaliza el texto para comparar duplicados (sin puntuación ni espacios extra)
function normalizarUbicacion(texto) {
    return texto
        .toLowerCase()
        .replace(/operativo:/gi, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
async function obtenerCoordenadas(textoEntrada) {
    let busqueda = textoEntrada
        .replace(/OPERATIVO:/gi, '')
        .replace(/Lado Sur|Lado Norte|Lado Este|Lado Oeste/gi, '')
        .replace(/\./g, '')
        .trim();

    const direccionFinal = busqueda + ", San Juan, Argentina";
    console.log("Buscando coordenadas para:", direccionFinal);

    const parametros = new URLSearchParams({
        q: direccionFinal,
        format: "json",
        limit: "1"
    });
    const urlCompleta = "https://nominatim.openstreetmap.org/search?" + parametros.toString();

    try {
        const response = await fetch(urlCompleta, {
            headers: {
                'User-Agent': 'BotWspOperativosSanJuan_v1.0 (contacto@tudominio.com)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Error Nominatim (${response.status})`);
            return null;
        }

        const datos = await response.json();

        if (datos && datos.length > 0) {
            return {
                lat: parseFloat(datos[0].lat),
                lng: parseFloat(datos[0].lon),
                nombre_encontrado: datos[0].display_name
            };
        }

        console.log("Sin resultados para:", direccionFinal);
        return null;

    } catch (error) {
        console.error("Error consultando Nominatim:", error);
        return null;
    }
}

// Agrega un operativo al store (llamado desde procesadorTexto.js).
// Si ya existe uno similar, resetea su timer por 4hs más.
async function agregarOperativo(textoLimpio) {
    const ubicacionNorm = normalizarUbicacion(textoLimpio);

    // Buscar duplicado existente
    const existente = operativosActivos.find(op => normalizarUbicacion(op.ubicacion) === ubicacionNorm);

    if (existente) {
        // Resetear timer: cancelar el anterior y crear uno nuevo por 4hs más
        clearTimeout(existente._timerId);
        existente.timestamp = new Date().toISOString();
        existente.reportes = (existente.reportes || 1) + 1;
        existente._timerId = setTimeout(() => eliminarOperativo(existente.id), DURACION_MS);

        console.log(`Operativo renovado por 4hs más (${existente.reportes} reportes): ${existente.ubicacion}`);
        return existente;
    }

    // Nuevo operativo
    const coords = await obtenerCoordenadas(textoLimpio);
    const operativo = {
        id: Date.now(),
        ubicacion: textoLimpio.replace(/OPERATIVO:/gi, '').trim(),
        texto: textoLimpio,
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null,
        timestamp: new Date().toISOString(),
        reportes: 1,
        _timerId: null
    };

    // Timer individual: se elimina solo a las 4hs
    operativo._timerId = setTimeout(() => eliminarOperativo(operativo.id), DURACION_MS);

    operativosActivos.push(operativo);
    console.log(`Operativo nuevo (expira en 4hs): ${operativo.ubicacion} | coords: ${coords ? `${coords.lat},${coords.lng}` : 'no encontradas'}`);
    return operativo;
}

function eliminarOperativo(id) {
    const idx = operativosActivos.findIndex(op => op.id === id);
    if (idx !== -1) {
        console.log(`Operativo expirado y eliminado: ${operativosActivos[idx].ubicacion}`);
        operativosActivos.splice(idx, 1);
    }
}

// Devuelve todos los operativos activos (usado por el servidor HTTP)
function getOperativos() {
    const mensajes = operativosActivos.map(({ _timerId, ...op }) => op);
    return { mensajes };
}

module.exports = { obtenerCoordenadas, agregarOperativo, getOperativos };