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

    const imagenesDestino = {
        'PLAYA': 'https://experienciascontinental.com/wp-content/uploads/2024/08/Torre-del-Reloj-en-Cartagena-de-Indias-Colombia.webp',
        'CIUDAD': 'https://images.unsplash.com/photo-1583997052301-202f52c8d43b?auto=format&fit=crop&w=1600&q=80',
        'MONTAÑA': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
        'NIEVE': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80'
    };

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const datos = await response.json();

        listaViajes = datos.slice(0, 5);

        if (listaViajes.length > 0) {
            heroBanner.classList.remove('loading');
            crearIndicadores(listaViajes.length);
            mostrarViaje(0);
            iniciarCarrusel();
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        heroBanner.classList.remove('loading');
    }

    function mostrarViaje(index) {
        const viaje = listaViajes[index];
        if (!viaje) return;
        
        heroTitle.innerHTML = `
            ${viaje.destino} 
            <span class="subtitulo-origen">Desde ${viaje.origen}</span>
        `;

        heroDescription.textContent = viaje.descripcion || 'Disfruta de una experiencia inolvidable explorando los mejores paisajes.';

        const urlImagen = viaje.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';

        heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${urlImagen}')`;
        
        if (heroBtn) {
            heroBtn.href = `destino-detalle.html?id=${viaje.id || viaje.id_viaje || index + 1}`;
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
        }, 2000);
    }

    function reiniciarIntervalo() {
        clearInterval(intervaloCarrusel);
        iniciarCarrusel();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btnHamburguesa = document.getElementById('btn-hamburguesa');
    const navLinks = document.querySelector('.nav-links');

    if (btnHamburguesa && navLinks) {
        btnHamburguesa.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const sessionContainer = document.getElementById('user-session-container');

    const usuarioGuardado = localStorage.getItem('usuario');
    const tokenGuardado = localStorage.getItem('token');

    if (sessionContainer && usuarioGuardado && tokenGuardado) {
        const usuario = JSON.parse(usuarioGuardado);

        const esPaginaPerfil = window.location.pathname.endsWith('perfil.html');
        const activeClass = esPaginaPerfil ? 'active' : '';

        sessionContainer.innerHTML = `
            <div class="user-info">
                <a href="perfil.html" class="user-name ${activeClass}">
                    Hola, ${usuario.nombre.split(' ')[0]}
                </a>
                <button id="btn-logout" class="btn-logout">Cerrar sesión</button>
            </div>
        `;

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = 'index.html';
            });
        }
    }
});