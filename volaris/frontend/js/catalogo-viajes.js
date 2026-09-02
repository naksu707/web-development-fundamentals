const API_BASE_URL = "http://127.0.0.1:5000/api/viajes";

let paginaActual = 1;
const itemsPorPagina = 6;
let listaViajesCatalogo = [];

document.addEventListener("DOMContentLoaded", () => {
    preseleccionarFiltroDesdeURL();
    inicializarFiltrosCatalogo();
    aplicarFiltrosLaterales();
});

/* ==========================================
 * INFERENCIA Y EXTRACCIÓN DE URL
 * ========================================== */
function normalizarTexto(texto) {
    return (texto || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function determinarTipoSalida(destinoBuscado) {
    if (!destinoBuscado) return "";
    const destinoClean = normalizarTexto(destinoBuscado);
    
    const CIUDADES_COLOMBIA = ["bogota", "medellin", "cali", "barranquilla", "cartagena", "santa marta", "bucaramanga", "pereira", "manizales", "armenia", "cucuta", "ibague", "villavicencio", "pasto", "neiva", "popayan", "monteria", "sincelejo", "valledupar", "tunja", "florencia", "yopal", "quibdo", "san andres", "leticia", "eje cafetero", "salento", "quindio", "guatape", "parque del cafe"];

    if (CIUDADES_COLOMBIA.some(c => destinoClean.includes(c) || c.includes(destinoClean))) return "NACIONAL";
    return "INTERNACIONAL";
}

function preseleccionarFiltroDesdeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const destinoParam = urlParams.get("destino") || "";
    
    const tipoInferido = determinarTipoSalida(destinoParam);
    if (tipoInferido) {
        const chkLugar = document.querySelector(`.filtro-lugar[value="${tipoInferido}"]`);
        if (chkLugar) chkLugar.checked = true;
    }
}

/* ==========================================
 * FILTROS E HISTOGRAMA
 * ========================================== */
function renderizarHistogramaPrecios(minVal, maxVal) {
    const contenedor = document.getElementById("histograma-precios");
    const totalBarras = 28;
    const maxPrecio = 5000000;
    let html = "";

    for (let i = 0; i < totalBarras; i++) {
        const alturaPorcentaje = Math.pow((i + 1) / totalBarras, 2.2) * 100;
        const precioBarra = (i / totalBarras) * maxPrecio;
        const color = (precioBarra >= minVal && precioBarra <= maxVal) ? "#ff3838" : "#e2e8f0"; 
        html += `<div class="bar-histograma" style="height: ${Math.max(alturaPorcentaje, 4)}%; background-color: ${color};"></div>`;
    }
    contenedor.innerHTML = html;
}

function inicializarFiltrosCatalogo() {
    const rangeMin = document.getElementById("filtro-precio-min");
    const rangeMax = document.getElementById("filtro-precio-max");
    const displayMin = document.getElementById("precio-min-display");
    const displayMax = document.getElementById("precio-max-display");

    function actualizarRangoUI() {
        if (!rangeMin || !rangeMax) return;
        let vMin = parseInt(rangeMin.value);
        let vMax = parseInt(rangeMax.value);

        if (vMin > vMax) { rangeMin.value = vMax; vMin = vMax; }
        if (displayMin) displayMin.value = `$${vMin.toLocaleString('es-CO')}`;
        if (displayMax) displayMax.value = `$${vMax.toLocaleString('es-CO')}${vMax >= 5000000 ? '+' : ''}`;

        renderizarHistogramaPrecios(vMin, vMax);
    }

    if (rangeMin && rangeMax) {
        rangeMin.addEventListener("input", () => { actualizarRangoUI(); aplicarFiltrosLaterales(); });
        rangeMax.addEventListener("input", () => { actualizarRangoUI(); aplicarFiltrosLaterales(); });
        actualizarRangoUI();
    }

    document.querySelectorAll(".filtro-lugar, .filtro-duracion, .filtro-categoria").forEach(chk => {
        chk.addEventListener("change", () => aplicarFiltrosLaterales());
    });

    const btnLimpiar = document.getElementById("btn-limpiar-filtros");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            window.location.href = "catalogo-viajes.html";
        });
    }
}

/* ==========================================
 * PETICIÓN, FILTRO Y GRID
 * ========================================== */
async function aplicarFiltrosLaterales() {
    const urlParams = new URLSearchParams(window.location.search);
    const inputDestino = urlParams.get("destino") || "";
    const inputFecha = urlParams.get("fecha") || "";
    const inputPasajeros = urlParams.get("pasajeros") || 1;

    const lugares = Array.from(document.querySelectorAll(".filtro-lugar:checked")).map(c => c.value);
    const duraciones = Array.from(document.querySelectorAll(".filtro-duracion:checked")).map(c => c.value);
    const categorias = Array.from(document.querySelectorAll(".filtro-categoria:checked")).map(c => c.value);

    const rangeMin = document.getElementById("filtro-precio-min");
    const rangeMax = document.getElementById("filtro-precio-max");
    const precioMin = rangeMin ? rangeMin.value : 0;
    const precioMax = rangeMax ? rangeMax.value : 5000000;

    const queryParams = new URLSearchParams({ 
        pasajeros: inputPasajeros, 
        precio_min: precioMin, 
        precio_max: precioMax 
    });

    if (inputDestino) queryParams.append("destino", inputDestino);
    if (inputFecha) queryParams.append("fecha", inputFecha);
    if (lugares.length > 0) queryParams.append("tipo_salida", lugares[0]);
    if (duraciones.length > 0) queryParams.append("duracion", duraciones[0]);
    if (categorias.length > 0) queryParams.append("categoria", categorias.join(","));

    try {
        const response = await fetch(`${API_BASE_URL}/buscar?${queryParams.toString()}`);
        let viajes = await response.json();

        if (!Array.isArray(viajes)) {
            viajes = [];
        }

        if (inputDestino && viajes.length > 0) {
            const busquedaClean = normalizarTexto(inputDestino);
            viajes = viajes.filter(v => 
                normalizarTexto(v.destino).includes(busquedaClean) || 
                normalizarTexto(v.descripcion).includes(busquedaClean)
            );
        }

        renderizarGridCatalogo(viajes);
    } catch (error) {
        console.error("Error al aplicar filtros laterales:", error);
        renderizarGridCatalogo([]);
    }
}

function renderizarGridCatalogo(viajes) {
    listaViajesCatalogo = viajes;
    paginaActual = 1;
    mostrarPagina(paginaActual);
}

function mostrarPagina(pagina) {
    const contenedor = document.getElementById("contenedor-catalogo");
    const paginacionElem = document.getElementById("paginacion-catalogo");

    if (!listaViajesCatalogo || listaViajesCatalogo.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5 w-100">
                <div class="mb-3"><i class="fas fa-plane-slash text-danger" style="font-size: 3.5rem;"></i></div>
                <h4 class="fw-bold text-dark mb-2">No encontramos viajes para esta búsqueda</h4>
                <p class="text-muted fs-6 mb-3">No existen paquetes disponibles que coincidan con los filtros seleccionados.</p>
                <a href="catalogo-viajes.html" class="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold">Ver todos los viajes disponibles</a>
            </div>`;
        paginacionElem.innerHTML = "";
        return;
    }

    const inicio = (pagina - 1) * itemsPorPagina;
    const itemsPagina = listaViajesCatalogo.slice(inicio, inicio + itemsPorPagina);

    contenedor.innerHTML = itemsPagina.map(viaje => {
        const tituloMostrar = viaje.destino || viaje.nombre || "Viaje imperdible";
        const precioFormateado = viaje.precio_base ? `${Number(viaje.precio_base).toLocaleString('es-CO')} COP` : "Consultar";

        return `
            <div class="col-12 col-md-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <img src="${viaje.imagen_url || 'assets/imagenes/default.jpg'}" class="card-img-top" style="height: 160px; object-fit: cover;" alt="${tituloMostrar}">
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            <h6 class="card-title fw-bold text-dark mb-1">${tituloMostrar}</h6>
                            <p class="card-text text-muted small mb-2" style="font-size: 0.8rem; line-height: 1.2;">${viaje.descripcion || ''}</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span class="fw-bold text-dark fs-6">${precioFormateado}</span>
                            <a href="detalle-viaje.html?id=${viaje.id}" class="btn btn-danger btn-sm px-3 fw-semibold">Ver más</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderizarPaginacion(Math.ceil(listaViajesCatalogo.length / itemsPorPagina), pagina);
}

function renderizarPaginacion(totalPaginas, actual) {
    const paginacionElem = document.getElementById("paginacion-catalogo");
    if (!paginacionElem || totalPaginas <= 1) {
        if (paginacionElem) paginacionElem.innerHTML = "";
        return;
    }

    paginacionElem.className = "pagination-custom d-flex justify-content-center align-items-center gap-2 my-4 list-unstyled";

    let html = `
        <li class="page-item ${actual === 1 ? 'disabled' : ''}">
            <a class="page-link rounded-3 border-0 shadow-sm px-3 py-2 text-danger" href="#" onclick="cambiarPagina(${actual - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    const delta = 1; 
    let inicioRango = Math.max(1, actual - delta);
    let finRango = Math.min(totalPaginas, actual + delta);

    if (actual <= 3) {
        finRango = Math.min(totalPaginas, 4);
    }
    if (actual >= totalPaginas - 2) {
        inicioRango = Math.max(1, totalPaginas - 3);
    }

    if (inicioRango > 1) {
        html += `
            <li class="page-item">
                <a class="page-link rounded-3 border-0 shadow-sm text-dark px-3 py-2" href="#" onclick="cambiarPagina(1); return false;">1</a>
            </li>`;
        if (inicioRango > 2) {
            html += `<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted fw-bold">...</span></li>`;
        }
    }

    for (let i = inicioRango; i <= finRango; i++) {
        if (i === actual) {
            html += `
                <li class="page-item active">
                    <span class="page-link rounded-3 border-0 shadow-sm bg-danger text-white fw-bold px-3 py-2">${i}</span>
                </li>`;
        } else {
            html += `
                <li class="page-item">
                    <a class="page-link rounded-3 border-0 shadow-sm text-dark px-3 py-2" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
                </li>`;
        }
    }

    if (finRango < totalPaginas) {
        if (finRango < totalPaginas - 1) {
            html += `<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted fw-bold">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <a class="page-link rounded-3 border-0 shadow-sm text-dark px-3 py-2" href="#" onclick="cambiarPagina(${totalPaginas}); return false;">${totalPaginas}</a>
            </li>`;
    }

    html += `
        <li class="page-item ${actual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link rounded-3 border-0 shadow-sm px-3 py-2 text-danger" href="#" onclick="cambiarPagina(${actual + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginacionElem.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    mostrarPagina(paginaActual);
}