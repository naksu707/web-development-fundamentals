# Especificación de Requerimientos de Software (ERS)

**Proyecto:** Sistema de Gestión de Viajes y Analítica — Volaris  
**Versión:** 1.0.0  
**Estado:** Definido / Listo para Backlog  

---

## 1. Requerimientos Funcionales (RF)

### Gestión de Usuarios y Autenticación
* **RF-01 Registro:** El sistema debe permitir el registro de usuarios asignando roles explícitos (`Cliente` y `Agencia`).
* **RF-02 Autenticación:** El sistema debe autenticar usuarios mediante correo electrónico y contraseña encriptada, gestionando la sesión a través de tokens seguros (JWT / Sesiones).
* **RF-03 Perfil de Usuario:** El usuario podrá visualizar y editar sus datos personales.
* **RF-04 Historial y Próximos Viajes:** El perfil debe listar de forma separada los viajes completados (historial) y las reservas activas (próximos viajes).

### Portal Principal e Índice (Landing Page / Index)
* **RF-05 Buscador Integrado:** Filtro dinámico de viajes por origen, destino, fechas y cantidad de pasajeros.
* **RF-06 Módulo de Promociones:** Destacado automático de oferta de vuelos y paquetes turísticos activos.

### Catálogo de Servicios y Agencias
* **RF-07 Visualización de Oferta:** Exposición del catálogo completo de tours y paquetes ofrecidos por agencias afiliadas.
* **RF-08 Filtros Avanzados:** Búsqueda por precio, destino, duración, valoración y agencia proveedora.
* **RF-09 Detalle del Viaje:** Muestra detallada de itinerario, servicios incluidos, precio base y cupos disponibles en tiempo real.

### Lógica de Negocio y Reglas Automáticas
* **RF-10 Control de Cupos:** Validación síncrona de disponibilidad de cupos al iniciar un proceso de reserva para evitar *overbooking*.
* **RF-11 Algoritmo de Descuento Automático de Última Hora:**
  * El sistema evaluará diariamente las fechas de salida de cada viaje.
  * Si faltan **3 días o menos** para la partida y existen cupos disponibles, el sistema aplicará un **50% de descuento automático** sobre el precio base.

### Reseñas y Comentarios
* **RF-12 Publicación de Comentarios:** Permitir a usuarios con viajes en estado *Completado* calificar (1 a 5 estrellas) y redactar una reseña sobre la experiencia.
* **RF-13 Historial de Reseñas:** Consulta pública de comentarios en la vista de detalle de cada viaje y privada en el perfil del cliente.

### Módulo de PQR (Peticiones, Quejas, Reclamos y Sugerencias)
* **RF-14 Radicación de PQR:** Formulario para enviar PQRs clasificadas por tipo (*Petición*, *Queja*, *Reclamo*, *Sugerencia*), asociando opcionalmente un número de reserva.
* **RF-15 Código de Seguimiento:** Generación automática de un código único de radicado tras el envío.
* **RF-16 Seguimiento y Gestión:**
  * El cliente podrá verificar el estado de su PQR (`Pendiente`, `En Revisión`, `Resuelto`, `Cerrado`).
  * La Agencia dispondrá de un panel para dar respuesta oficial y cambiar el estado de la solicitud.

### Módulo de Analítica y Scroll Storytelling
* **RF-17 Experiencia Interactiva (Scroll Storytelling):** Presentación narrativa basada en desplazamiento vertical que presente de forma secuencial gráficos interactivos sobre las tendencias del mercado.
* **RF-18 Métricas Visibles:** Visualización de destinos más populares, épocas de mayor tráfico, rangos de precio predilectos y patrones de consumo por temporada.
* **RF-19 Consolidado Mensual Automatizado:** Proceso en segundo plano (*cron job*) que el primer día de cada mes procese el histórico de transacciones, actualice las métricas consolidadas y alimente la vista analítica sin penalizar la base de datos transaccional.

---

## 2. Requerimientos No Funcionales (RNF)

* **RNF-01 Persistencia e Integridad:** Uso de un sistema de gestión de bases de datos relacional (RDBMS) para garantizar consistencia ACID en las reservas y transacciones de cupos.
* **RNF-02 Seguridad:** Encriptación de contraseñas con algoritmos de hash seguros (ej. BCrypt) y autorización basada en roles (RBAC).
* **RNF-03 Rendimiento:** Tiempo de respuesta inferior a 2 segundos en búsquedas y validación de cupos.
* **RNF-04 Usabilidad:** Interfaz responsive adaptada a dispositivos móviles y de escritorio, optimizada para la navegación por scroll en el módulo de analítica.

---

## 3. Modelo de Datos Relacional (Esquema Resumido)

```text
[Agencias] 1 ------- N [Viajes] 1 ------- N [Itinerarios]
                          |
                          | 1
                          |
                          | N
[Usuarios] 1 ------- N [Reservas]
   |  |
   |  +------------- N [Comentarios] (vía Reserva/Viaje)
   |
   +---------------- N [PQR]
   |
   +---------------- 1 [Perfil]

[EstadisticasMensuales] (Tabla independiente para Analítica)
```

### Tabla de Entidades Principales

| Entidad | Descripción | Campos Clave |
| :--- | :--- | :--- |
| **Usuarios** | Registra los datos de acceso y roles | `id`, `tipo_doc`, `numero_doc`, `nombre`, `apellido`, `genero`, `numero_telefono`, `email`, `password_hash`, `rol`, `pais`, `departamento_provincia`, `imagen_url`, `fecha_registro` |
| **Agencias** | Información de empresas proveedoras de tours | `id`, `nombre_agencia`, `contacto`, `nit` |
| **viajes** | Oferta de vuelos y paquetes | `id`, `agencia_id`, `origen`, `destino`, `tipo_salida`, `categoria`, `descripcion`, `fecha_salida`, `fecha_llegada`, `duracion_dias`, `cupos_totales`, `cupos_disponibles`, `precio_base`, `imagen_url` |
| **itinerarios** | Cronograma y actividades asociadas a cada viaje | `id`, `viaje_id`, `dia_numero`, `titulo`, `descripcion`, `hora_inicio` |
| **Reservas** | Transacciones de compra de cupos | `id`, `usuario_id`, `viaje_id`, `fecha_reserva`, `precio_final`, `estado` |
| **Comentarios** | Evaluaciones de viajes finalizados | `id`, `usuario_id`, `viaje_id`, `calificacion`, `mensaje`, `fecha` |
| **PQR** | Módulo de atención a solicitudes | `id`, `codigo_radicado`, `usuario_id`, `reserva_id`, `tipo`, `descripcion`, `estado`, `respuesta` |
| **EstadisticasMensuales** | Reportes consolidados para el Scroll storytelling | `id`, `anio`, `mes`, `destino_top_id`, `total_reservas`, `ingresos_totales`, `datos_json` |
