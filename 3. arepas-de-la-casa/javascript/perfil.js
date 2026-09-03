document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Cargar datos del archivo JSON
        const response = await fetch("data/data.json");
        const data = await response.json();

        // Obtener usuario activo
        const idUsuarioActivo = parseInt(localStorage.getItem("usuarioLogueado")) || 1;
        const usuario = data.usuarios.find(u => u.id === idUsuarioActivo);

        if (!usuario) {
            console.warn("Usuario no encontrado en los registros.");
            return;
        }

        // Insertar Información de Usuario en el DOM
        document.getElementById("perfil-foto").src = usuario.foto;
        document.getElementById("perfil-foto").alt = `Foto de ${usuario.nombre}`;
        document.getElementById("perfil-nombre").textContent = usuario.nombre;
        document.getElementById("perfil-correo").textContent = usuario.correo;
        document.getElementById("perfil-telefono").textContent = usuario.celular;

        // Cargar Pedidos y Calificaciones
        cargarPedidos(usuario.pedidos, data.productos);
        cargarCalificaciones(usuario.id, data.calificaciones, data.productos);

        // Configurar el Modal de Nuevos Comentarios pasándole las referencias de datos
        configurarModalComentario(usuario, data.calificaciones, data.productos);

        // Configurar buscador del header
        configurarBuscador(data.productos);

        // Configurar el Modal de Edición
        configurarModalEdicion();

    } catch (error) {
        console.error("Error al cargar la información del perfil:", error);
    }
});

function cargarPedidos(listaIdsPedidos, productos) {
    const tbody = document.getElementById("tabla-pedidos-body");
    tbody.innerHTML = "";

    if (!listaIdsPedidos || listaIdsPedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No tienes pedidos registrados.</td></tr>`;
        return;
    }

    listaIdsPedidos.forEach((idProducto) => {
        const producto = productos.find(p => p.id === idProducto);
        if (!producto) return;

        const fechaSimulada = "15/08/2026";
        const precioFormateado = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }).format(producto.precio);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${fechaSimulada}</td>
            <td><span style="color: #2e7d32; font-weight: 600;">Entregado</span></td>
            <td>${precioFormateado}</td>
            <td>
                <button type="button" class="btn-detalles" data-id="${producto.id}">
                    Ver Detalles
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Elementos del Modal de Detalles
    const modalDetalles = document.getElementById("modal-detalles");
    const btnCerrarDetalles = document.getElementById("btn-cerrar-detalles");
    const btnAceptarDetalles = document.getElementById("btn-aceptar-detalles");

    const cerrarModalDetalles = () => modalDetalles?.classList.remove("activo");

    btnCerrarDetalles?.addEventListener("click", cerrarModalDetalles);
    btnAceptarDetalles?.addEventListener("click", cerrarModalDetalles);

    tbody.querySelectorAll(".btn-detalles").forEach(boton => {
        boton.addEventListener("click", (e) => {
            const idProd = e.target.getAttribute("data-id");
            const prod = productos.find(p => p.id == idProd);
            
            if (prod && modalDetalles) {
                document.getElementById("detalle-img").src = prod.foto;
                document.getElementById("detalle-nombre").textContent = prod.nombre;
                document.getElementById("detalle-relleno").textContent = prod.relleno;
                document.getElementById("detalle-precio").textContent = `$${prod.precio.toLocaleString("es-CO")}`;
                
                modalDetalles.classList.add("activo");
            }
        });
    });
}

function cargarCalificaciones(idUsuario, calificaciones, productos) {
    const contenedorComentarios = document.getElementById("lista-comentarios");
    contenedorComentarios.innerHTML = "";

    const comentariosUsuario = calificaciones.filter(c => c.id_usuario === idUsuario);

    if (comentariosUsuario.length === 0) {
        contenedorComentarios.innerHTML = `<p style="text-align:center; color: #666;">Aún no has realizado ninguna calificación.</p>`;
        return;
    }

    comentariosUsuario.forEach(c => {
        const producto = productos.find(p => p.id === c.id_producto);
        if (!producto) return;

        const estrellas = "★".repeat(c.calificacion) + "☆".repeat(5 - c.calificacion);

        const article = document.createElement("article");
        article.className = "tarjeta-comentario";
        article.innerHTML = `
            <img src="${producto.foto}" alt="${producto.nombre}" class="img-comentario">
            <div class="info-comentario">
                <div class="cabecera-comentario">
                    <h3>${producto.nombre}</h3>
                    <span class="fecha-comentario">Reciente</span>
                </div>
                <div class="estrellas-comentario" style="color: #ff9800;">${estrellas}</div>
                <p class="texto-comentario">${c.comentario}</p>
            </div>
        `;
        contenedorComentarios.appendChild(article);
    });
}

function configurarModalComentario(usuario, calificaciones, productos) {
    const modalComentario = document.getElementById('modal-comentario');
    const btnNuevoComentario = document.getElementById('btn-nuevo-comentario');
    const btnCerrarComentario = document.getElementById('btn-cerrar-modal-comentario');
    const btnCancelarComentario = document.getElementById('btn-cancelar-comentario');
    const contenedorSeleccion = document.getElementById('contenedor-seleccion-pedido');
    const camposComentario = document.getElementById('campos-comentario');
    const formComentario = document.getElementById('form-comentario');

    if (!modalComentario || !btnNuevoComentario) return;

    btnNuevoComentario.addEventListener('click', () => {
        // Obtener IDs de productos que el usuario ya comentó
        const idsComentados = calificaciones
            .filter(c => c.id_usuario === usuario.id)
            .map(c => c.id_producto);

        // Filtrar productos comprados por el usuario que no hayan sido comentados aún
        const productosPendientes = usuario.pedidos.filter(idProd => !idsComentados.includes(idProd));

        if (productosPendientes.length === 0) {
            contenedorSeleccion.innerHTML = `
                <p class="mensaje-sin-pendientes">No tienes comentarios pendientes para escribir.</p>
            `;
            camposComentario.style.display = 'none';
        } else {
            let opciones = productosPendientes.map(idProd => {
                const prod = productos.find(p => p.id === idProd);
                return `<option value="${prod.id}">${prod.nombre}</option>`;
            }).join('');

            contenedorSeleccion.innerHTML = `
                <div class="grupo-input">
                    <label for="select-pedido-comentario">Selecciona el producto a calificar:</label>
                    <select id="select-pedido-comentario" style="width: 100%; padding: 8px; margin-top: 5px;">${opciones}</select>
                </div>
            `;
            camposComentario.style.display = 'block';
        }

        modalComentario.classList.add('activo');
    });

    const cerrarModalComentario = () => modalComentario.classList.remove('activo');
    btnCerrarComentario?.addEventListener('click', cerrarModalComentario);
    btnCancelarComentario?.addEventListener('click', cerrarModalComentario);

    formComentario?.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectProducto = document.getElementById('select-pedido-comentario');
        const selectEstrellas = document.getElementById('select-estrellas');
        const inputTexto = document.getElementById('input-texto-comentario');

        if (!selectProducto) return;

        // Crear la nueva calificación en memoria
        const nuevaCalificacion = {
            id_usuario: usuario.id,
            id_producto: parseInt(selectProducto.value),
            calificacion: parseInt(selectEstrellas.value),
            comentario: inputTexto.value
        };

        calificaciones.push(nuevaCalificacion);
        cargarCalificaciones(usuario.id, calificaciones, productos);
        
        // Limpiar y cerrar
        inputTexto.value = "";
        cerrarModalComentario();
    });
}

function configurarBuscador(productos) {
    const inputBuscador = document.getElementById("buscador");
    const listaSugerencias = document.getElementById("lista-sugerencias");

    if (!inputBuscador || !listaSugerencias) return;

    inputBuscador.addEventListener("input", (e) => {
        const texto = e.target.value.toLowerCase().trim();
        listaSugerencias.innerHTML = "";

        if (texto.length === 0) return;

        const coincidencias = productos.filter(p => 
            p.nombre.toLowerCase().includes(texto) || 
            p.relleno.toLowerCase().includes(texto)
        );

        coincidencias.forEach(p => {
            const li = document.createElement("li");
            li.textContent = p.nombre;
            li.addEventListener("click", () => {
                window.location.href = `index.html?producto=${p.id}`;
            });
            listaSugerencias.appendChild(li);
        });
    });
}

function configurarModalEdicion() {
    const modal = document.getElementById("modal-editar");
    const btnEditar = document.getElementById("btn-editar-perfil");
    const btnCerrar = document.getElementById("btn-cerrar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");
    const formEditar = document.getElementById("form-editar-perfil");

    if (!modal || !btnEditar) return;

    const inputNombre = document.getElementById("input-nombre");
    const inputCorreo = document.getElementById("input-correo");
    const inputTelefono = document.getElementById("input-telefono");

    btnEditar.addEventListener("click", () => {
        inputNombre.value = document.getElementById("perfil-nombre").textContent;
        inputCorreo.value = document.getElementById("perfil-correo").textContent;
        inputTelefono.value = document.getElementById("perfil-telefono").textContent;
        modal.classList.add("activo");
    });

    const cerrarModal = () => modal.classList.remove("activo");

    btnCerrar?.addEventListener("click", cerrarModal);
    btnCancelar?.addEventListener("click", cerrarModal);

    formEditar?.addEventListener("submit", (e) => {
        e.preventDefault();
        document.getElementById("perfil-nombre").textContent = inputNombre.value;
        document.getElementById("perfil-correo").textContent = inputCorreo.value;
        document.getElementById("perfil-telefono").textContent = inputTelefono.value;
        cerrarModal();
    });
}