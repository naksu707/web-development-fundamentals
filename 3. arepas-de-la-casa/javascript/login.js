document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (!formLogin) return; 

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        try {
            const response = await fetch('data/data.json'); 
            const data = await response.json();
            const usuarios = data.usuarios;

           
            const usuarioEncontrado = usuarios.find(
                user => user.correo === emailInput && user.contraseña === passwordInput
            );

            if (usuarioEncontrado) {
               
                localStorage.setItem('usuario_activo', JSON.stringify(usuarioEncontrado));
                localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));

                const urlParams = new URLSearchParams(window.location.search);
                const redirectParam = urlParams.get('redirect');
                const origen = redirectParam || document.referrer;

                if (origen.includes('ir-a-pagar.html') || origen.includes('checkout')) {
                    window.location.href = 'ir-a-pagar.html';
                } else if (origen.includes('carrito.html')) {
                    window.location.href = 'carrito.html';
                } else {
                    window.location.href = 'index.html';
                }

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de autenticación',
                    text: 'Correo o contraseña incorrectos. Por favor intenta de nuevo.'
                });
            }

        } catch (error) {
            console.error('Error al validar las credenciales:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar los usuarios.'
            });
        }
    });
});