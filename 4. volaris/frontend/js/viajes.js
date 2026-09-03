const API_BASE_URL = "http://127.0.0.1:5000/api/viajes";

document.addEventListener("DOMContentLoaded", () => {
    inicializarSelectorPasajeros();
    inicializarBuscador();
    cargarCarruselDestacados();
});

function normalizarTexto(texto) {
    return (texto || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/* ==========================================
 * SELECTOR DE PASAJEROS
 * ========================================== */
function inicializarSelectorPasajeros() {
    const btnDropdown = document.getElementById("btn-pasajeros-dropdown");
    const popover = document.getElementById("popover-pasajeros");
    const inputHidden = document.getElementById("buscar-pasajeros");
    const textoResumen = document.getElementById("texto-pasajeros-resumen");

    let adultos = 1;
    let menores = 0;

    btnDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.toggle("d-none");
    });

    document.getElementById("btn-sumar-adultos").addEventListener("click", (e) => { e.stopPropagation(); adultos++; actualizarUI(); });
    document.getElementById("btn-restar-adultos").addEventListener("click", (e) => { e.stopPropagation(); if (adultos > 1) { adultos--; actualizarUI(); } });
    document.getElementById("btn-sumar-menores").addEventListener("click", (e) => { e.stopPropagation(); menores++; actualizarUI(); });
    document.getElementById("btn-restar-menores").addEventListener("click", (e) => { e.stopPropagation(); if (menores > 0) { menores--; actualizarUI(); } });

    function actualizarUI() {
        document.getElementById("cant-adultos").textContent = adultos;
        document.getElementById("cant-menores").textContent = menores;
    }

    document.getElementById("btn-aplicar-pasajeros").addEventListener("click", (e) => {
        e.stopPropagation();
        const total = adultos + menores;
        inputHidden.value = total;

        let resumenText = `${adultos} adulto${adultos > 1 ? 's' : ''}`;
        if (menores > 0) resumenText += `, ${menores} menor${menores > 1 ? 'es' : ''}`;
        
        textoResumen.textContent = resumenText;
        popover.classList.add("d-none");
    });

    document.getElementById("btn-cancelar-pasajeros").addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.add("d-none");
    });

    document.addEventListener("click", (e) => {
        if (!popover.contains(e.target) && !btnDropdown.contains(e.target)) {
            popover.classList.add("d-none");
        }
    });
}

/* ==========================================
 * BUSCADOR Y SUGERENCIAS
 * ========================================== */
function inicializarBuscador() {
    const formBuscador = document.getElementById("form-buscador");
    const inputDestino = document.getElementById("buscar-destino");
    const listaSugerencias = document.getElementById("lista-sugerencias");

    inputDestino.addEventListener("input", () => {
        const query = normalizarTexto(inputDestino.value);
        listaSugerencias.innerHTML = "";

        if (query.length < 2) {
            listaSugerencias.classList.add("d-none");
            return;
        }

        fetch(`${API_BASE_URL}/sugerencias?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(sugerencias => {
                if (!sugerencias || sugerencias.length === 0) {
                    listaSugerencias.classList.add("d-none");
                    return;
                }

                listaSugerencias.innerHTML = sugerencias.map(lugar => `
                    <li class="list-group-item list-group-item-action py-2 px-3 small" style="cursor: pointer;">
                        <i class="fas fa-location-dot me-2 text-danger"></i>${lugar}
                    </li>
                `).join('');

                listaSugerencias.classList.remove("d-none");

                listaSugerencias.querySelectorAll("li").forEach(item => {
                    item.addEventListener("click", () => {
                        inputDestino.value = item.textContent.trim();
                        listaSugerencias.classList.add("d-none");
                    });
                });
            })
            .catch(err => console.error("Error al obtener sugerencias:", err));
    });

    document.addEventListener("click", (e) => {
        if (!inputDestino.contains(e.target) && !listaSugerencias.contains(e.target)) {
            listaSugerencias.classList.add("d-none");
        }
    });

    formBuscador.addEventListener("submit", (e) => {
        e.preventDefault();
        listaSugerencias.classList.add("d-none");

        const destino = inputDestino.value.trim();
        const fecha = document.getElementById("buscar-fecha").value;
        const pasajeros = document.getElementById("buscar-pasajeros").value;

        const queryParams = new URLSearchParams({
            destino: destino,
            fecha: fecha,
            pasajeros: pasajeros
        });

        window.location.href = `catalogo-viajes.html?${queryParams.toString()}`;
    });
}

/* ==========================================
 * CARRUSEL HOME
 * ========================================== */
async function cargarCarruselDestacados() {
    try {
        const response = await fetch(`${API_BASE_URL}`);
        const viajes = await response.json();
        
        const contenedor = document.getElementById("contenedor-viajes");
        if (!viajes || viajes.length === 0) {
            contenedor.innerHTML = `<div class="carousel-item active"><div class="text-center py-4"><p class="text-muted">No se encontraron viajes disponibles.</p></div></div>`;
            return;
        }

        const viajesLimitados = viajes.slice(0, 9);
        let slidesHTML = "";

        for (let i = 0; i < viajesLimitados.length; i += 3) {
            const grupoViajes = viajesLimitados.slice(i, i + 3);
            const isActive = i === 0 ? "active" : "";

            const tarjetasHTML = grupoViajes.map(viaje => {
                const tituloMostrar = viaje.destino || viaje.nombre || "Viaje imperdible";
                const precio = viaje.precio_base ?? viaje.precio;
                const precioFormateado = (precio !== undefined && precio !== null) ? `${Number(precio).toLocaleString('es-CO')} COP` : "Consultar";

                return `
                    <div class="col-12 col-md-4">
                        <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                            <img src="${viaje.imagen_url || 'assets/imagenes/default.jpg'}" class="card-img-top" style="height: 140px; object-fit: cover;" alt="${tituloMostrar}">
                            <div class="card-body p-2 d-flex flex-column justify-content-between">
                                <div>
                                    <h6 class="card-title fw-bold text-dark mb-1" style="font-size: 0.95rem;">${tituloMostrar}</h6>
                                    <p class="card-text text-muted mb-2" style="font-size: 0.78rem; line-height: 1.2;">${viaje.descripcion || ''}</p>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                                    <span class="fw-bold text-dark" style="font-size: 0.85rem;">${precioFormateado}</span>
                                    <a href="detalle-viaje.html?id=${viaje.id}" class="btn btn-danger btn-sm px-2 py-1 fw-semibold" style="font-size: 0.75rem;">Ver más</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            slidesHTML += `<div class="carousel-item ${isActive}"><div class="row g-3 px-4">${tarjetasHTML}</div></div>`;
        }

        contenedor.innerHTML = slidesHTML;
        
        if (typeof bootstrap !== 'undefined' && document.getElementById('carruselPlanes')) {
            bootstrap.Carousel.getOrCreateInstance(document.getElementById('carruselPlanes'), { interval: 2800, ride: 'carousel' }).cycle();
        }
    } catch (error) {
        console.error("Error al cargar destacados:", error);
    }
}

