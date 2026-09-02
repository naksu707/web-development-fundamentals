const API_BASE_URL = "http://127.0.0.1:5000/api/viajes";
const RESERVAS_API_URL = "http://127.0.0.1:5000/api/reservas";
const BACKEND_HOST = "http://127.0.0.1:5000";

var COLOR_ROJO = window.PRIMARY_RED || "#ff3838";

let viajeActual = null;
let precioUnitarioCalculado = 0;
let aplicaDescuentoUltimaHora = false;
let pasajerosCount = 1;

document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaReserva();
});

async function inicializarVistaReserva() {
    const urlParams = new URLSearchParams(window.location.search);
    const viajeId = urlParams.get("id");

    if (!viajeId) {
        window.location.href = "catalogo-viajes.html";
        return;
    }

    verificarSesionYAutollenar();

    try {
        const response = await fetch(`${API_BASE_URL}/${viajeId}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        viajeActual = await response.json();

        if (Number(viajeActual.cupos_disponibles) <= 0) {
            await Swal.fire({
                icon: 'error',
                title: 'Sin cupos disponibles',
                text: 'Lo sentimos, este viaje ya no tiene cupos para reservar.',
                confirmButtonColor: COLOR_ROJO
            });
            window.location.href = `detalle-viaje.html?id=${viajeId}`;
            return;
        }

        renderizarDetalleViaje(viajeActual);
        evaluarDescuentoUltimaHora(viajeActual);
        actualizarResumenPrecios();

        const btnAgregar = document.getElementById("btn-agregar-pasajero");
        if (btnAgregar) {
            btnAgregar.addEventListener("click", () => {
                agregarPasajeroAdicional();
            });
        }

        const formReserva = document.getElementById("form-reserva");
        if (formReserva) {
            formReserva.addEventListener("submit", procesarReserva);
        }

    } catch (error) {
        console.error("Error al cargar la información del viaje:", error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo obtener la información del viaje.',
                confirmButtonColor: COLOR_ROJO
            });
        }
    }
}

function verificarSesionYAutollenar() {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");
    const alertNoSesion = document.getElementById("alert-no-sesion");

    const elNombre = document.getElementById("nombre-0");
    const elApellido = document.getElementById("apellido-0");
    const elTipoDoc = document.getElementById("tipo-doc-0");
    const elNumDoc = document.getElementById("num-doc-0");
    const elEmail = document.getElementById("email-0");
    const elCelular = document.getElementById("celular-0");

    const campos = [elNombre, elApellido, elTipoDoc, elNumDoc, elEmail, elCelular];

    if (token && usuarioRaw) {
        if (alertNoSesion) alertNoSesion.classList.add("d-none");
        try {
            const usuario = JSON.parse(usuarioRaw);
            
            if (elNombre) elNombre.value = usuario.nombre || "";
            if (elApellido) elApellido.value = usuario.apellido || "";
            if (elTipoDoc && (usuario.tipo_doc || usuario.tipo_documento)) {
                elTipoDoc.value = usuario.tipo_doc || usuario.tipo_documento;
            }
            if (elNumDoc) elNumDoc.value = usuario.numero_doc || usuario.numero_documento || "";
            if (elEmail) elEmail.value = usuario.email || "";
            if (elCelular) elCelular.value = usuario.numero_telefono || usuario.telefono || usuario.celular || "";

            campos.forEach(campo => {
                if (campo) campo.disabled = true;
            });

        } catch (e) {
            console.error("Error al interpretar usuario del localStorage:", e);
        }
    } else {
        if (alertNoSesion) alertNoSesion.classList.remove("d-none");

        campos.forEach(campo => {
            if (campo) campo.disabled = false;
        });
    }
}

function renderizarDetalleViaje(viaje) {
    const origen = viaje.origen || "Origen por confirmar";
    const destino = viaje.destino || "Destino por confirmar";

    const elDestino = document.getElementById("reserva-destino");
    const elOrigen = document.getElementById("reserva-origen");
    const elDesc = document.getElementById("reserva-descripcion");
    const elImg = document.getElementById("reserva-imagen");

    if (elDestino) elDestino.textContent = `${origen} a ${destino}`;
    if (elOrigen) elOrigen.innerHTML = `<i class="fa-solid fa-plane-departure me-1" style="color: ${COLOR_ROJO};"></i>Desde ${origen}`;
    if (elDesc) elDesc.textContent = viaje.descripcion || "Sin descripción disponible.";

    if (elImg) {
        let url = viaje.imagen_url || 'assets/imagenes/default.jpg';
        if (url.startsWith('/uploads/')) {
            url = `${BACKEND_HOST}${url}`;
        }
        elImg.src = url;
    }
}

function evaluarDescuentoUltimaHora(viaje) {
    const precioBase = Number(viaje.precio_base ?? viaje.precio ?? 0);

    if (viaje.fecha_salida) {
        const fechaLimpia = String(viaje.fecha_salida).split("T")[0];
        const partes = fechaLimpia.split("-").map(Number);
        
        if (partes.length === 3) {
            const [y, m, d] = partes;
            const fechaSalida = new Date(y, m - 1, d);
            const hoy = new Date();

            fechaSalida.setHours(0, 0, 0, 0);
            hoy.setHours(0, 0, 0, 0);

            const diferenciaMs = fechaSalida - hoy;
            const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

            if (diferenciaDias >= 0 && diferenciaDias <= 3 && Number(viaje.cupos_disponibles) > 0) {
                aplicaDescuentoUltimaHora = true;
                precioUnitarioCalculado = precioBase * 0.5;

                const badgePromo = document.getElementById("badge-descuento-promo");
                const filaDcto = document.getElementById("fila-descuento");
                if (badgePromo) badgePromo.classList.remove("d-none");
                if (filaDcto) filaDcto.classList.remove("d-none");
                return;
            }
        }
    }

    aplicaDescuentoUltimaHora = false;
    precioUnitarioCalculado = precioBase;
    const badgePromo = document.getElementById("badge-descuento-promo");
    const filaDcto = document.getElementById("fila-descuento");
    if (badgePromo) badgePromo.classList.add("d-none");
    if (filaDcto) filaDcto.classList.add("d-none");
}

function actualizarResumenPrecios() {
    const precioBaseOriginal = Number(viajeActual?.precio_base ?? viajeActual?.precio ?? 0);
    const totalPagar = pasajerosCount * precioUnitarioCalculado;
    const montoDescuentoTotal = aplicaDescuentoUltimaHora ? (precioBaseOriginal * 0.5 * pasajerosCount) : 0;

    const elNum = document.getElementById("reserva-num-pasajeros");
    const elBase = document.getElementById("reserva-precio-base");
    const elMontoDcto = document.getElementById("reserva-monto-descuento");
    const elTotal = document.getElementById("reserva-precio-total");

    if (elNum) elNum.textContent = `${pasajerosCount} Pasajero${pasajerosCount > 1 ? 's' : ''}`;
    if (elBase) elBase.textContent = `$${precioBaseOriginal.toLocaleString("es-CO")} COP`;
    if (aplicaDescuentoUltimaHora && elMontoDcto) {
        elMontoDcto.textContent = `-$${montoDescuentoTotal.toLocaleString("es-CO")} COP`;
    }
    if (elTotal) elTotal.textContent = `$${totalPagar.toLocaleString("es-CO")} COP`;
}

function agregarPasajeroAdicional() {
    if (pasajerosCount >= Number(viajeActual.cupos_disponibles)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Límite de cupos alcanzado',
                text: `Solo quedan ${viajeActual.cupos_disponibles} cupos disponibles para este viaje.`,
                confirmButtonColor: COLOR_ROJO
            });
        }
        return;
    }

    const index = pasajerosCount;
    pasajerosCount++;

    const container = document.getElementById("pasajeros-adicionales-container");
    if (!container) return;

    const divPasajero = document.createElement("div");
    divPasajero.className = "card border-0 shadow-sm rounded-4 p-4 mb-4 pasajero-card";
    divPasajero.id = `pasajero-card-${index}`;

    divPasajero.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-dark mb-0"><i class="fa-solid fa-user-plus me-2" style="color: ${COLOR_ROJO};"></i>Pasajero #${index + 1}</h5>
            <button type="button" class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarPasajero(${index})" title="Eliminar pasajero">
                <i class="fa-solid fa-trash-can fs-6"></i>
            </button>
        </div>

        <div class="row g-3">
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Nombre</label>
                <input type="text" class="form-control" id="nombre-${index}" required placeholder="Ej. Ana">
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Apellido</label>
                <input type="text" class="form-control" id="apellido-${index}" required placeholder="Ej. Gómez">
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Tipo de Documento</label>
                <select class="form-select" id="tipo-doc-${index}" required>
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="TI">Tarjeta de Identidad (TI)</option>
                </select>
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Número de Documento</label>
                <input type="text" class="form-control" id="num-doc-${index}" required placeholder="Ej. 1098123456">
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Correo Electrónico</label>
                <input type="email" class="form-control" id="email-${index}" placeholder="correo@ejemplo.com (Opcional)">
            </div>
            <div class="col-12 col-md-6">
                <label class="form-label small fw-semibold">Teléfono Celular</label>
                <input type="tel" class="form-control" id="celular-${index}" placeholder="300 000 0000 (Opcional)">
            </div>
        </div>
    `;

    container.appendChild(divPasajero);
    actualizarResumenPrecios();
}

window.eliminarPasajero = function(index) {
    const tarjeta = document.getElementById(`pasajero-card-${index}`);
    if (tarjeta) {
        tarjeta.remove();
        pasajerosCount--;
        actualizarResumenPrecios();
    }
};

async function procesarReserva(e) {
    e.preventDefault();

    const form = document.getElementById("form-reserva");
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const listaPasajeros = [];

    for (let i = 0; i < pasajerosCount; i++) {
        const nombre = document.getElementById(`nombre-${i}`)?.value;
        const apellido = document.getElementById(`apellido-${i}`)?.value;
        const tipoDoc = document.getElementById(`tipo-doc-${i}`)?.value;
        const numDoc = document.getElementById(`num-doc-${i}`)?.value;
        const email = document.getElementById(`email-${i}`)?.value || "";
        const celular = document.getElementById(`celular-${i}`)?.value || "";

        if (!nombre || !apellido || !numDoc) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: `Por favor completa la información requerida del Pasajero #${i + 1}.`,
                    confirmButtonColor: COLOR_ROJO
                });
            }
            return;
        }

        listaPasajeros.push({
            nombre,
            apellido,
            tipo_documento: tipoDoc,
            numero_documento: numDoc,
            email,
            telefono: celular
        });
    }

    const payload = {
        id_viaje: viajeActual.id || viajeActual.id_viaje,
        cantidad_cupos: pasajerosCount,
        precio_unitario: precioUnitarioCalculado,
        total_pagado: pasajerosCount * precioUnitarioCalculado,
        aplica_descuento_ultima_hora: aplicaDescuentoUltimaHora,
        pasajeros: listaPasajeros
    };

    const btnConfirmar = document.getElementById("btn-confirmar-reserva");
    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Validando cupos...`;
    }

    try {
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(RESERVAS_API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.mensaje || resultado.error || "No fue posible procesar la reserva debido a sobreventa o falta de cupos.");
        }

        const codigoFormateado = resultado.codigo || resultado.codigo_reserva || "N/A";

        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'success',
                title: '¡Reserva Confirmada!',
                html: `Tu reserva <strong>#${codigoFormateado}</strong> de ${pasajerosCount} cupo(s) para ${viajeActual.destino || 'el destino'} ha sido procesada con éxito.`,
                confirmButtonColor: COLOR_ROJO
            });
        }

        window.location.href = token ? "perfil.html" : "catalogo-viajes.html";

    } catch (error) {
        console.error("Error al procesar la reserva:", error);

       const idNumerico = resultado.id_reserva || resultado.id || "";
        const codigoFormateado = resultado.codigo || resultado.codigo_reserva || "N/A";

        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'success',
                title: '¡Reserva Confirmada!',
                html: `Tu reserva <strong>#${codigoFormateado}</strong> de ${pasajerosCount} cupo(s) para ${viajeActual.destino || 'el destino'} ha sido procesada con éxito.`,
                confirmButtonColor: COLOR_ROJO
            });
        }

        window.location.href = `destino-detalle.html?id=${idNumerico}`;

        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = `<i class="fa-solid fa-lock me-2"></i>Confirmar Reserva`;
        }
    }
}