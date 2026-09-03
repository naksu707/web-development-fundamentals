# Historias de Usuario — Proyecto Volaris

**Versión:** 1.0.0  
**Basado en:** Documento de Especificación de Requerimientos (RF-01 a RF-19)

---

## Autenticación y Gestión de Usuarios

### HU-01: Registro de Usuarios
**Como** visitante de la plataforma  
**Quiero** registrarme creando una cuenta como Cliente o Agencia  
**Para** acceder a los servicios de reserva o publicación de viajes  

* **Criterios de Aceptación:**
  * **Dado** que un visitante ingresa al formulario de registro.
  * **Cuando** completa sus datos válidos (nombre, email, contraseña) y selecciona un rol (`Cliente` o `Agencia`).
  * **Entonces** el sistema guarda la contraseña encriptada con BCrypt y crea la cuenta correctamente.

### HU-02: Inicio de Sesión y Manejo de Sesión
**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a las funcionalidades protegidas de la plataforma  

* **Criterios de Aceptación:**
  * **Dado** que un usuario ingresa su correo y contraseña registrados.
  * **Cuando** envía el formulario de autenticación.
  * **Entonces** el sistema valida las credenciales y retorna un token JWT seguro para mantener la sesión activa.

### HU-03: Perfil de Usuario y Consulta de Viajes
**Como** cliente autenticado  
**Quiero** consultar mi perfil  
**Para** actualizar mis datos personales y ver mis viajes próximos e historial de viajes completados  

* **Criterios de Aceptación:**
  * **Dado** que un cliente inicia sesión y navega a su perfil.
  * **Cuando** carga la sección de viajes.
  * **Entonces** el sistema muestra dos listas separadas: reservas activas (próximos) y viajes cuyo estado sea completado (historial).

---

## Exploración, Búsqueda y Detalle de Viajes

### HU-04: Buscador de Viajes 
**Como** cliente  
**Quiero** buscar viajes por origen, destino, fechas y número de pasajeros  
**Para** encontrar opciones de paquetes que se adapten a mi disponibilidad  

* **Criterios de Aceptación:**
  * **Dado** que el usuario está explorar viajes.
  * **Cuando** ingresa los parámetros de búsqueda y presiona "Buscar".
  * **Entonces** el sistema filtra el catálogo y muestra únicamente las opciones que cumplen con los criterios solicitados.

### HU-05: Detalle de Viaje y Cupos en Tiempo Real
**Como** cliente  
**Quiero** ver el detalle completo de un viaje seleccionado  
**Para** conocer el itinerario, precio, servicios y cupos disponibles en tiempo real  

* **Criterios de Aceptación:**
  * **Dado** que el usuario selecciona un paquete del catálogo.
  * **Cuando** abre la vista de detalle.
  * **Entonces** el sistema consulta la base de datos y muestra la cantidad exacta de cupos disponibles al instante.

---

## Lógica de Reserva y Reglas Automáticas

### HU-06: Control de Cupos al Reservar
**Como** sistema  
**Quiero** validar la disponibilidad de cupos antes de confirmar una reserva  
**Para** prevenir el overbooking o sobreventa de asientos  

* **Criterios de Aceptación:**
  * **Dado** que un cliente intenta reservar $N$ cupos para un viaje.
  * **Cuando** ejecuta la solicitud de reserva.
  * **Entonces** el sistema procesa la transacción de forma atómica. Si hay cupos suficientes los descuenta, de lo contrario cancela la operación y notifica al usuario.

### HU-07: Aplicación Automática de Descuento de Última Hora
**Como** cliente  
**Quiero** recibir un 50% de descuento en viajes próximos a salir con cupos libres  
**Para** adquirir paquetes turísticos a precio promocional  

* **Criterios de Aceptación:**
  * **Dado** que un viaje tiene fecha de salida a 3 días o menos de la fecha actual y tiene cupos disponibles.
  * **Cuando** el algoritmo automático diario (o consulta en tiempo real) evalúa el viaje.
  * **Entonces** actualiza el precio cobrado aplicando automáticamente un 50% de descuento sobre el precio base.

---

## Reseñas, PQR y Calidad del Servicio

### HU-08: Calificación de Viajes Completados
**Como** cliente que ha finalizado un viaje  
**Quiero** calificar de 1 a 5 estrellas y redactar un comentario  
**Para** compartir mi experiencia con otros usuarios y la agencia  

* **Criterios de Aceptación:**
  * **Dado** que un usuario tiene una reserva registrada en estado *Completado*.
  * **Cuando** redacta su opinión y envía la calificación.
  * **Entonces** la reseña queda publicada en el detalle público del viaje y se enlaza al historial del usuario.

### HU-09: Radicación y Seguimiento de PQR
**Como** cliente  
**Quiero** enviar un formulario de PQR con código de radicado  
**Para** gestionar peticiones, quejas o reclamos hacia las agencias  

* **Criterios de Aceptación:**
  * **Dado** que un cliente llena el formulario de PQR especificando el tipo y la descripción.
  * **Cuando** presiona "Enviar".
  * **Entonces** el sistema guarda la PQR en estado `Pendiente` y genera un código único de seguimiento para el cliente.

### HU-10: Respuesta de PQR por parte de la Agencia
**Como** usuario con rol Agencia  
**Quiero** un panel de administración de PQR  
**Para** dar respuesta oficial a las solicitudes y actualizar su estado  

* **Criterios de Aceptación:**
  * **Dado** que una agencia ingresa a su panel de gestión de PQRs.
  * **Cuando** escribe la respuesta y cambia el estado a `Resuelto` o `Cerrado`.
  * **Entonces** la actualización se guarda y el cliente puede consultar la respuesta en su perfil.

---

## Analítica y Scroll Storytelling

### HU-11: Visualización Interactiva con Scroll Storytelling
**Como** usuario o administrador  
**Quiero** interactuar con una sección narrativa que despliegue gráficos al hacer scroll  
**Para** entender de forma visual las tendencias de viajes y preferencias del mercado  

* **Criterios de Aceptación:**
  * **Dado** que el usuario navega en la sección de Analítica.
  * **Cuando** realiza un desplazamiento vertical (scroll).
  * **Entonces** los elementos gráficos e indicadores se animan secuencialmente mostrando métricas como destinos más populares y temporadas altas.

### HU-12: Consolidación Mensual de Datos (Cron Job)
**Como** sistema  
**Quiero** ejecutar un proceso programado el primer día de cada mes  
**Para** consolidar las métricas de reservas y mantener el módulo analítico optimizado  

* **Criterios de Aceptación:**
  * **Dado** que llega el primer día de un nuevo mes a las 00:00 horas.
  * **Cuando** se dispara la tarea programada en segundo plano (*cron job*).
  * **Entonces** se calculan los totales del mes finalizado y se inserta un único registro estructurado en la tabla `EstadisticasMensuales`.