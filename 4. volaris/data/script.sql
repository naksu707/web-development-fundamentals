-- ============================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM ('CLIENTE', 'AGENCIA', 'ADMIN');
CREATE TYPE estado_reserva AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA');
CREATE TYPE tipo_pqr AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA');
CREATE TYPE estado_pqr AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO');
CREATE TYPE tipo_salida_enum AS ENUM ('LOCAL', 'NACIONAL', 'INTERNACIONAL');
CREATE TYPE tipo_documento AS ENUM ('CC', 'CE', 'PASAPORTE', 'NIT');

-- ============================================================
-- 2. CREACIÓN DE TABLAS
-- ============================================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    tipo_doc tipo_documento NOT NULL,
    numero_doc VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    genero VARCHAR(20),
    numero_telefono VARCHAR(20),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'CLIENTE',
    pais VARCHAR(100) DEFAULT 'Colombia',
    departamento_provincia VARCHAR(100),
    imagen_url TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agencias (
    id SERIAL PRIMARY KEY,
    nombre_agencia VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    nit VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE viajes (
    id SERIAL PRIMARY KEY,
    agencia_id INT REFERENCES agencias(id) ON DELETE SET NULL,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    tipo_salida tipo_salida_enum NOT NULL DEFAULT 'NACIONAL',
    categoria VARCHAR(50),
    descripcion TEXT,
    fecha_salida DATE NOT NULL,
    fecha_llegada DATE,
    duracion_dias INT CHECK (duracion_dias > 0),
    cupos_totales INT NOT NULL CHECK (cupos_totales >= 0),
    cupos_disponibles INT NOT NULL CHECK (cupos_disponibles >= 0),
    precio_base NUMERIC(10, 2) NOT NULL CHECK (precio_base >= 0),
    imagen_url TEXT
);

CREATE TABLE itinerarios (
    id SERIAL PRIMARY KEY,
    viaje_id INT REFERENCES viajes(id) ON DELETE CASCADE,
    dia_numero INT NOT NULL CHECK (dia_numero > 0),
    titulo VARCHAR(150),
    descripcion TEXT,
    hora_inicio TIME
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    viaje_id INTEGER NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    precio_final NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'CONFIRMADA'
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    viaje_id INT REFERENCES viajes(id) ON DELETE CASCADE,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pqr (
    id SERIAL PRIMARY KEY,
    codigo_radicado VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    reserva_id INT REFERENCES reservas(id) ON DELETE SET NULL,
    tipo tipo_pqr NOT NULL,
    descripcion TEXT NOT NULL,
    estado estado_pqr DEFAULT 'PENDIENTE',
    respuesta TEXT,
    fecha_radicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estadisticas_mensuales (
    id SERIAL PRIMARY KEY,
    anio INT NOT NULL,
    mes INT CHECK (mes BETWEEN 1 AND 12),
    destino_top_id INT REFERENCES viajes(id) ON DELETE SET NULL,
    total_reservas INT DEFAULT 0,
    ingresos_totales NUMERIC(12, 2) DEFAULT 0.00,
    datos_json JSONB
);

-- ============================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_viajes_origen_destino ON viajes(origen, destino);
CREATE INDEX idx_viajes_busqueda ON viajes(fecha_salida, cupos_disponibles);
CREATE INDEX idx_itinerarios_viaje ON itinerarios(viaje_id);
CREATE INDEX idx_pqr_codigo ON pqr(codigo_radicado);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);