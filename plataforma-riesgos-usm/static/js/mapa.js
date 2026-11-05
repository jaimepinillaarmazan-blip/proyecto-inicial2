// 1. Inicializar el mapa centrado en la Casa Central de la USM (Latitud, Longitud)
var mapa = L.map('mapa-usm').setView([-33.0348, -71.5965], 16);

// 2. Cargar la capa visual del mapa (OpenStreetMap gratuito)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

// 3. Añadir un marcador de prueba en la entrada principal para verificar que funciona
var marcadorPrueba = L.marker([-33.0348, -71.5965]).addTo(mapa);
marcadorPrueba.bindPopup("<b>¡Mapa Funcionando!</b><br>Centro de la Casa Central USM.").openPopup();


// ==========================================
// NUEVA LÓGICA: REPORTES ESTILO WAZE
// ==========================================

let latitudActual = null;
let longitudActual = null;

// 4. Obtener la ubicación GPS del usuario al cargar la página
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitudActual = position.coords.latitude;
            longitudActual = position.coords.longitude;
            console.log("Ubicación GPS obtenida:", latitudActual, longitudActual);
        },
        (error) => {
            console.warn("No se pudo obtener la geolocalización automáticamente:", error.message);
        }
    );
}

// 5. Manejar la selección visual de las categorías en el modal
const botonesCat = document.querySelectorAll('.cat-btn');
const inputCategoria = document.getElementById('categoriaSeleccionada');

botonesCat.forEach(btn => {
    btn.addEventListener('click', () => {
        // Quitamos la clase 'active' a todos y se la ponemos al seleccionado
        botonesCat.forEach(b => b.classList.remove('active', 'btn-dark'));
        btn.classList.add('active', 'btn-dark');
        inputCategoria.value = btn.getAttribute('data-val');
    });
});

// 6. Enviar el reporte a Django cuando hagan clic en "Enviar Reporte"
document.getElementById('btnEnviarReporte').addEventListener('click', () => {
    const categoria = inputCategoria.value;
    const descripcion = document.getElementById('descripcion').value;

    if (!categoria) {
        alert("Por favor selecciona una categoría (Bache, Luminaria, etc.)");
        return;
    }

    // Si el GPS tarda o falla, usamos el centro de la USM por defecto como respaldo
    const latAEnviar = latitudActual || -33.0348;
    const lonAEnviar = longitudActual || -71.5965;

    // Petición AJAX (Fetch) hacia la ruta de tu backend
    fetch('/api/guardar-reporte/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            categoria: categoria,
            descripcion: descripcion,
            latitud: latAEnviar,
            longitud: lonAEnviar
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert("¡Reporte enviado con éxito!");
            location.reload(); // Recarga la página para mostrar el cambio
        } else {
            alert("Hubo un error al guardar: " + data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error de red:', error);
        alert("Error de conexión al servidor.");
    });
});