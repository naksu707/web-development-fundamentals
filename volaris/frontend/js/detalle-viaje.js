const API_BASE_URL = "http://127.0.0.1:5000/api/viajes";

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalleViaje();
});

async function cargarDetalleViaje() {
    const urlParams = new URLSearchParams(window.location.search);
    const viajeId = urlParams.get("id");

    if (!viajeId) {
        window.location.href = "catalogo-viajes.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${viajeId}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const viaje = await response.json();

        const origen = viaje.origen || "Origen por confirmar";
        const destino = viaje.destino || "Destino por confirmar";
        
        document.getElementById("detalle-titulo").textContent = `${origen} a ${destino}`;
        document.getElementById("badge-tipo").textContent = viaje.tipo_salida || "NACIONAL";
        document.getElementById("badge-categoria").textContent = viaje.categoria || "General";
        document.getElementById("badge-agencia").innerHTML = `<i class="fas fa-building me-1"></i>${viaje.nombre_agencia || 'Volaris Partner'}`;

        document.getElementById("detalle-origen").textContent = origen;
        document.getElementById("detalle-destino").textContent = destino;
        document.getElementById("detalle-duracion").textContent = viaje.duracion_dias ? `${viaje.duracion_dias} Días` : (viaje.duracion_viaje || "Por definir");
        document.getElementById("detalle-cupos-totales").textContent = `${viaje.cupos_totales || 0} personas`;
        document.getElementById("detalle-descripcion").textContent = viaje.descripcion || "Sin descripción disponible.";

        if (viaje.imagen_url) {
            document.getElementById("detalle-imagen").src = viaje.imagen_url;
        }

        if (viaje.fecha_salida) {
            const [y, m, d] = viaje.fecha_salida.split('-');
            const fechaSalida = new Date(y, m - 1, d);
            document.getElementById("detalle-fecha-salida").textContent = fechaSalida.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        if (viaje.fecha_llegada) {
            const [y, m, d] = viaje.fecha_llegada.split('-');
            const fechaLlegada = new Date(y, m - 1, d);
            document.getElementById("detalle-fecha-llegada").textContent = fechaLlegada.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            document.getElementById("detalle-fecha-llegada").textContent = "Según itinerario";
        }

        const elemItinerario = document.getElementById("detalle-itinerario");
        if (viaje.itinerario_dias && viaje.itinerario_dias.length > 0) {
            elemItinerario.className = "d-flex flex-column gap-3 bg-transparent p-0";
            elemItinerario.innerHTML = viaje.itinerario_dias.map(item => `
                <div class="p-3 bg-light rounded-3 border-start border-4 border-danger shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-danger rounded-pill px-2 py-1">Día ${item.dia_numero}</span>
                        ${item.hora_inicio ? `<small class="text-muted fw-semibold"><i class="far fa-clock me-1"></i>${item.hora_inicio}</small>` : ''}
                    </div>
                    <h6 class="fw-bold text-dark mb-1">${item.titulo || 'Actividad del día'}</h6>
                    <p class="text-muted small mb-0">${item.descripcion || ''}</p>
                </div>
            `).join('');
        } else if (viaje.itinerario) {
            elemItinerario.style.whiteSpace = "pre-line";
            elemItinerario.textContent = viaje.itinerario;
        } else {
            elemItinerario.innerHTML = `<p class="text-muted small mb-0">Sin itinerario detallado disponible.</p>`;
        }

        const precio = viaje.precio_base ?? viaje.precio;
        if (precio !== undefined && precio !== null) {
            document.getElementById("detalle-precio").textContent = `$${Number(precio).toLocaleString('es-CO')} COP`;
        }

        const elemCupos = document.getElementById("detalle-cupos");
        const btnReservar = document.getElementById("btn-reservar");

        if (viaje.cupos_disponibles > 0) {
            elemCupos.className = "badge bg-success rounded-pill px-3 py-2 fs-6";
            elemCupos.textContent = `${viaje.cupos_disponibles} disponibles`;
        } else {
            elemCupos.className = "badge bg-danger rounded-pill px-3 py-2 fs-6";
            elemCupos.textContent = "Agotado";
            if (btnReservar) {
                btnReservar.disabled = true;
                btnReservar.textContent = "Sin cupos disponibles";
            }
        }

    } catch (error) {
        console.error("Error al obtener detalle del viaje:", error);
    }
}