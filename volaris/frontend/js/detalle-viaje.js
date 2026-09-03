const API_BASE_URL = "http://127.0.0.1:5000/api/viajes";

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalleViaje();
});

async function cargarDetalleViaje() {
    const urlParams = new URLSearchParams(window.location.search);
    const viajeId = urlParams.get("id");

    if (!viajeId) {
        window.location.href = "viajes.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${viajeId}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const viaje = await response.json();

        const origen = viaje.origen || "Origen por confirmar";
        const destino = viaje.destino || "Destino por confirmar";
        
        document.getElementById("detalle-titulo").textContent = `${origen} a ${destino}`;
        
        const badgeTipo = document.getElementById("badge-tipo");
        badgeTipo.textContent = viaje.tipo_salida || "NACIONAL";
        badgeTipo.style.backgroundColor = "#ff3838";

        document.getElementById("badge-categoria").textContent = viaje.categoria || "General";
        document.getElementById("badge-agencia").innerHTML = `<i class="fas fa-building me-1"></i>${viaje.nombre_agencia || 'Volaris Partner'}`;

        document.getElementById("detalle-origen").textContent = origen;
        document.getElementById("detalle-destino").textContent = destino;
        document.getElementById("detalle-duracion").textContent = viaje.duracion_dias ? `${viaje.duracion_dias} Días` : "Por definir";
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
            elemItinerario.className = "accordion accordion-flush border rounded-4 overflow-hidden shadow-sm";
            elemItinerario.innerHTML = viaje.itinerario_dias.map((item, idx) => `
                <div class="accordion-item border-bottom">
                    <h2 class="accordion-header" id="heading-${idx}">
                        <button class="accordion-button ${idx === 0 ? '' : 'collapsed'} fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${idx}" aria-expanded="${idx === 0 ? 'true' : 'false'}" aria-controls="collapse-${idx}">
                            <span class="badge rounded-pill me-2 text-white" style="background-color: #ff3838;">Día ${item.dia_numero}</span>
                            ${item.titulo || 'Actividad del día'}
                            ${item.hora_inicio ? `<small class="text-muted ms-auto pe-3"><i class="far fa-clock me-1"></i>${item.hora_inicio}</small>` : ''}
                        </button>
                    </h2>
                    <div id="collapse-${idx}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" aria-labelledby="heading-${idx}" data-bs-parent="#accordionItinerario">
                        <div class="accordion-body text-muted leading-relaxed small bg-light">
                            ${item.descripcion || 'Sin detalles adicionales para este día.'}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            elemItinerario.innerHTML = `<p class="text-muted small p-3 bg-light rounded-3 mb-0">Sin itinerario detallado disponible.</p>`;
        }

        const contComentarios = document.getElementById("contenedor-comentarios");
        const badgeComentarios = document.getElementById("total-comentarios-badge");

        if (viaje.comentarios && viaje.comentarios.length > 0) {
            badgeComentarios.textContent = `${viaje.comentarios.length} Opiniones`;
            contComentarios.innerHTML = viaje.comentarios.map(c => `
                <div class="p-3 bg-light rounded-3 border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <img src="${c.usuario_foto || 'assets/iconos/icon.png'}" class="rounded-circle" width="32" height="32" style="object-fit: cover;">
                            <span class="fw-bold text-dark small">${c.usuario_nombre}</span>
                        </div>
                        <small class="text-muted" style="font-size: 0.75rem;">${c.fecha_formateada}</small>
                    </div>
                    <div class="mb-2 text-warning small">
                        ${'★'.repeat(c.calificacion)}${'☆'.repeat(5 - c.calificacion)}
                    </div>
                    <p class="text-secondary small mb-0">${c.mensaje}</p>
                </div>
            `).join('');
        } else {
            badgeComentarios.textContent = `0 Opiniones`;
            contComentarios.innerHTML = `<p class="text-muted small p-3 bg-light rounded-3 mb-0">Aún no hay opiniones escritas sobre este viaje. ¡Sé el primero en reservar y opinar!</p>`;
        }

        const precio = viaje.precio_base ?? viaje.precio;
        if (precio !== undefined && precio !== null) {
            const elemPrecio = document.getElementById("detalle-precio");
            elemPrecio.textContent = `$${Number(precio).toLocaleString('es-CO')} COP`;
            elemPrecio.style.color = "#ff3838";
        }

        const elemCupos = document.getElementById("detalle-cupos");
        const btnReservar = document.getElementById("btn-reservar");

        if (viaje.cupos_disponibles > 0) {
            elemCupos.className = "badge bg-success rounded-pill px-3 py-2 fs-6";
            elemCupos.textContent = `${viaje.cupos_disponibles} disponibles`;
            
            if (btnReservar) {
                btnReservar.disabled = false;
                btnReservar.style.backgroundColor = "#ff3838";
                btnReservar.style.borderColor = "#ff3838";
                btnReservar.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = `formulario-reserva.html?id=${viajeId}`;
                };
            }
        } else {
            elemCupos.className = "badge bg-danger rounded-pill px-3 py-2 fs-6";
            elemCupos.style.backgroundColor = "#ff3838";
            elemCupos.textContent = "Agotado";
            if (btnReservar) {
                btnReservar.disabled = true;
                btnReservar.style.backgroundColor = "#ff3838";
                btnReservar.style.borderColor = "#ff3838";
                btnReservar.textContent = "Sin cupos disponibles";
            }
        }

    } catch (error) {
        console.error("Error al obtener detalle del viaje:", error);
    }
}