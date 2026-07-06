
async function listarMisCanales(client) {
    console.log('Buscando canales...');
    
    // ✅ Agregamos el 'await' para esperar los datos reales
    const canales = await client.getChannels(); 
    
    // Ahora 'canales' ya no es una promesa, es un Array de objetos
    //console.log('Tipo de dato:', typeof(canales)); 
    //console.log('Contenido:', canales);

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

module.exports = {
    listarMisCanales,
    listarMisGrupos
}