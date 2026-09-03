document.addEventListener("DOMContentLoaded", () => {
    
    let carrito = JSON.parse(localStorage.getItem("carrito_arepas")) || [];

    const listaCarrito = document.getElementById("lista-carrito");
    const precioTotal = document.getElementById("precio-total");
    const contadorCarrito = document.getElementById("contador-carrito");
    const btnPagar = document.getElementById("btn-finalizar") || document.getElementById("btn-pagar");

    let alertaActiva = false;

    if (btnPagar) {
        btnPagar.addEventListener("click", () => {
            const totalActual = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
            if (carrito.length > 0 && totalActual <= 10) {
                window.location.href = "ir-a-pagar.html";
            }
        });
    }

    function mostrarAlertaLimite() {
        if (!alertaActiva && typeof Swal !== "undefined") {
            alertaActiva = true;
            Swal.fire({
                title: '¡Límite alcanzado!',
                text: 'Puedes comprar solo 10 arepas en este pedido',
                icon: 'warning',
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: undefined, 
                background: '#ffffff',
                color: '#2c3e50',
                iconColor: '#f39c12'
            });
        }
    }

    function ocultarAlertaLimite() {
        if (alertaActiva && typeof Swal !== "undefined") {
            Swal.close();
            alertaActiva = false;
        }
    }

    function renderizarCarrito() {
        const totalUnidades = carrito.reduce((acc, prod) => acc + prod.cantidad, 0);
        if (contadorCarrito) contadorCarrito.textContent = totalUnidades;

        if (carrito.length === 0) {
            ocultarAlertaLimite();
            listaCarrito.innerHTML = `
                <div class="carrito-vacio">
                    <p>Tu carrito está vacío</p>
                    <a href="menu.html" class="btn-volver">Ir al menú</a>
                </div>
            `;
            if (precioTotal) precioTotal.textContent = "$0";
            
            if (btnPagar) {
                btnPagar.disabled = true;
                btnPagar.classList.add("deshabilitado");
            }
            return;
        }

        listaCarrito.innerHTML = "";
        let totalGeneral = 0;

        carrito.forEach((producto, index) => {
            const subtotal = producto.precio * producto.cantidad;
            totalGeneral += subtotal;

            const cardProducto = document.createElement("div");
            cardProducto.classList.add("item-carrito");

            cardProducto.innerHTML = `
                <div class="item-info">
                    <a href="detalle.html?id=${producto.id}">
                        <img src="${producto.foto || producto.imagen || 'img/iconos/arepa.png'}" alt="${producto.nombre}" class="item-img" style="cursor: pointer;">
                    </a>
                    <div class="item-detalles">
                        <a href="detalle.html?id=${producto.id}" style="text-decoration: none; color: inherit;">
                            <h4>${producto.nombre}</h4>
                        </a>
                        <span class="item-precio">$${producto.precio.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="item-acciones">
                    <div class="control-cantidad">
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                        <span>${producto.cantidad}</span>
                        <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                    <span class="item-subtotal">$${subtotal.toLocaleString()}</span>
                    <button class="btn-eliminar" onclick="eliminarProducto(${index})" title="Eliminar producto">
                        <img src="img/iconos/borrar.gif" alt="eliminar" class="icono">
                    </button>
                </div>
            `;

            listaCarrito.appendChild(cardProducto);
        });

        if (precioTotal) {
            precioTotal.textContent = `$${totalGeneral.toLocaleString()}`;
        }

        if (totalUnidades > 10) {
            mostrarAlertaLimite();
            if (btnPagar) {
                btnPagar.disabled = true;
                btnPagar.classList.add("deshabilitado");
            }
        } else {
            ocultarAlertaLimite();
            if (btnPagar) {
                btnPagar.disabled = false;
                btnPagar.classList.remove("deshabilitado");
            }
        }
    }

    window.cambiarCantidad = function(index, cambio) {
        carrito[index].cantidad += cambio;

        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1); 
        }

        guardarYActualizar();
    };

    window.eliminarProducto = function(index) {
        carrito.splice(index, 1);
        guardarYActualizar();
    };

    function guardarYActualizar() {
        localStorage.setItem("carrito_arepas", JSON.stringify(carrito));
        renderizarCarrito();
    }

    renderizarCarrito();
});