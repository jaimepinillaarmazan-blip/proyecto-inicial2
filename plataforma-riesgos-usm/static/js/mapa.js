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
// 3. Función para descargar los reportes de SQLite y dibujarlos
async function cargarReportes() {
    try {
        const respuesta = await fetch('/api/reportes');
        const reportes = await respuesta.json();

        const contenedorLista = document.getElementById('lista-reportes');
        contenedorLista.innerHTML = ''; 

        // Leer los votos guardados en el navegador para saber si ya votó
        let votosGuardados = JSON.parse(localStorage.getItem('votos_usm')) || [];

        reportes.forEach(reporte => {
            
            // 🎨 SELECCIONAR COLOR DEL PIN SEGÚN EL TIPO
            let colorUrl = 'blue'; 
            let colorHex = '#3388ff';

            switch (reporte.tipo) {
                case 'Obstáculo en vía': colorUrl = 'orange'; colorHex = '#e67e22'; break;
                case 'Problema de Iluminación': colorUrl = 'gold'; colorHex = '#f1c40f'; break;
                case 'Actividad Sospechosa': colorUrl = 'red'; colorHex = '#e74c3c'; break;
                case 'Daño en Infraestructura': colorUrl = 'violet'; colorHex = '#8e44ad'; break;
            }

            let pinIcono = new L.Icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorUrl}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });

            let marcador = L.marker([reporte.latitud, reporte.longitud], { icon: pinIcono }).addTo(mapa);
            
            marcador.bindPopup(`
                <b style="color: ${colorHex};">${reporte.tipo}</b><br>
                ${reporte.descripcion}<br>
                <hr style="margin: 5px 0;">
                <small>🕒 Desaparece en: ${reporte.duracion_horas} hora(s)</small>
            `);

            // --- Lógica para el estado de los votos ---
            let textoEstado = "";
            let claseEstado = "";
            
            if (reporte.likes > 0 || reporte.dislikes > 0) {
                if (reporte.likes > reporte.dislikes) {
                    textoEstado = "Reporte positivo"; claseEstado = "estado-positivo";
                } else if (reporte.dislikes > reporte.likes) {
                    textoEstado = "Reporte negativo"; claseEstado = "estado-negativo";
                } else {
                    textoEstado = "Reporte neutro"; claseEstado = "estado-neutro";
                }
            }

            // Verificamos si este reporte en particular ya fue votado por el usuario
            let yaVoto = votosGuardados.includes(reporte.id);
            let atributoDeshabilitado = yaVoto ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';

            // Tarjeta en el dashboard con borde indicador de color y botones
            let tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-reporte';
            tarjeta.style.borderLeft = `5px solid ${colorHex}`;
            tarjeta.innerHTML = `
                <h4 style="color: ${colorHex};">${reporte.tipo}</h4>
                <p>${reporte.descripcion}</p>
                <small>Duración: ${reporte.duracion_horas} Hora(s)</small>
                
                <div class="seccion-votos">
                    <button onclick="votar(${reporte.id}, 'like')" class="btn-voto" ${atributoDeshabilitado}>👍 ${reporte.likes}</button>
                    <button onclick="votar(${reporte.id}, 'dislike')" class="btn-voto" ${atributoDeshabilitado}>👎 ${reporte.dislikes}</button>
                    <span class="${claseEstado}">${textoEstado}</span>
                </div>
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

    // Borramos el pin anterior si el usuario hace clic en otro lado
    if (marcadorTemporal) {
        mapa.removeLayer(marcadorTemporal);
    }
    
    // Ponemos un pin nuevo donde hizo clic
    coordenadasSeleccionadas = e.latlng; // Guardamos las coordenadas exactas
    marcadorTemporal = L.marker(coordenadasSeleccionadas).addTo(mapa);
    marcadorTemporal.bindPopup("<b>Ubicación seleccionada</b><br>Presiona el botón azul abajo para reportar un incidente aquí.").openPopup();
    const marcadorSeleccionado = marcadorTemporal;
    marcadorSeleccionado.on('popupclose', function() {
        mapa.removeLayer(marcadorSeleccionado);
        if (marcadorTemporal === marcadorSeleccionado) {
            marcadorTemporal = null;
            coordenadasSeleccionadas = null;
        }
    });
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
    document.getElementById('desc-incidente').value = "";
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
// 7. Función global para enviar el voto y bloquear múltiples intentos
window.votar = async function(id, tipo) {
    // Revisamos la memoria del navegador
    let votosGuardados = JSON.parse(localStorage.getItem('votos_usm')) || [];
    
    // Si el ID del reporte ya está guardado, detenemos el proceso
    if (votosGuardados.includes(id)) {
        alert("Ya has calificado este reporte anteriormente.");
        return;
    }

    try {
        await fetch(`/api/reportes/${id}/votar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipo })
        });
        
        // Guardamos el ID del reporte en la memoria del navegador
        votosGuardados.push(id);
        localStorage.setItem('votos_usm', JSON.stringify(votosGuardados));
        
        // Recargar pines y tarjetas
        mapa.eachLayer((layer) => {
            if (!!layer.toGeoJSON) mapa.removeLayer(layer); 
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
        cargarReportes(); 
    } catch (error) {
        console.error("Error al enviar el voto:", error);
    }
};