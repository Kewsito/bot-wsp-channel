const fs = require('fs');

function leerArchivo() {
    try {
        const data = fs.readFileSync('./Features/campoPruebas.txt', 'utf8');
        const lineas = data.split(/\r?\n/).filter(linea => linea.trim() !== '');
        
        if (lineas.length === 0) return null;

        const indiceAleatorio = Math.floor(Math.random() * lineas.length);
        console.log("Mensaje aleatorio seleccionado:", lineas[indiceAleatorio]);
        return lineas[indiceAleatorio];
    } catch (error) {
        console.error("Error al leer el archivo:", error);
        return null;
    }
}



module.exports = { leerArchivo };

// Ejemplo de uso:
// const lineaAleatoria = leerArchivo();
// console.log("Línea seleccionada:", lineaAleatoria);
