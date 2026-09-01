document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://127.0.0.1:5000/api/viajes';

    const heroBanner = document.getElementById('hero-banner');
    const heroTitle = document.getElementById('hero-title');
    const heroDescription = document.getElementById('hero-description');
    const heroBtn = document.getElementById('hero-btn');
    const dotsContainer = document.getElementById('carousel-dots');

    let listaViajes = [];
    let indiceActual = 0;
    let intervaloCarrusel = null;

    if (!heroBanner) {
        return;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const datos = await response.json();
        listaViajes = datos.slice(0, 5);

        if (listaViajes.length > 0) {
            heroBanner.classList.remove('loading');
            crearIndicadores(listaViajes.length);
            
            precargarTodasLasImagenes(listaViajes);

            mostrarViaje(0);
            iniciarCarrusel();
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        if (heroBanner) heroBanner.classList.remove('loading');
    }

    function precargarTodasLasImagenes(viajes) {
        viajes.forEach(viaje => {
            const url = viaje.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';
            const img = new Image();
            img.src = url;
        });
    }

    function mostrarViaje(index) {
        const viaje = listaViajes[index];
        if (!viaje) return;
        
        if (heroTitle) {
            heroTitle.innerHTML = `
                ${viaje.destino} 
                <span class="subtitulo-origen">Desde ${viaje.origen}</span>
            `;
        }

        if (heroDescription) {
            heroDescription.textContent = viaje.descripcion || 'Disfruta de una experiencia inolvidable explorando los mejores paisajes.';
        }

        if (heroBtn) {
            heroBtn.href = `destino-detalle.html?id=${viaje.id || viaje.id_viaje || index + 1}`;
        }

        const urlImagen = viaje.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';

        if (heroBanner) {
            heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${urlImagen}')`;
        }

        actualizarDots(index);
    }

    function crearIndicadores(total) {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                indiceActual = i;
                mostrarViaje(indiceActual);
                reiniciarIntervalo();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function actualizarDots(index) {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function iniciarCarrusel() {
        intervaloCarrusel = setInterval(() => {
            indiceActual = (indiceActual + 1) % listaViajes.length;
            mostrarViaje(indiceActual);
        }, 2500); 
    }

    function reiniciarIntervalo() {
        clearInterval(intervaloCarrusel);
        iniciarCarrusel();
    }
});

function renderizarNavbarSesion() {
    const userSessionContainer = document.getElementById('user-session-container');
    if (!userSessionContainer) return;

    const token = localStorage.getItem('token');
    const usuarioRaw = localStorage.getItem('usuario');

    if (token && usuarioRaw) {
        const usuario = JSON.parse(usuarioRaw);
        const nombreUsuario = usuario.nombre || "Usuario";

        userSessionContainer.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <a href="perfil.html" class="nav-link-custom fw-bold text-dark fs-6 text-decoration-none d-flex align-items-center">
                    <i class="fa-solid fa-user text-danger me-2"></i>${nombreUsuario}
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
}

renderizarNavbarSesion();