let productos = [];
let calificaciones = [];
let paginaActual = 1;
const productosPorPagina = 6;
let productosActuales = [];

function normalizarTexto(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

document.addEventListener("DOMContentLoaded", () => {
    const btnCarrito = document.getElementById("btn-carrito");
    const btnLogin = document.getElementById("btn-login");

    if (btnCarrito) {
        btnCarrito.addEventListener("click", () => {
            window.location.href = "carrito.html";
        });
    }

    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    // Menú Hamburguesa (modo responsive)
    const btnHamburguesa = document.getElementById("btn-hamburguesa");
    const accionesMenu = document.getElementById("acciones-menu");

    if (btnHamburguesa && accionesMenu) {
        btnHamburguesa.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            accionesMenu.classList.toggle("activo");
        });
    }

    // Event Listeners para el buscador y contador
    const inputBuscador = document.getElementById("buscador");
    const btnBuscar = document.getElementById("btn-buscar");

    if (inputBuscador) {
        inputBuscador.addEventListener("input", aplicarFiltros);
    }

    if (btnBuscar) {
        btnBuscar.addEventListener("click", aplicarFiltros);
    }

    actualizarContadorCarrito();
});

// Carga inicial de datos
fetch("data/data.json")
    .then(res => res.json())
    .then(data => {
        productos = data.productos || [];
        calificaciones = data.calificaciones || [];

        const inputBuscador = document.getElementById("buscador");
        const urlParams = new URLSearchParams(window.location.search);
        const busquedaURL = urlParams.get('search');

        if (busquedaURL && inputBuscador) {
            inputBuscador.value = busquedaURL;
        }

        aplicarFiltros();
    })
    .catch(err => console.error("Error al cargar data.json:", err));

function obtenerSeleccionados(nombreGrupo) {
    const checkboxes = document.querySelectorAll(`input[name="${nombreGrupo}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value.toLowerCase());
}

function sincronizarCheckboxesConTexto(texto) {
    const textoNorm = normalizarTexto(texto);

    const opcionesRelleno = ["queso", "pollo", "carne", "chicharron", "chorizo", "especial", "mixto"];
    const opcionesMaiz = ["blanco", "amarillo", "choclo", "dulce"];

    opcionesRelleno.forEach(opcion => {
        const checkbox = document.querySelector(`input[name="relleno"][value*="${opcion}" i]`);
        if (checkbox) {
            checkbox.checked = textoNorm.includes(opcion);
        }
    });

    opcionesMaiz.forEach(opcion => {
        const checkbox = document.querySelector(`input[name="maiz"][value*="${opcion}" i]`);
        if (checkbox) {
            checkbox.checked = textoNorm.includes(opcion);
        }
    });
}

function sincronizarCheckboxesConTexto(texto) {
    const textoNorm = normalizarTexto(texto);

    if (textoNorm === "") return;

    const checkboxesMaiz = document.querySelectorAll('input[name="maiz"]');
    checkboxesMaiz.forEach(cb => {
        const valNorm = normalizarTexto(cb.value);
        cb.checked = textoNorm.includes(valNorm);
    });

    const checkboxesRelleno = document.querySelectorAll('input[name="relleno"]');
    checkboxesRelleno.forEach(cb => {
        const valNorm = normalizarTexto(cb.value);
        if (valNorm === "especial") {
            cb.checked = textoNorm.includes("especial") || textoNorm.includes("mixto");
        } else {
            cb.checked = textoNorm.includes(valNorm);
        }
    });
}

function aplicarFiltros() {
    const inputBuscador = document.getElementById("buscador");
    const textoBusqueda = inputBuscador ? inputBuscador.value.trim() : "";

    sincronizarCheckboxesConTexto(textoBusqueda);

    const tiposMaiz = obtenerSeleccionados("maiz"); 
    const tiposRelleno = obtenerSeleccionados("relleno"); 

    const productosFiltrados = productos.filter(producto => {
        const nombreProd = normalizarTexto(producto.nombre);
        const descProd = normalizarTexto(producto.descripcion);
        const textoNorm = normalizarTexto(textoBusqueda);

        const coincideTexto = textoNorm === "" || 
                              nombreProd.includes(textoNorm) || 
                              descProd.includes(textoNorm);

        const maizProducto = normalizarTexto(producto.tipo_de_maiz);
        const coincideMaiz = tiposMaiz.length === 0 || tiposMaiz.some(filtro => {
            const val = normalizarTexto(filtro);
            if (val.includes("choclo") || val.includes("dulce")) {
                return maizProducto.includes("dulce") || maizProducto.includes("choclo");
            }
            if (val.includes("blanco")) return maizProducto.includes("blanco");
            if (val.includes("amarillo")) return maizProducto.includes("amarillo");
            return maizProducto.includes(val);
        });

        const rellenoProducto = normalizarTexto(producto.relleno);
        const coincideRelleno = tiposRelleno.length === 0 || tiposRelleno.some(filtro => {
            const val = normalizarTexto(filtro);
            if (val === "carne") return rellenoProducto.includes("carne");
            if (val === "especial" || val === "mixto") {
                return rellenoProducto.includes(" y ") || 
                       rellenoProducto.includes("aguacate") || 
                       rellenoProducto.includes("tocineta") ||
                       rellenoProducto.includes(",");
            }
            return rellenoProducto.includes(val);
        });

        return coincideTexto && coincideMaiz && coincideRelleno;
    });

    paginaActual = 1; 
    mostrarGridProductos(productosFiltrados);
}

function limpiarFiltros() {
    const checkboxes = document.querySelectorAll('.barra-filtros-superior input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    const buscador = document.getElementById("buscador");
    if (buscador) buscador.value = "";

    paginaActual = 1;
    mostrarGridProductos(productos);
}

function mostrarGridProductos(lista = productos) {
    productosActuales = lista;
    const grid = document.getElementById("grid-productos");
    if (!grid) return;

    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosVisibles = productosActuales.slice(inicio, fin);

    if (productosVisibles.length === 0) {
        grid.innerHTML = `<p class="sin-resultados" style="grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>`;
        renderizarControlesPaginacion(0);
        return;
    }

    grid.innerHTML = productosVisibles.map(p => `
        <div class="tarjeta-catalogo">
            <a href="detalle.html?id=${p.id}">
                <img src="${p.foto}" alt="${p.nombre}" style="cursor: pointer;">
            </a>
            <div class="contenido-tarjeta-catalogo">
                <a href="detalle.html?id=${p.id}" style="text-decoration: none; color: inherit;">
                    <h4 class="titulo-catalogo">${p.nombre}</h4>
                </a>
                <div class="estrellas-catalogo">★★★★★</div>
                <div class="pie-tarjeta-catalogo">
                    <span class="precio-catalogo">$${p.precio ? p.precio.toLocaleString() : '0'}</span>
                    <button type="button" class="btn-anadir" onclick="agregarAlCarrito(${p.id})">Añadir</button>
                </div>
            </div>
        </div>
    `).join('');

    renderizarControlesPaginacion(productosActuales.length);
}

function renderizarControlesPaginacion(totalItems) {
    const contenedor = document.getElementById("paginacion");
    if (!contenedor) return;

    const totalPaginas = Math.ceil(totalItems / productosPorPagina);

    if (totalPaginas <= 1) {
        contenedor.innerHTML = "";
        return;
    }

    let botonesHTML = `
        <button class="btn-pagina" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">&lt;</button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        botonesHTML += `
            <button class="btn-pagina ${i === paginaActual ? 'activa' : ''}" onclick="cambiarPagina(${i})">${i}</button>
        `;
    }

    botonesHTML += `
        <button class="btn-pagina" ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">&gt;</button>
    `;

    contenedor.innerHTML = botonesHTML;
}

function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    mostrarGridProductos(productosActuales);
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

window.addEventListener("scroll", () => {
    const indicador = document.getElementById("indicadorScroll");
    if (!indicador) return;

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        indicador.style.opacity = "0";
        indicador.style.pointerEvents = "none";
    } else {
        indicador.style.opacity = "1";
        indicador.style.pointerEvents = "auto";
    }
});

// --- FUNCIONES DEL CARRITO ---
function obtenerCarrito() {
    const carritoStorage = localStorage.getItem("carrito_arepas");
    return carritoStorage ? JSON.parse(carritoStorage) : [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito_arepas", JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function agregarAlCarrito(idProducto) {
    const productoEncontrado = productos.find(p => p.id === idProducto);
    
    if (!productoEncontrado) {
        console.error("Producto no encontrado con el ID:", idProducto);
        return;
    }

    let carrito = obtenerCarrito();
    const indice = carrito.findIndex(item => item.id === idProducto);

    if (indice !== -1) {
        carrito[indice].cantidad += 1;
    } else {
        carrito.push({
            id: productoEncontrado.id,
            nombre: productoEncontrado.nombre,
            precio: productoEncontrado.precio,
            foto: productoEncontrado.foto,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);

    Swal.fire({
        title: '¡Agregado!',
        text: `¡${productoEncontrado.nombre} agregada al carrito!`,
        icon: 'success',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: '#ffffff',
        color: '#2c3e50',
        iconColor: '#27ae60'
    });
}

function actualizarContadorCarrito() {
    const contadorElem = document.getElementById("contador-carrito");
    if (!contadorElem) return;

    const carrito = obtenerCarrito();
    const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contadorElem.textContent = totalUnidades;
}