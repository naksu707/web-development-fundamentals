document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const btnGoogle = document.querySelector('.btn-outline-danger');
    const API_URL = "http://127.0.0.1:5000/api/auth/login";
  
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correo').value.trim();
            const contrasena = document.getElementById('contrasena').value.trim();

            if (!correo || !contrasena) {
                mostrarAlerta('Advertencia', 'Por favor completa todos los campos.', 'warning');
                return;
            }

            try {
                Swal.fire({
                    title: 'Validando credenciales...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: correo, 
                        password: contrasena 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));

                    lanzarAnimacionAvion(() => {
                        window.location.href = 'viajes.html';
                    });
                } else {
                    mostrarAlerta('No se pudo iniciar sesión', data.error || 'Credenciales inválidas', 'error');
                }
            } catch (error) {
                console.error('Error en la autenticación:', error);
                mostrarAlerta('Error de Conexión', 'No se pudo conectar con el servidor. Inténtalo más tarde.', 'error');
            }
        });
    }

    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            Swal.fire({
                title: 'Autenticando con Google',
                text: 'Redirigiendo al proveedor de identidad...',
                icon: 'info',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                const usuarioGoogle = {
                    nombre: 'Pepita Perez',
                    correo: 'usuario@gmail.com'
                };
                const tokenSimulado = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.google_fake_token';

                localStorage.setItem('token', tokenSimulado);
                localStorage.setItem('usuario', JSON.stringify(usuarioGoogle));

                lanzarAnimacionAvion(() => {
                    window.location.href = 'index.html';
                });
            });
        });
    }

    function lanzarAnimacionAvion(callback) {
        Swal.fire({
            html: `
                <div class="text-center py-4">
                    <div class="avion-container mb-3">
                        <i class="fa-solid fa-plane-departure text-danger display-1 animacion-vuelo"></i>
                    </div>
                    <h4 class="fw-bold text-dark">¡Buen viaje!</h4>
                    <p class="text-secondary mb-0">Iniciando sesión correctamente...</p>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            timer: 2200,
            didClose: callback
        });
    }

    function mostrarAlerta(titulo, texto, icono) {
        Swal.fire({
            title: titulo,
            text: texto,
            icon: icono,
            confirmButtonColor: '#ff3838',
            confirmButtonText: 'Aceptar'
        });
    }
});