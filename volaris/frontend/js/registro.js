document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registro-form");
    const tipoDocSelect = document.getElementById("tipo_doc");
    const rolSelect = document.getElementById("rol");
    const passwordInput = document.getElementById("password");
    const validarPasswordInput = document.getElementById("validar_password");
    const btnRegistrar = document.getElementById("btn-registrar");

    const API_URL = "http://127.0.0.1:5000/api/auth/registro";

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            return false;
        });
    }

    function mostrarAlerta(opciones) {
        if (typeof Swal !== "undefined") {
            return Swal.fire(opciones);
        }
        console.warn("SweetAlert2 no está disponible, usando alert() de respaldo.");
        alert(`${opciones.title}\n${opciones.text || ""}`);
        return Promise.resolve();
    }

    function actualizarRolSegunDocumento() {
        const tipoDoc = tipoDocSelect.value;

        if (!tipoDoc) {
            rolSelect.disabled = false;
            return;
        }

        if (tipoDoc === "CC" || tipoDoc === "CE" || tipoDoc === "PASAPORTE") {
            rolSelect.value = "Cliente";
            rolSelect.disabled = true;
        } else if (tipoDoc === "NIT") {
            rolSelect.value = "Agencia";
            rolSelect.disabled = true;
        } else {
            rolSelect.disabled = false;
        }
    }

    tipoDocSelect.addEventListener("change", actualizarRolSegunDocumento);
    actualizarRolSegunDocumento();

    function passwordsCoinciden() {
        if (passwordInput.value !== validarPasswordInput.value) {
            validarPasswordInput.setCustomValidity("Las contraseñas no coinciden.");
            return false;
        }
        validarPasswordInput.setCustomValidity("");
        return true;
    }

    passwordInput.addEventListener("input", passwordsCoinciden);
    validarPasswordInput.addEventListener("input", passwordsCoinciden);

    btnRegistrar.addEventListener("click", async (e) => {
        e.preventDefault(); 
        console.log("1. Clic en el botón registrar detectado");

        const pwOk = passwordsCoinciden();
        console.log("2. passwordsCoinciden =", pwOk);

        if (!pwOk) {
            console.log("2a. Las contraseñas no coinciden");
            mostrarAlerta({
                icon: "error",
                title: "Las contraseñas no coinciden",
                text: "Por favor verifica que ambas contraseñas sean iguales.",
            });
            return;
        }

        const formOk = form.checkValidity();
        console.log("3. form.checkValidity() =", formOk);

        if (!formOk) {
            console.log("3a. Campos incompletos/inválidos en HTML");
            form.reportValidity();
            return;
        }

        console.log("4. Formulario válido, procesando envío");

        const rolEstabaBloqueado = rolSelect.disabled;
        if (rolEstabaBloqueado) rolSelect.disabled = false;

        const formData = new FormData(form);
        formData.delete("validar_password");
        formData.delete("terminos");
        formData.set("rol", rolSelect.value.toUpperCase());

        if (rolEstabaBloqueado) rolSelect.disabled = true;

        const textoOriginal = btnRegistrar.innerHTML;
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = "Registrando...";

        try {
            console.log("5. Enviando petición fetch al backend...");
            const response = await fetch(API_URL, {
                method: "POST",
                body: formData,
            });

            console.log("6. Petición finalizada, status:", response.status);
            const data = await response.json();

            if (!response.ok) {
                console.log("6a. Error devuelto por la API:", data.error);
                await mostrarAlerta({
                    icon: "error",
                    title: "No se pudo completar el registro",
                    text: data.error || "Ocurrió un error inesperado.",
                });
                return;
            }

            console.log("7. Registro exitoso, mostrando modal...");
            await mostrarAlerta({
                icon: "success",
                title: "¡Registro exitoso!",
                text: data.mensaje || "Tu cuenta fue creada correctamente.",
            });

            window.location.href = "login.html";

        } catch (error) {
            console.error("CATCH Error:", error);
            mostrarAlerta({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo conectar con el servidor backend.",
            });
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = textoOriginal;
        }
    });

    const btnGoogle = document.getElementById("btn-google");
    if (btnGoogle) {
        btnGoogle.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarAlerta({
                icon: "info",
                title: "Próximamente",
                text: "El registro con Google estará disponible pronto.",
            });
        });
    }
});