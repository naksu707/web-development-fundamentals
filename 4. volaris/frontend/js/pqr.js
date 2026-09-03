let calificacionSeleccionada = 0;
let usuarioIdInvitadoEncontrado = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarVistaPQR();
    initEstrellasModal();
    initEventosModalPQR();
});

async function cargarVistaPQR() {
    const token = localStorage.getItem('token');
    const colPqr = document.getElementById('col-pqr');
    const colResenas = document.getElementById('col-resenas');
    const tituloResenas = document.getElementById('titulo-seccion-resenas');
    const btnCrearResena = document.getElementById('btn-crear-resena');
    const estadoResenas = document.getElementById('estado-resenas');
    const bloqueRedactarPqr = document.getElementById('bloque-redactar-pqr');
    const camposInvitado = document.getElementById('campos-invitado-pqr');
    const seccionEstadoPqrCliente = document.getElementById('seccion-estado-pqr-cliente');

    if (!token) {
        if (colResenas) colResenas.style.display = 'none';
        if (colPqr) {
            colPqr.classList.remove('col-lg-6');
            colPqr.classList.add('col-lg-12');
        }
        if (bloqueRedactarPqr) bloqueRedactarPqr.classList.remove('d-none');
        if (camposInvitado) camposInvitado.classList.remove('d-none');
        if (seccionEstadoPqrCliente) seccionEstadoPqrCliente.classList.add('d-none');
        return;
    }

    try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/resenas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);

        const data = await respuesta.json();
        const rolUsuario = (data.rol || '').toUpperCase();

        if (colPqr) {
            colPqr.classList.remove('col-lg-12');
            colPqr.classList.add('col-lg-6');
        }
        if (colResenas) colResenas.style.display = 'block';

        if (rolUsuario === 'AGENCIA') {
            if (tituloResenas) tituloResenas.textContent = 'Reseñas de clientes';
            if (btnCrearResena) btnCrearResena.classList.add('d-none');
            if (estadoResenas) estadoResenas.textContent = 'Últimas 10 reseñas recibidas';
            if (bloqueRedactarPqr) bloqueRedactarPqr.classList.add('d-none');
            if (seccionEstadoPqrCliente) seccionEstadoPqrCliente.classList.add('d-none');

        } else if (rolUsuario === 'CLIENTE') {
            if (tituloResenas) tituloResenas.textContent = 'Escribe tus reseñas';
            if (bloqueRedactarPqr) bloqueRedactarPqr.classList.remove('d-none');
            if (camposInvitado) camposInvitado.classList.add('d-none');

            const viajesPendientes = data.pendientes || [];
            if (btnCrearResena) {
                btnCrearResena.classList.remove('d-none');
                if (viajesPendientes.length > 0) {
                    btnCrearResena.disabled = false;
                    if (estadoResenas) estadoResenas.textContent = `Tienes ${viajesPendientes.length} reseña(s) pendiente(s)`;
                    poblarSelectViajesPendientes(viajesPendientes);
                } else {
                    btnCrearResena.disabled = true;
                    if (estadoResenas) estadoResenas.textContent = 'Actualmente no tienes reseñas pendientes';
                }
            }

            cargarReservasPQRCliente(token);
            if (seccionEstadoPqrCliente) {
                seccionEstadoPqrCliente.classList.remove('d-none');
                cargarTablaPQRsCliente(token);
            }
        }

        renderizarListaResenas(data.resenas || []);

    } catch (error) {
        console.error('Error al cargar la sección de reseñas:', error);
    }
}

async function cargarReservasPQRCliente(token) {
    const selectReserva = document.getElementById('selectReservaPQR');
    if (!selectReserva) return;

    try {
        const res = await fetch('http://127.0.0.1:5000/api/pqr/reservas-usuario', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reservas = await res.json();

        selectReserva.innerHTML = '<option value="" selected disabled>Selecciona una reserva</option>';
        reservas.forEach(r => {
            selectReserva.innerHTML += `
                <option value="${r.reserva_id}">
                    [${r.codigo || 'SIN-COD'}] ${r.destino} - Fecha Salida: ${r.fecha_salida} (${r.estado})
                </option>`;
        });
    } catch (e) {
        console.error('Error al cargar reservas para PQR:', e);
    }
}

function poblarSelectViajesPendientes(viajes) {
    const select = document.getElementById('selectViajePendiente');
    if (!select) return;

    select.innerHTML = '<option value="" selected disabled>Selecciona un viaje</option>';
    viajes.forEach(v => {
        select.innerHTML += `<option value="${v.id}">${v.destino}</option>`;
    });
}

function renderizarListaResenas(resenas) {
    const contenedor = document.getElementById('lista-resenas');
    if (!contenedor) return;

    if (resenas.length === 0) {
        contenedor.innerHTML = `<p class="text-muted small">No hay reseñas disponibles para mostrar.</p>`;
        return;
    }

    contenedor.innerHTML = resenas.map(r => `
        <div class="card border-0 bg-transparent mb-3">
            <div class="row g-3 align-items-start">
                <div class="col-auto">
                    <img src="${r.imagen_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80'}" 
                         alt="${r.titulo_viaje}" class="rounded-3 object-fit-cover" style="width: 110px; height: 80px;">
                </div>
                <div class="col">
                    <h3 class="h6 fw-bold mb-1 text-dark">${r.titulo_viaje}</h3>
                    <div class="text-warning small mb-1">
                        ${'★'.repeat(r.calificacion)}${'☆'.repeat(5 - r.calificacion)}
                    </div>
                    <p class="small text-muted mb-2">${r.comentario}</p>
                    <span class="small text-muted opacity-75 d-block" style="font-size: 0.75rem;">${r.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function cargarTablaPQRsCliente(token) {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/pqr/cliente', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pqrs = await res.json();
        const tbody = document.getElementById('tabla-estado-pqr-cliente');
        if (!tbody) return;

        if (pqrs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No has radicado ninguna PQR aún.</td></tr>';
            return;
        }

        tbody.innerHTML = pqrs.map(p => `
            <tr>
                <td class="fw-bold text-danger">${p.codigo_radicado}</td>
                <td><span class="badge bg-secondary">${p.tipo}</span></td>
                <td>${p.descripcion}</td>
                <td class="small text-muted">Reciente</td>
                <td>
                    <span class="badge ${p.estado === 'PENDIENTE' ? 'bg-warning text-dark' : 'bg-success'}">${p.estado}</span>
                </td>
                <td><small class="text-muted">${p.respuesta}</small></td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error al cargar PQRs cliente:', e);
    }
}

function initEstrellasModal() {
    const estrellas = document.querySelectorAll('#starRating i');
    estrellas.forEach((star) => {
        star.addEventListener('click', () => {
            calificacionSeleccionada = parseInt(star.getAttribute('data-star'));
            estrellas.forEach((s, idx) => {
                if (idx < calificacionSeleccionada) {
                    s.classList.remove('fa-regular');
                    s.classList.add('fa-solid');
                } else {
                    s.classList.remove('fa-solid');
                    s.classList.add('fa-regular');
                }
            });
        });
    });
}

function initEventosModalPQR() {
  
    document.getElementById('btnBuscarReservasInvitado')?.addEventListener('click', async () => {
        const numDoc = document.getElementById('pqrNumDoc').value.trim();
        const selectReserva = document.getElementById('selectReservaPQR');
        const msgError = document.getElementById('msg-no-reservas');
        const btnSubmit = document.getElementById('btnSubmitPQR');

        if (!numDoc) {
            Swal.fire('Atención', 'Ingresa un número de documento para realizar la búsqueda.', 'warning');
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/pqr/reservas-documento/${numDoc}`);
            const data = await res.json();

            if (res.ok && data.reservas.length > 0) {
                if (msgError) msgError.classList.add('d-none');
                if (btnSubmit) btnSubmit.disabled = false;
                usuarioIdInvitadoEncontrado = data.usuario_id;

                selectReserva.innerHTML = '<option value="" selected disabled>Selecciona una reserva</option>';
                data.reservas.forEach(r => {
                    selectReserva.innerHTML += `
                        <option value="${r.reserva_id}">
                            [${r.codigo || 'SIN-COD'}] ${r.destino} - Fecha Salida: ${r.fecha_salida} (${r.estado})
                        </option>`;
                });
            } else {
                selectReserva.innerHTML = '<option value="" selected disabled>Sin reservas disponibles</option>';
                if (msgError) msgError.classList.remove('d-none');
                if (btnSubmit) btnSubmit.disabled = true;
                usuarioIdInvitadoEncontrado = null;
            }
        } catch (e) {
            console.error('Error al consultar reservas por documento:', e);
        }
    });

    document.getElementById('formPQR')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const tipo = document.getElementById('tipoPQR').value;
        const descripcion = document.getElementById('descripcionPQR').value;
        const reserva_id = document.getElementById('selectReservaPQR').value;

        if (!reserva_id) {
            Swal.fire('Atención', 'Debes seleccionar una reserva válida asociada a tu documento.', 'warning');
            return;
        }

        const payload = {
            tipo,
            descripcion,
            reserva_id: parseInt(reserva_id)
        };

        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else if (usuarioIdInvitadoEncontrado) {
            payload['usuario_id'] = usuarioIdInvitadoEncontrado;
        }

        const res = await fetch('http://127.0.0.1:5000/api/pqr', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'PQR Radicada Exitosamente',
                text: `Tu código único de radicado es: ${data.codigo_radicado}`
            }).then(() => location.reload());
        } else {
            Swal.fire('Error', data.error || 'No se pudo radicar la PQR', 'error');
        }
    });

    document.getElementById('formResena')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const viaje_id = document.getElementById('selectViajePendiente').value;
        const mensaje = document.getElementById('mensajeResena').value;

        if (calificacionSeleccionada === 0) {
            Swal.fire('Atención', 'Por favor selecciona la calificación en estrellas.', 'warning');
            return;
        }

        const res = await fetch('http://127.0.0.1:5000/api/resenas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ viaje_id, calificacion: calificacionSeleccionada, mensaje })
        });

        if (res.ok) {
            Swal.fire('¡Éxito!', 'Tu reseña se ha publicado.', 'success').then(() => location.reload());
        } else {
            Swal.fire('Error', 'No se pudo guardar la reseña.', 'error');
        }
    });
}