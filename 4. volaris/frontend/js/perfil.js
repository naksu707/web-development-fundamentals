let usuarioActual = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");

    if (!token || !usuarioRaw) {
        window.location.href = "login.html";
        return;
    }

    usuarioActual = JSON.parse(usuarioRaw);
    renderizarNavbarSesion(usuarioActual);

    actualizarDatosUsuarioUI(usuarioActual);

    const btnEditar = document.getElementById("btn-editar-perfil");
    if (btnEditar) {
        btnEditar.addEventListener("click", () => abrirModalEditarPerfil(usuarioActual, token));
    }

    const rol = (usuarioActual.rol || 'CLIENTE').toUpperCase();

    if (rol === 'AGENCIA') {
        configurarVistaAgencia(usuarioActual, token);
    } else {
        configurarVistaCliente(usuarioActual, token);
    }
});

// ------------------------------------------
// HELPER PARA SEPARAR CÓDIGO DE PAÍS Y TELÉFONO
// ------------------------------------------
function formatearTelefono(telefonoRaw) {
    if (!telefonoRaw) return { indicativo: '+57', numero: '' };
    
    if (telefonoRaw.startsWith('+')) {
        const indicativo = telefonoRaw.substring(0, 3);
        const numero = telefonoRaw.substring(3).trim();
        return { indicativo, numero };
    }
    
    return { indicativo: '+57', numero: telefonoRaw.trim() };
}

// ------------------------------------------
// HELPER PARA BADGES DE ESTADO
// ------------------------------------------
function obtenerBadgeEstado(estado) {
    const estadoUpper = String(estado || '').toUpperCase();
    const estados = {
        'CONFIRMADA': '<span class="badge bg-success">Confirmada</span>',
        'PENDIENTE': '<span class="badge bg-warning text-dark">Pendiente</span>',
        'COMPLETADA': '<span class="badge bg-info text-dark">Completada</span>',
        'CANCELADA': '<span class="badge bg-danger">Cancelada</span>'
    };
    return estados[estadoUpper] || `<span class="badge bg-secondary">${estado || 'N/A'}</span>`;
}

// ------------------------------------------
// VISTA CLIENTE
// ------------------------------------------
async function configurarVistaCliente(usuario, token) {
    document.getElementById("titulo-seccion-derecha").textContent = "Tus próximos viajes";
    document.getElementById("titulo-seccion-inferior").textContent = "Historial de viajes";

    const API_RESERVAS = `http://127.0.0.1:5000/api/reservas/usuario/${usuario.id}`;

    try {
        const res = await fetch(API_RESERVAS, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Error obteniendo datos");

        const data = await res.json();
        
        actualizarDatosUsuarioUI(data.usuario);

        const reservas = data.reservas || [];
        const proximos = reservas.filter(r => r.estado_reserva === 'CONFIRMADA' || r.estado_reserva === 'PENDIENTE');
        const historial = reservas.filter(r => r.estado_reserva === 'COMPLETADA' || r.estado_reserva === 'CANCELADA');

        renderizarProximosViajes(proximos);
        renderizarHistorialViajes(historial);

    } catch (error) {
        console.error(error);
        document.getElementById("contenedor-proximos-viajes").innerHTML = `<p class="text-muted small">No hay reservas próximas disponibles.</p>`;
        document.getElementById("contenedor-historial-viajes").innerHTML = `<p class="text-muted small">No hay historial disponible.</p>`;
    }
}

// ------------------------------------------
// VISTA AGENCIA (HU-10 INTEGRADA)
// ------------------------------------------
async function configurarVistaAgencia(usuario, token) {
    document.getElementById("titulo-seccion-derecha").textContent = "Solicitudes pendientes";
    document.getElementById("titulo-seccion-inferior").textContent = "Tus respuestas y soluciones";

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/reservas/usuario/${usuario.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            actualizarDatosUsuarioUI(data.usuario);
        }
    } catch (e) {
        console.warn("No se pudo cargar info detallada del usuario:", e);
    }

    cargarSolicitudesPendientesAgencia(token);
    cargarRespuestasAgencia(token);
}

async function cargarSolicitudesPendientesAgencia(token) {
    const cont = document.getElementById("contenedor-proximos-viajes");
    try {
        const res = await fetch("http://127.0.0.1:5000/api/pqr/agencia/pendientes", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const pqrs = await res.json();

        if (!res.ok || pqrs.length === 0) {
            cont.innerHTML = `<p class="text-muted small">No hay solicitudes pendientes.</p>`;
            return;
        }

        cont.innerHTML = pqrs.map(p => {
            const respuestaEscapada = (p.respuesta || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const esEnRevision = p.estado && p.estado.toUpperCase().includes('REVIS');
            const textoBoton = esEnRevision ? 'Editar Respuesta' : 'Responder PQR';
            const badgeEstado = esEnRevision 
                ? '<span class="badge bg-info text-dark ms-2">EN REVISIÓN</span>' 
                : '';

            return `
                <div class="p-3 bg-white rounded-3 shadow-sm border mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <span class="fw-bold text-danger">${p.codigo_radicado}</span>
                            ${badgeEstado}
                        </div>
                        <span class="badge bg-warning text-dark">${p.tipo}</span>
                    </div>
                    <p class="small text-dark mb-1"><strong>Cliente:</strong> ${p.cliente_nombre || 'Invitado'} ${p.cliente_apellido || ''}</p>
                    <p class="small text-muted mb-2"><strong>Detalle:</strong> ${p.descripcion}</p>
                    <button class="btn btn-volaris btn-sm fw-semibold px-3" 
                            onclick="abrirModalResponderPQR(${p.id}, '${p.codigo_radicado}', '${respuestaEscapada}', '${p.estado}', '${token}')">
                        ${textoBoton}
                    </button>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Error cargando solicitudes pendientes:", e);
        cont.innerHTML = `<p class="text-muted small">No hay solicitudes pendientes.</p>`;
    }
}

function abrirModalResponderPQR(pqrId, codigoRadicado, respuestaActual = '', estadoActual = 'PENDIENTE', token) {
    Swal.fire({
        title: `Gestionar PQR ${codigoRadicado}`,
        html: `
            <div class="text-start">
                <label class="form-label fw-semibold small">Escribe la respuesta oficial para el cliente:</label>
                <textarea id="swal-respuesta-pqr" class="form-control mb-3" rows="4" placeholder="Ingresa los detalles de la solución o respuesta...">${respuestaActual}</textarea>
                
                <label class="form-label fw-semibold small">Estado de la solicitud:</label>
                <select id="swal-estado-pqr" class="form-select">
                    <option value="EN REVISION" ${estadoActual.includes('REVIS') ? 'selected' : ''}>En revisión (Se valida con el área encargada)</option>
                    <option value="RESUELTO" ${estadoActual === 'RESUELTO' ? 'selected' : ''}>Resuelto (Cierra la PQR)</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Respuesta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff3838',
        preConfirm: () => {
            const respuesta = document.getElementById('swal-respuesta-pqr').value.trim();
            const estado = document.getElementById('swal-estado-pqr').value;

            if (!respuesta) {
                Swal.showValidationMessage('La respuesta no puede estar vacía.');
                return false;
            }

            return { respuesta, estado };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/pqr/${pqrId}/responder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(result.value)
                });

                if (res.ok) {
                    Swal.fire('¡Actualizado!', 'La respuesta y el estado se han guardado exitosamente.', 'success')
                        .then(() => location.reload());
                } else {
                    Swal.fire('Error', 'No se pudo guardar la respuesta.', 'error');
                }
            } catch (err) {
                console.error("Error al responder PQR:", err);
            }
        }
    });
}

async function cargarRespuestasAgencia(token) {
    const cont = document.getElementById("contenedor-historial-viajes");
    try {
        const res = await fetch("http://127.0.0.1:5000/api/pqr/agencia/respondidas", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const pqrs = await res.json();

        if (!res.ok || pqrs.length === 0) {
            cont.innerHTML = `<p class="text-muted small">No hay respuestas registradas.</p>`;
            return;
        }

        cont.innerHTML = pqrs.map(p => `
            <div class="p-3 bg-white rounded-3 shadow-sm border mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark">${p.codigo_radicado}</span>
                    <span class="badge bg-success">RESUELTO</span>
                </div>
                <p class="small text-muted mb-1"><strong>Cliente:</strong> ${p.cliente_nombre || 'Cliente'}</p>
                <p class="small text-dark mb-0"><strong>Respuesta enviada:</strong> ${p.respuesta}</p>
            </div>
        `).join('');

    } catch (e) {
        console.error("Error cargando respuestas de agencia:", e);
        cont.innerHTML = `<p class="text-muted small">No hay respuestas registradas.</p>`;
    }
}

// ------------------------------------------
// ACTUALIZAR INFORMACIÓN EN PANTALLA Y MEMORIA
// ------------------------------------------
function actualizarDatosUsuarioUI(u) {
    if (!u) return;

    usuarioActual = { ...usuarioActual, ...u };
    localStorage.setItem("usuario", JSON.stringify(usuarioActual));

    const imgElem = document.getElementById("perfil-img");
    if (u.imagen_url && u.imagen_url.trim() !== "") {
        imgElem.src = u.imagen_url.startsWith("http") ? u.imagen_url : `http://127.0.0.1:5000${u.imagen_url}`;
    } else {
        imgElem.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80";
    }

    const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();
    document.getElementById("perfil-nombre").textContent = nombreCompleto || 'Usuario';

    if (u.email) {
        document.getElementById("perfil-email").textContent = u.email;
    }

    const telRaw = u.numero_telefono || u.telefono || '';
    if (telRaw) {
        const { indicativo, numero } = formatearTelefono(telRaw);
        document.getElementById("perfil-telefono").textContent = `${indicativo} ${numero}`;
    } else {
        document.getElementById("perfil-telefono").textContent = 'Sin teléfono registrado';
    }

    const fechaBase = u.fecha_registro || u.fecha_creacion;
    if (fechaBase) {
        const fechaRegistro = new Date(fechaBase);
        const hoy = new Date();
        const diffMeses = (hoy.getFullYear() - fechaRegistro.getFullYear()) * 12 + (hoy.getMonth() - fechaRegistro.getMonth());
        
        const textoAntiguedad = diffMeses <= 0 ? 'Hace menos de 1 mes' : `Hace ${diffMeses} ${diffMeses === 1 ? 'mes' : 'meses'}`;
        document.getElementById("perfil-antiguedad").textContent = textoAntiguedad;
    }
}

// ------------------------------------------
// MODAL DE EDICIÓN DE PERFIL
// ------------------------------------------
function abrirModalEditarPerfil(usuario, token) {
    const telRaw = usuario.numero_telefono || usuario.telefono || '';
    const { indicativo, numero } = formatearTelefono(telRaw);

    Swal.fire({
        title: 'Editar Perfil',
        width: '550px',
        html: `
            <div class="row g-2 text-start">
                <div class="col-6 mb-2">
                    <label class="form-label fw-semibold small">Nombre*</label>
                    <input type="text" id="swal-nombre" class="form-control" value="${usuario.nombre || ''}">
                </div>
                <div class="col-6 mb-2">
                    <label class="form-label fw-semibold small">Apellido</label>
                    <input type="text" id="swal-apellido" class="form-control" value="${usuario.apellido || ''}">
                </div>

                <div class="col-4 mb-2">
                    <label class="form-label fw-semibold small">Cód. País</label>
                    <select id="swal-indicativo" class="form-select">
                        <option value="+57" ${indicativo === '+57' ? 'selected' : ''}>+57 (COL)</option>
                        <option value="+52" ${indicativo === '+52' ? 'selected' : ''}>+52 (MEX)</option>
                        <option value="+54" ${indicativo === '+54' ? 'selected' : ''}>+54 (ARG)</option>
                        <option value="+56" ${indicativo === '+56' ? 'selected' : ''}>+56 (CHL)</option>
                        <option value="+51" ${indicativo === '+51' ? 'selected' : ''}>+51 (PER)</option>
                        <option value="+1"  ${indicativo === '+1'  ? 'selected' : ''}>+1 (USA)</option>
                    </select>
                </div>
                <div class="col-8 mb-2">
                    <label class="form-label fw-semibold small">Teléfono</label>
                    <input type="tel" id="swal-telefono" class="form-control" name="telef_no_autocompletar" autocomplete="off" value="${numero}">
                </div>

                <div class="col-12 mb-2">
                    <label class="form-label fw-semibold small">Género</label>
                    <select id="swal-genero" class="form-select">
                        <option value="Femenino" ${usuario.genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
                        <option value="Masculino" ${usuario.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="Otro" ${usuario.genero === 'Otro' ? 'selected' : ''}>Otro / Prefiero no decir</option>
                    </select>
                </div>
                <div class="col-12 mb-2">
                    <label class="form-label fw-semibold small">Foto de perfil (Opcional)</label>
                    <input type="file" id="swal-imagen" class="form-control" accept="image/*">
                </div>
                <div class="col-12 mb-2">
                    <label class="form-label fw-semibold small">Nueva Contraseña (Dejar en blanco para mantener la actual)</label>
                    <input type="password" id="swal-password" class="form-control" name="pass_no_autocompletar" autocomplete="new-password" placeholder="••••••••••••">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff3838',
        preConfirm: () => {
            const nombre = document.getElementById('swal-nombre').value.trim();
            const apellido = document.getElementById('swal-apellido').value.trim();
            const indicativoSelect = document.getElementById('swal-indicativo').value;
            const numeroTel = document.getElementById('swal-telefono').value.trim();
            const genero = document.getElementById('swal-genero').value;
            const password = document.getElementById('swal-password').value.trim();
            const imagenInput = document.getElementById('swal-imagen');

            if (!nombre) {
                Swal.showValidationMessage('El nombre es obligatorio');
                return false;
            }

            if (password && password.length < 8) {
                Swal.showValidationMessage('La nueva contraseña debe tener mínimo 8 caracteres');
                return false;
            }

            const numeroCompleto = numeroTel ? `${indicativoSelect}${numeroTel}` : '';

            const formData = new FormData();
            formData.append('nombre', nombre);
            formData.append('apellido', apellido);
            formData.append('numero_telefono', numeroCompleto);
            formData.append('genero', genero);
            if (password) formData.append('password', password);
            if (imagenInput.files[0]) formData.append('imagen', imagenInput.files[0]);

            return formData;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/auth/perfil/${usuario.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: result.value
                });

                const data = await response.json();

                if (!response.ok) {
                    Swal.fire('Error', data.error || 'No se pudo actualizar el perfil', 'error');
                    return;
                }

                actualizarDatosUsuarioUI(data.usuario);
                Swal.fire('¡Actualizado!', 'Tu perfil se ha actualizado exitosamente.', 'success');

            } catch (err) {
                console.error("Error al actualizar perfil:", err);
                Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        }
    });
}

// ------------------------------------------
// RENDERIZADORES
// ------------------------------------------
function formatearCOP(valor) {
    const numero = Number(valor) || 0;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
}

function renderizarProximosViajes(viajes) {
    const cont = document.getElementById("contenedor-proximos-viajes");
    if (viajes.length === 0) {
        cont.innerHTML = `<p class="text-muted small">No hay reservas próximas disponibles.</p>`;
        return;
    }
    cont.innerHTML = viajes.map(item => {
        const idReserva = item.id_reserva || item.id;
        return `
            <div class="d-flex align-items-center justify-content-between p-2 bg-white rounded-3 shadow-sm border">
                <div class="d-flex align-items-center gap-3">
                    <img src="${item.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80'}" class="rounded-3 object-fit-cover" style="width: 80px; height: 80px;">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="fw-bold mb-0 text-dark">${item.destino}</h6>
                            ${obtenerBadgeEstado(item.estado_reserva)}
                        </div>
                        <p class="small text-muted mb-1">${item.origen ? 'Desde ' + item.origen : 'Reserva'}</p>
                        <span class="fw-bold text-dark small">${formatearCOP(item.precio_final)}</span>
                    </div>
                </div>
                <a href="destino-detalle.html?id=${idReserva}" class="btn btn-volaris btn-sm px-3 fw-semibold">Ver detalles</a>
            </div>
        `;
    }).join("");
}

function renderizarHistorialViajes(viajes) {
    const cont = document.getElementById("contenedor-historial-viajes");
    if (viajes.length === 0) {
        cont.innerHTML = `<p class="text-muted small">No hay historial disponible.</p>`;
        return;
    }
    cont.innerHTML = viajes.map(item => `
        <div class="d-flex align-items-center gap-3 p-2 bg-white rounded-3 shadow-sm border">
            <img src="${item.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80'}" class="rounded-3 object-fit-cover" style="width: 70px; height: 70px;">
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <h6 class="fw-bold mb-0 text-dark">${item.destino}</h6>
                    ${obtenerBadgeEstado(item.estado_reserva)}
                </div>
                <p class="small text-muted mb-0">${item.fecha_reserva_formateada || 'Completado'}</p>
            </div>
        </div>
    `).join("");
}

function renderizarNavbarSesion(usuario) {
    const container = document.getElementById('user-session-container');
    if (!container) return;

    container.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            <a href="perfil.html" class="nav-link-custom active fw-bold text-dark fs-6 text-decoration-none d-flex align-items-center">
                <i class="fa-solid fa-user text-danger me-2"></i>${usuario.nombre || 'Usuario'}
            </a>
            <button type="button" class="btn btn-volaris btn-sm fw-semibold px-3 py-1 rounded-3" id="btn-logout">
                <i class="fa-solid fa-right-from-bracket me-1"></i>Cerrar sesión
            </button>
        </div>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });
}