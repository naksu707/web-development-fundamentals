document.addEventListener("DOMContentLoaded", () => {

    if (typeof actualizarContadorCarrito === "function") {
        actualizarContadorCarrito();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productoId = parseInt(urlParams.get("id"));

    if (!productoId) {
        console.error("No se especificó ningún ID de producto.");
        return;
    }

    let productoActual = null;

    const btnMenos = document.getElementById("btn-menos");
    const btnMas = document.getElementById("btn-mas");
    const inputCantidad = document.getElementById("cantidad-producto");
    const btnAgregar = document.getElementById("btn-agregar-detalle");

    if (btnMenos && btnMas && inputCantidad) {
        btnMenos.addEventListener("click", () => {
            let cant = parseInt(inputCantidad.value);
            if (cant > 1) inputCantidad.value = cant - 1;
        });

        btnMas.addEventListener("click", () => {
            let cant = parseInt(inputCantidad.value);
            inputCantidad.value = cant + 1;
        });
    }

    fetch("data/data.json")
        .then(res => res.json())
        .then(data => {
            const listaProductos = data.productos || [];
            productoActual = listaProductos.find(p => p.id === productoId);

            if (productoActual) {
                document.getElementById("detalle-imagen").src = productoActual.foto;
                document.getElementById("detalle-nombre").textContent = productoActual.nombre;
                document.getElementById("detalle-precio").textContent = `$${productoActual.precio.toLocaleString()}`;
                document.getElementById("detalle-descripcion").textContent = productoActual.descripcion;

                const sugerencias = listaProductos.filter(p => p.id !== productoId);
                const galeria = document.getElementById("galeria-miniaturas");

                if (galeria) {
                    galeria.innerHTML = sugerencias.map(item => `
                        <a href="detalle.html?id=${item.id}" class="miniatura-item">
                            <img src="${item.foto}" alt="${item.nombre}">
                            <span>${item.nombre.replace("Arepa de ", "").replace("Arepa ", "")}</span>
                        </a>
                    `).join('');
                }

            } else {
                console.error("Producto no encontrado.");
            }
        })
        .catch(err => console.error("Error al cargar la información del producto:", err));

    if (btnAgregar) {
        btnAgregar.addEventListener("click", () => {
            if (!productoActual) {
                console.warn("Información de producto no disponible aún.");
                return;
            }

            const cantidadAgregar = parseInt(inputCantidad.value) || 1;

            let carrito = JSON.parse(localStorage.getItem("carrito_arepas")) || [];

            const index = carrito.findIndex(item => item.id === productoActual.id);

            if (index !== -1) {
                carrito[index].cantidad += cantidadAgregar;
            } else {
                carrito.push({
                    id: productoActual.id,
                    nombre: productoActual.nombre,
                    precio: productoActual.precio,
                    foto: productoActual.foto,
                    cantidad: cantidadAgregar
                });
            }

            localStorage.setItem("carrito_arepas", JSON.stringify(carrito));

            if (typeof actualizarContadorCarrito === "function") {
                actualizarContadorCarrito();
            }

            const textoOriginal = btnAgregar.textContent;
            btnAgregar.textContent = "¡Añadido!";
            btnAgregar.style.backgroundColor = "#ac770c";

            setTimeout(() => {
                btnAgregar.textContent = textoOriginal;
                btnAgregar.style.backgroundColor = "";
            }, 1200);
        });
    }
});