const API_RESERVA_DETALLE_URL = "http://127.0.0.1:5000/api/reservas/detalle";
const BACKEND_HOST = "http://127.0.0.1:5000";
var COLOR_ROJO = window.PRIMARY_RED || "#ff3838";

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalleReserva();
});

async function cargarDetalleReserva() {
    const urlParams = new URLSearchParams(window.location.search);
    const reservaId = urlParams.get("id") || urlParams.get("reserva_id");

    if (!reservaId) {
        window.location.href = "perfil.html";
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_RESERVA_DETALLE_URL}/${reservaId}`, { headers });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        renderizarDetalles(data);

    } catch (error) {
        console.error("Error al cargar detalle de reserva:", error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'No se encontró la reserva',
                text: 'No fue posible obtener la información de esta reserva.',
                confirmButtonColor: COLOR_ROJO
            });
        }
    }
}

function renderizarDetalles(data) {
    const reserva = data.reserva || {};
    const viaje = data.viaje || {};
    const pasajeros = data.pasajeros || [];

    const elCodigo = document.getElementById("reserva-codigo");
    if (elCodigo) {
        elCodigo.textContent = `Código de Reserva: #${reserva.codigo || 'N/A'}`;
    }

    // ----------------------------------------------------
    // ACTUALIZACIÓN DINÁMICA DEL ESTADO Y BADGE
    // ----------------------------------------------------
    const estadoRaw = (reserva.estado || reserva.estado_reserva || 'PENDIENTE').toUpperCase();
    const elEstadoBadge = document.getElementById("detalle-estado-badge");

    if (elEstadoBadge) {
        elEstadoBadge.textContent = estadoRaw;
        elEstadoBadge.className = "badge rounded-pill px-3 py-2 fs-6";

        if (estadoRaw === 'CONFIRMADA') {
            elEstadoBadge.classList.add("bg-success");
        } else if (estadoRaw === 'PENDIENTE') {
            elEstadoBadge.classList.add("bg-warning", "text-dark");
        } else if (estadoRaw === 'CANCELADA') {
            elEstadoBadge.classList.add("bg-danger");
        } else {
            elEstadoBadge.classList.add("bg-secondary");
        }
    }

    // ----------------------------------------------------
    // DATOS BÁSICOS DEL VIAJE
    // ----------------------------------------------------
    const origen = viaje.origen || "Origen por confirmar";
    const destino = viaje.destino || "Destino por confirmar";

    document.getElementById("detalle-viaje-titulo").textContent = `${origen} a ${destino}`;
    document.getElementById("detalle-origen").textContent = origen;
    document.getElementById("detalle-destino").textContent = destino;
    document.getElementById("detalle-descripcion").textContent = viaje.descripcion || "Sin descripción disponible.";

    if (viaje.categoria) {
        const elCat = document.getElementById("detalle-categoria-badge");
        if (elCat) elCat.textContent = viaje.categoria;
    }

    if (viaje.fecha_salida) {
        const [y, m, d] = String(viaje.fecha_salida).split("T")[0].split("-").map(Number);
        const fSalida = new Date(y, m - 1, d);
        document.getElementById("detalle-fecha-salida").textContent = fSalida.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (viaje.fecha_llegada) {
        const [y, m, d] = String(viaje.fecha_llegada).split("T")[0].split("-").map(Number);
        const fLlegada = new Date(y, m - 1, d);
        document.getElementById("detalle-fecha-llegada").textContent = fLlegada.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } else {
        document.getElementById("detalle-fecha-llegada").textContent = "Según itinerario";
    }

    const elImg = document.getElementById("detalle-viaje-imagen");
    if (elImg) {
        let url = viaje.imagen_url || 'assets/imagenes/default.jpg';
        if (url.startsWith('/uploads/')) url = `${BACKEND_HOST}${url}`;
        elImg.src = url;
    }

    const elemItinerario = document.getElementById("detalle-itinerario");
    if (elemItinerario) {
        if (viaje.itinerario_dias && viaje.itinerario_dias.length > 0) {
            elemItinerario.className = "d-flex flex-column gap-3 bg-transparent p-0";
            elemItinerario.innerHTML = viaje.itinerario_dias.map(item => `
                <div class="p-3 bg-light rounded-3 border-start border-4 shadow-sm" style="border-left-color: ${COLOR_ROJO} !important;">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge rounded-pill px-2 py-1 text-white" style="background-color: ${COLOR_ROJO};">Día ${item.dia_numero}</span>
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
    }

    // ----------------------------------------------------
    // RESUMEN DEL PAGO Y ESTADO LATERAL
    // ----------------------------------------------------
    const totalPersonas = pasajeros.length > 0 ? pasajeros.length : (reserva.cantidad_cupos || 1);
    document.getElementById("reserva-cantidad-personas").textContent = `${totalPersonas} persona${totalPersonas > 1 ? 's' : ''}`;
    document.getElementById("count-pasajeros").textContent = totalPersonas;

    const precioTotal = Number(reserva.precio_final || 0);
    document.getElementById("reserva-valor-total").textContent = `$${precioTotal.toLocaleString('es-CO')} COP`;

    if (reserva.fecha_reserva_formateada) {
        document.getElementById("reserva-fecha-registro").textContent = reserva.fecha_reserva_formateada;
    }

    const cajaEstadoPago = document.querySelector(".col-lg-4 .card .border-start");
    if (cajaEstadoPago) {
        if (estadoRaw === 'CONFIRMADA') {
            cajaEstadoPago.innerHTML = `
                <i class="fa-solid fa-circle-check text-success fs-4 mb-2"></i>
                <p class="small text-muted mb-0">Pago registrado y confirmado exitosamente en el sistema Volaris.</p>
            `;
        } else if (estadoRaw === 'PENDIENTE') {
            cajaEstadoPago.innerHTML = `
                <i class="fa-solid fa-clock text-warning fs-4 mb-2"></i>
                <p class="small text-muted mb-0">Reserva pendiente de confirmación de pago.</p>
            `;
        } else if (estadoRaw === 'CANCELADA') {
            cajaEstadoPago.innerHTML = `
                <i class="fa-solid fa-circle-xmark text-danger fs-4 mb-2"></i>
                <p class="small text-muted mb-0">Esta reserva ha sido cancelada.</p>
            `;
        }
    }

    // ----------------------------------------------------
    // PASAJEROS
    // ----------------------------------------------------
    const containerPasajeros = document.getElementById("lista-pasajeros-container");
    containerPasajeros.innerHTML = "";

    if (pasajeros.length === 0) {
        const titular = data.usuario || {};
        containerPasajeros.innerHTML = `
            <div class="p-3 bg-light rounded-3 border shadow-sm">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark"><i class="fa-solid fa-user me-2" style="color: ${COLOR_ROJO};"></i>${titular.nombre || 'Pasajero'} ${titular.apellido || ''}</span>
                    <span class="badge bg-secondary">Titular</span>
                </div>
                <div class="row g-2 small text-muted">
                    <div class="col-12 col-md-6">Documento: <strong>${titular.tipo_doc || 'CC'} ${titular.numero_doc || '-'}</strong></div>
                    <div class="col-12 col-md-6">Email: <strong>${titular.email || '-'}</strong></div>
                </div>
            </div>
        `;
    } else {
        pasajeros.forEach((p, idx) => {
            const esTitular = idx === 0;
            containerPasajeros.innerHTML += `
                <div class="p-3 bg-light rounded-3 border shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold text-dark">
                            <i class="fa-solid fa-user-check me-2" style="color: ${COLOR_ROJO};"></i>${p.nombre || ''} ${p.apellido || ''}
                        </span>
                        <span class="badge ${esTitular ? 'bg-danger' : 'bg-secondary'}" style="${esTitular ? `background-color: ${COLOR_ROJO} !important;` : ''}">
                            ${esTitular ? 'Titular' : `Pasajero #${idx + 1}`}
                        </span>
                    </div>
                    <div class="row g-2 small text-muted">
                        <div class="col-12 col-md-6">Documento: <strong>${p.tipo_documento || 'CC'} ${p.numero_documento || p.numero_doc || '-'}</strong></div>
                        <div class="col-12 col-md-6">Teléfono: <strong>${p.telefono || p.celular || '-'}</strong></div>
                        <div class="col-12">Email: <strong>${p.email || '-'}</strong></div>
                    </div>
                </div>
            `;
        });
    }
}