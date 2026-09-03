document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const archivoFoto = document.getElementById('reg-foto').files[0];
            let fotoBase64 = '';

            if (archivoFoto) {
                fotoBase64 = await convertirImagenABase64(archivoFoto);
            }

            const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];

            const nuevoId = usuariosGuardados.length > 0 
                ? Math.max(...usuariosGuardados.map(u => u.id || 0)) + 1 
                : 1;

            const nuevoUsuario = {
                id: nuevoId,
                nombre: document.getElementById('reg-nombre').value.trim(),
                foto: fotoBase64, 
                correo: document.getElementById('reg-correo').value.trim(),
                celular: document.getElementById('reg-celular').value.trim(),
                direccion: document.getElementById('reg-direccion').value.trim(),
                metodo_de_pago: document.getElementById('reg-metodo-pago').value,
                contraseña: document.getElementById('reg-password').value
            };

            const existe = usuariosGuardados.some(u => u.correo.toLowerCase() === nuevoUsuario.correo.toLowerCase());
            if (existe) {
                alert('El correo electrónico ya se encuentra registrado.');
                return;
            }

            usuariosGuardados.push(nuevoUsuario);
            localStorage.setItem('usuarios_registrados', JSON.stringify(usuariosGuardados));
            localStorage.setItem('usuario_activo', JSON.stringify(nuevoUsuario));

            alert('¡Registro exitoso!');
            window.location.href = 'index.html';
        });
    }
});

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}