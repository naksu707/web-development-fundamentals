let datos = {};
let productos = [];
let usuarios = [];
let calificaciones = [];
let intervaloCarrusel = null;

fetch("./data/data.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("No se pudo cargar el JSON");
        }

        return response.json();
    })
    .then(data => {
        datos = data;
        productos = data.productos || [];
        usuarios = data.usuarios || [];
        calificaciones = data.calificaciones || [];

        mostrarProductos();
        iniciarCarruselAuto();
    })
    .catch(error => {
        console.error("Error al cargar datos:", error);
    });

function mostrarProductos() {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const productosConComentarios = productos.filter(producto => {
        return calificaciones.some(c => c.id_producto === producto.id);
    });

    const productosConPromedio = productosConComentarios.map(producto => {
        const opinionesDelProducto = calificaciones.filter(c => c.id_producto === producto.id);
        const suma = opinionesDelProducto.reduce((acc, c) => acc + c.calificacion, 0);
        const promedio = Math.round(suma / opinionesDelProducto.length);

        return { ...producto, promedio };
    });

    productosConPromedio.sort((a, b) => b.promedio - a.promedio);

    productosConPromedio.forEach(producto => {
        const tarjeta = document.createElement("article");
        tarjeta.classList.add("tarjeta-producto");

        const estrellas = "★".repeat(producto.promedio) + "☆".repeat(5 - producto.promedio);

        tarjeta.innerHTML = `
            <div class="tarjeta-imagen-container">
                <img src="${producto.foto}" alt="${producto.nombre}">
                <span class="insignia-estrellas">${estrellas}</span>
            </div>
            <div class="informacion-producto">
                <h3>${producto.nombre}</h3>
                <button class="btn-comentarios" onclick="verComentarios(${producto.id})">
                    Comentarios
                </button>
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

function moverCarruselSiguiente() {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;

    const primeraTarjeta = contenedor.querySelector('.tarjeta-producto');
    const desplazamiento = primeraTarjeta ? primeraTarjeta.offsetWidth + 16 : 280;
    const maxScroll = contenedor.scrollWidth - contenedor.clientWidth;

    if (contenedor.scrollLeft >= maxScroll - 5) {
        contenedor.scrollLeft = 0;
    } else {
        contenedor.scrollLeft += desplazamiento;
    }
}

function iniciarCarruselAuto() {
    if (!intervaloCarrusel) {
        intervaloCarrusel = setInterval(moverCarruselSiguiente, 2000);
    }
}

function detenerCarruselAuto() {
    clearInterval(intervaloCarrusel);
    intervaloCarrusel = null;
}

function verComentarios(idProducto) {
    detenerCarruselAuto();

    const producto = productos.find(p => p.id === idProducto);
    const opinionesFiltradas = calificaciones.filter(c => c.id_producto === idProducto);

    const modal = document.getElementById("modal-comentarios");
    const titulo = document.getElementById("modal-titulo-producto");
    const contenedorLista = document.getElementById("modal-lista-comentarios");

    if (!modal || !producto) return;

    if (titulo) titulo.textContent = `Comentarios: ${producto.nombre}`;
    if (contenedorLista) {
        contenedorLista.innerHTML = "";

        if (opinionesFiltradas.length === 0) {
            contenedorLista.innerHTML = "<p>Aún no hay comentarios para este producto.</p>";
        } else {
            opinionesFiltradas.forEach(calificacion => {
                const usuario = usuarios.find(u => u.id === calificacion.id_usuario);
                const nombreUsuario = usuario ? usuario.nombre : "Usuario";
                const fotoUsuario = usuario ? usuario.foto : "img/iconos/usuario.png";

                const div = document.createElement("div");
                div.classList.add("comentario-item");
                div.innerHTML = `
                    <div class="comentario-header">
                        <img src="${fotoUsuario}" alt="${nombreUsuario}">
                        <div>
                            <strong>${nombreUsuario}</strong>
                            <div class="comentario-estrellas">${"★".repeat(calificacion.calificacion)}${"☆".repeat(5 - calificacion.calificacion)}</div>
                        </div>
                    </div>
                    <p>"${calificacion.comentario}"</p>
                `;
                contenedorLista.appendChild(div);
            });
        }
    }

    modal.classList.add("activo");
}

function cerrarModal() {
    const modal = document.getElementById("modal-comentarios");
    if (modal) {
        modal.classList.remove("activo");
        iniciarCarruselAuto();
    }
}

function normalizarTexto(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function buscarDesdeIndex() {
    const inputBuscador = document.getElementById("buscador");
    if (!inputBuscador) return;

    const query = normalizarTexto(inputBuscador.value.trim());
    if (query !== "") {
        window.location.href = `menu.html?search=${encodeURIComponent(query)}`;
    }
}

function mostrarSugerencias() {
    const input = document.getElementById("buscador");
    const lista = document.getElementById("lista-sugerencias");
    if (!input || !lista) return;

    const query = normalizarTexto(input.value.trim());
    lista.innerHTML = "";

    if (query === "") {
        lista.style.display = "none";
        return;
    }

    const coincidencias = productos.filter(p => {
        const nombre = normalizarTexto(p.nombre);
        const desc = normalizarTexto(p.descripcion);
        return nombre.includes(query) || desc.includes(query);
    }).slice(0, 4);

    if (coincidencias.length === 0) {
        lista.style.display = "none";
        return;
    }

    coincidencias.forEach(prod => {
        const li = document.createElement("li");
        li.textContent = prod.nombre;

        li.addEventListener("click", () => {
            input.value = prod.nombre;
            lista.style.display = "none";

            if (window.location.pathname.includes("menu.html")) {
                if (typeof aplicarFiltros === "function") aplicarFiltros();
            } else {
                window.location.href = `menu.html?search=${encodeURIComponent(normalizarTexto(prod.nombre))}`;
            }
        });
        lista.appendChild(li);
    });
    lista.style.display = "block";
}

function actualizarContadorCarrito() {
    const contadorElem = document.getElementById("contador-carrito");
    if (!contadorElem) return;

    const carritoStorage = localStorage.getItem("carrito_arepas");
    const carrito = carritoStorage ? JSON.parse(carritoStorage) : [];

    const totalUnidades = carrito.reduce((acc, item) => acc + (item.cantidad || 1), 0);
    contadorElem.textContent = totalUnidades;
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();

    // Eventos del modal
    document.getElementById("btn-cerrar-modal")?.addEventListener("click", cerrarModal);
    document.querySelector(".cerrar-modal")?.addEventListener("click", cerrarModal);
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("modal-comentarios");
        if (e.target === modal) cerrarModal();
    });

    // Eventos del carrusel
    document.getElementById("siguiente")?.addEventListener("click", moverCarruselSiguiente);
    document.getElementById("anterior")?.addEventListener("click", () => {
        const contenedor = document.getElementById("contenedor-productos");
        const primeraTarjeta = contenedor?.querySelector('.tarjeta-producto');
        const desplazamiento = primeraTarjeta ? primeraTarjeta.offsetWidth + 16 : 280;
        if (contenedor) contenedor.scrollLeft -= desplazamiento;
    });

    // Eventos del buscador
    const btnBuscar = document.getElementById("btn-buscar");
    const inputBuscador = document.getElementById("buscador");

    if (btnBuscar) btnBuscar.addEventListener("click", buscarDesdeIndex);
    if (inputBuscador) {
        inputBuscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                buscarDesdeIndex();
            }
        });
        inputBuscador.addEventListener("input", mostrarSugerencias);
    }

    document.addEventListener("click", (e) => {
        const buscadorElem = document.querySelector(".buscador");
        const lista = document.getElementById("lista-sugerencias");
        if (lista && buscadorElem && !buscadorElem.contains(e.target)) {
            lista.style.display = "none";
        }
    });

    // Menú Hamburguesa
    const btnHamburguesa = document.getElementById("btn-hamburguesa");
    const accionesMenu = document.getElementById("acciones-menu");

    if (btnHamburguesa && accionesMenu) {
        btnHamburguesa.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            accionesMenu.classList.toggle("activo");
        });
    }
    // Botones globales de acción
    document.getElementById("btn-carrito")?.addEventListener("click", () => window.location.href = "carrito.html");
    document.getElementById("btn-login")?.addEventListener("click", () => window.location.href = "login.html");
});

window.addEventListener("storage", (e) => {
    if (e.key === "carrito_arepas") {
        actualizarContadorCarrito();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    actualizarEstadoSesion();
});

//PERFIL - NOMBRE USUARIO
function actualizarEstadoSesion() {
    const contenedorAcciones = document.getElementById('acciones-menu');
    const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo')) || JSON.parse(localStorage.getItem('usuarioActivo'));

    if (!contenedorAcciones) return;

    if (usuarioActivo) {
        const primerNombre = usuarioActivo.nombre ? usuarioActivo.nombre.split(' ')[0] : 'Usuario';

        const botonLogin = document.getElementById('btn-login');
        if (botonLogin) botonLogin.remove();

        const sesionExistente = document.getElementById('contenedor-usuario');
        if (sesionExistente) sesionExistente.remove();

        const contenedorUsuario = document.createElement('div');
        contenedorUsuario.id = 'contenedor-usuario';
        contenedorUsuario.className = 'contenedor-usuario';
        
        contenedorUsuario.innerHTML = `
            <a href="perfil.html" class="link-perfil-usuario">Hola, ${primerNombre}</a>
            <button type="button" id="btn-logout" class="btn-logout">Cerrar sesión</button>
        `;

        contenedorAcciones.appendChild(contenedorUsuario);

        document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
    } else {
        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) {
            btnLogin.onclick = () => {
                window.location.href = 'login.html';
            };
        }
    }
}

function cerrarSesion() {
    
    localStorage.removeItem('usuario_activo');
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('usuarioLogueado');

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada',
            text: 'Has cerrado sesión correctamente.',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            window.location.href = 'index.html';
        });
    } else {
        window.location.href = 'index.html';
    }
}