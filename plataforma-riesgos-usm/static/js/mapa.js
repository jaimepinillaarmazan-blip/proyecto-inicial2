// 1. Limitar el mapa al área visible al alejarlo al máximo
var centroMapa = [-33.0348, -71.5965];
var mapa = L.map('mapa-usm', { minZoom: 14, maxBoundsViscosity: 1.0 }).setView(centroMapa, 14);
var areaPermitida = mapa.getBounds();
mapa.setMaxBounds(areaPermitida);
mapa.setView(centroMapa, 16);

// 2. Cargar la capa visual de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

// Variables para guardar la ubicación que el usuario elija
var marcadorTemporal = null;
var coordenadasSeleccionadas = null;

// 3. Función para descargar los reportes de SQLite y dibujarlos
async function cargarReportes() {
    try {
        const respuesta = await fetch('/api/reportes');
        const reportes = await respuesta.json();

        const contenedorLista = document.getElementById('lista-reportes');
        contenedorLista.innerHTML = ''; // Limpiamos la lista antes de actualizar

        // Dibujar cada reporte en el mapa y en el dashboard
        reportes.forEach(reporte => {
            // Pin en el mapa
            let marcador = L.marker([reporte.latitud, reporte.longitud]).addTo(mapa);
            marcador.bindPopup(`
                <b style="color: #004d99;">${reporte.tipo}</b><br>
                ${reporte.descripcion}<br>
                <hr style="margin: 5px 0;">
                <small>🕒 Desaparece en: ${reporte.duracion_horas} hora(s)</small>
            `);

            // Tarjeta en el dashboard
            let tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-reporte';
            tarjeta.innerHTML = `
                <h4>${reporte.tipo}</h4>
                <p>${reporte.descripcion}</p>
                <small>Duración: ${reporte.duracion_horas} Hora(s)</small>
            `;
            contenedorLista.appendChild(tarjeta);
        });
    } catch (error) {
        console.error("Error al cargar los reportes:", error);
    }
}

// 4. Permitir al usuario hacer clic en el mapa para seleccionar la ubicación del incidente
mapa.on('click', function(e) {
    if (!areaPermitida.contains(e.latlng)) {
        alert("Solo puedes colocar reportes dentro del área inicial del mapa.");
        return;
    }

    coordenadasSeleccionadas = e.latlng; // Guardamos las coordenadas exactas
    
    // Borramos el pin anterior si el usuario hace clic en otro lado
    if (marcadorTemporal) {
        mapa.removeLayer(marcadorTemporal);
    }
    
    // Ponemos un pin nuevo donde hizo clic
    marcadorTemporal = L.marker(coordenadasSeleccionadas).addTo(mapa);
    marcadorTemporal.bindPopup("<b>Ubicación seleccionada</b><br>Presiona el botón azul abajo para reportar un incidente aquí.").openPopup();
});

// 5. Configurar los botones y el formulario emergente
const modal = document.getElementById('modal-reporte');
const btnReportar = document.getElementById('btn-reportar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnEnviar = document.getElementById('btn-enviar');

// Al presionar el botón azul debajo del mapa
btnReportar.addEventListener('click', function() {
    if (!coordenadasSeleccionadas) {
        alert("Por favor, haz clic en el mapa primero para indicar dónde está el problema.");
        return;
    }
    modal.classList.remove('oculto'); // Muestra el formulario
});

// Al presionar "Cancelar"
btnCancelar.addEventListener('click', function() {
    modal.classList.add('oculto'); // Oculta el formulario
});

// Al presionar "Guardar Reporte" (Enviar datos a la Base de Datos)
btnEnviar.addEventListener('click', async function() {
    const tipo = document.getElementById('tipo-incidente').value;
    const desc = document.getElementById('desc-incidente').value;
    const duracion = document.getElementById('duracion-incidente').value;

    if (desc.trim() === "") {
        alert("Por favor, escribe una breve descripción.");
        return;
    }

    // NUEVO: Validador de máximo 250 palabras
    const cantidadPalabras = desc.trim().split(/\s+/).length;
    if (cantidadPalabras > 250) {
        alert("La descripción es muy larga. El máximo permitido es de 250 palabras.");
        return;
    }

    // Armamos el paquete de datos para enviar a Python
    const nuevoReporte = {
        latitud: coordenadasSeleccionadas.lat,
        longitud: coordenadasSeleccionadas.lng,
        tipo: tipo,
        descripcion: desc,
        duracion_horas: parseInt(duracion)
    };

    try {
        const respuesta = await fetch('/api/reportes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoReporte)
        });

        if (respuesta.ok) {
            modal.classList.add('oculto'); // Cerramos el formulario
            document.getElementById('desc-incidente').value = ""; // Limpiamos el texto
            
            // Recargamos los reportes para que aparezca el nuevo inmediatamente
            mapa.eachLayer((layer) => {
                if (!!layer.toGeoJSON) mapa.removeLayer(layer); // Limpiamos pines viejos
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
            cargarReportes(); 
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema al guardar el reporte.");
    }
});

// 6. Cargar los reportes al abrir la página
cargarReportes();