-- ============================================================
-- POBLADO DE DATOS (SEED)
-- ============================================================

-- A. AGENCIAS (5 REGISTROS)
INSERT INTO agencias (id, nombre_agencia, contacto, nit) VALUES
(1, 'Volaris Colombia', 'contacto@volaris.com', '900123456-1'),
(2, 'Expedia Latam', 'soporte@expedia.com', '900234567-2'),
(3, 'Despegar Colombia', 'info@despegar.com', '900345678-3'),
(4, 'Aviatur', 'atencion@aviatur.com', '900456789-4'),
(5, 'On Vacation', 'reservas@onvacation.com', '900567890-5');

SELECT setval('agencias_id_seq', (SELECT MAX(id) FROM agencias));


-- B. USUARIOS (150 REGISTROS: 5 AGENCIAS + 145 CLIENTES)

-- 1. Insertar Agencias en Usuarios
INSERT INTO usuarios (tipo_doc, numero_doc, nombre, apellido, email, password_hash, rol, numero_telefono, pais, departamento_provincia, imagen_url)
SELECT 
    'NIT'::tipo_documento,
    '900' || LPAD(a.id::text, 6, '0'),
    a.nombre_agencia,
    'S.A.S.',
    'admin@' || LOWER(REPLACE(REPLACE(a.nombre_agencia, ' ', ''), 'á', 'a')) || '.com',
    '$2b$12$eImiTXuWVxfM37uY4JANjO3p9qE4a.gE8N4wN8xHkY4z4L4w4L4w4',
    'AGENCIA'::rol_usuario,
    '+57 601 ' || (3000000 + a.id)::text,
    'Colombia',
    'Bogotá D.C.',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
FROM agencias a;

-- 2. Insertar Clientes
INSERT INTO usuarios (tipo_doc, numero_doc, nombre, apellido, genero, numero_telefono, email, password_hash, rol, pais, departamento_provincia, imagen_url)
SELECT 
    'CC'::tipo_documento,
    (1000000000 + i)::text,
    n.nombre,
    a.apellido,
    (ARRAY['MASCULINO', 'FEMENINO', 'OTRO'])[((i - 1) % 3) + 1],
    '+57 31' || (00000000 + i)::text,
    LOWER(n.nombre) || '.' || LOWER(a.apellido) || i || '@gmail.com',
    '$2b$12$eImiTXuWVxfM37uY4JANjO3p9qE4a.gE8N4wN8xHkY4z4L4w4L4w4',
    'CLIENTE'::rol_usuario,
    'Colombia',
    (ARRAY['Valle del Cauca', 'Antioquia', 'Cundinamarca', 'Santander', 'Atlántico'])[((i - 1) % 5) + 1],
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
FROM generate_series(1, 145) AS i
CROSS JOIN LATERAL (
    SELECT (ARRAY['Carlos', 'María', 'Alejandro', 'Sofia', 'Juan', 'Valentina', 'Mateo', 'Camila', 'Andrés', 'Daniela', 'Mariana', 'Santiago', 'David', 'Paula', 'Gabriel'])[((i - 1) % 15) + 1] AS nombre
) n
CROSS JOIN LATERAL (
    SELECT (ARRAY['Gómez', 'Rodríguez', 'López', 'García', 'Martínez', 'Pérez', 'Torres', 'Ramírez', 'Vargas', 'Ríos', 'Morales', 'Castro', 'Mendoza', 'Herrera', 'Ortega'])[((i - 1) % 15) + 1] AS apellido
) a;

-- C. VIAJES (200 REGISTROS)
-- Insertar los primeros 6 viajes con su tipo_salida asignado
INSERT INTO viajes (id, agencia_id, origen, destino, tipo_salida, categoria, descripcion, fecha_salida, cupos_totales, cupos_disponibles, precio_base, imagen_url) VALUES
(1, 1, 'Cali', 'Cartagena', 'NACIONAL', 'PLAYA', 'Disfruta del mar Caribe, la ciudad amurallada y sus playas históricas.', '2026-09-15', 30, 12, 450000.00, 'https://experienciascontinental.com/wp-content/uploads/2024/08/Torre-del-Reloj-en-Cartagena-de-Indias-Colombia.webp'),
(2, 1, 'Popayán', 'San Andrés', 'NACIONAL', 'PLAYA', 'Conoce el mar de los siete colores y sus increíbles arrecifes de coral.', '2026-10-01', 25, 8, 850000.00, 'https://media.staticontent.com/media/pictures/ecc404e8-9a99-46b0-a56a-ead992b5166e'),
(3, 2, 'Bogotá', 'Valle del Cocora', 'LOCAL', 'MONTANA', 'Recorre el majestuoso paisaje de las palmas de cera en el Quindío.', '2026-09-20', 40, 20, 280000.00, 'https://cms.w2m.com/dam/Sites/W2FLY/noticias/valle-cocora-que-ver-que-llegar-guia-practica/valle-de-cocora-sendero-palmas-de-cera-praderas-verdes.webp?v=1778672002669'),
(4, 3, 'Cali', 'La Guajira', 'NACIONAL', 'PLAYA', 'Aventura entre las dunas del desierto y el mar Caribe en el Cabo de la Vela.', '2026-11-05', 20, 5, 720000.00, 'https://colombia.travel/sites/default/files/Cabo_de_la_Vela%2C_Colombia.jpg'),
(5, 4, 'Neiva', 'Desierto de la Tatacoa', 'LOCAL', 'CIUDAD', 'Pasa una noche astronómica inolvidable en el bosque seco tropical.', '2026-09-18', 35, 15, 310000.00, 'https://radionacional-v3.s3.amazonaws.com/s3fs-public/node/article/field_image/tatacoa.jpg'),
(6, 5, 'Buenaventura', 'Parque del Café', 'LOCAL', 'CIUDAD', 'Vive la cultura cafetera, la diversión y la adrenalina de sus atracciones en el corazón del Quindío.', '2026-10-12', 50, 30, 250000.00, 'https://parquedelcafe.co/wp-content/uploads/2025/04/PDC_ParqueDelCafe_001.jpg');

-- Sincronizar la secuencia de viajes para evitar el error de llave duplicada
SELECT setval('viajes_id_seq', (SELECT MAX(id) FROM viajes));

-- Insertar los 194 viajes restantes variando tipos de salida
INSERT INTO viajes (agencia_id, origen, destino, tipo_salida, categoria, descripcion, fecha_salida, cupos_totales, cupos_disponibles, precio_base, imagen_url)
SELECT 
    (1 + (i % 5)),
    (ARRAY['Bogotá', 'Cali', 'Medellín', 'Barranquilla', 'Bucaramanga', 'Pereira'])[1 + (i % 6)],
    (ARRAY['Santa Marta', 'Cancún', 'Punta Cana', 'Eje Cafetero', 'Amazonas', 'Tayrona', 'Miami', 'Madrid'])[1 + (i % 8)],
    (ARRAY['LOCAL', 'NACIONAL', 'INTERNACIONAL']::tipo_salida_enum[])[1 + (i % 3)],
    (ARRAY['PLAYA', 'MONTANA', 'CIUDAD', 'NIEVE'])[1 + (i % 4)],
    'Explora este increíble destino lleno de cultura, naturaleza y experiencias inolvidables.',
    CURRENT_DATE + (i || ' days')::INTERVAL,
    30,
    FLOOR(RANDOM() * 25 + 1)::INT,
    (200000 + (RANDOM() * 800000))::NUMERIC(10,2),
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
FROM generate_series(7, 200) AS i;

-- D. RESERVAS (1,200 REGISTROS)
INSERT INTO reservas (usuario_id, viaje_id, fecha_reserva, precio_final, estado)
SELECT 
    (FLOOR(RANDOM() * 145) + 6)::INT,
    (FLOOR(RANDOM() * 200) + 1)::INT,
    CURRENT_TIMESTAMP - (i || ' hours')::INTERVAL,
    (250000 + (RANDOM() * 750000))::NUMERIC(10,2),
    (ARRAY['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA']::estado_reserva[])[1 + (i % 4)]
FROM generate_series(1, 1200) AS i;

-- E. COMENTARIOS (1,800 REGISTROS)
INSERT INTO comentarios (usuario_id, viaje_id, calificacion, mensaje, fecha)
SELECT 
    (FLOOR(RANDOM() * 145) + 6)::INT,
    (FLOOR(RANDOM() * 200) + 1)::INT,
    FLOOR(RANDOM() * 3 + 3)::INT,
    (ARRAY[
        '¡Una experiencia absolutamente increíble! Todo estuvo muy organizado.',
        'El paisaje superó mis expectativas. Volvería a viajar con ellos.',
        'Excelente servicio y puntualidad en los itinerarios.',
        'Muy buen itinerario, los guías fueron súper amables y atentos.',
        'Un viaje inolvidable, recomendable 100% para ir en familia.'
    ])[1 + (i % 5)],
    CURRENT_TIMESTAMP - (i || ' hours')::INTERVAL
FROM generate_series(1, 1800) AS i;

-- F. PQRS (500 REGISTROS)
INSERT INTO pqr (codigo_radicado, usuario_id, reserva_id, tipo, descripcion, estado, respuesta)
SELECT 
    'RAD-' || 20260000 + i,
    (FLOOR(RANDOM() * 145) + 6)::INT,
    (FLOOR(RANDOM() * 1200) + 1)::INT,
    (ARRAY['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA']::tipo_pqr[])[1 + (i % 4)],
    'Solicitud de soporte e información referente a la reserva o itinerario programado.',
    (ARRAY['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO']::estado_pqr[])[1 + (i % 4)],
    CASE WHEN (i % 2 = 0) THEN 'Su solicitud fue atendida satisfactoriamente por el equipo de soporte.' ELSE NULL END
FROM generate_series(1, 500) AS i;

-- G. ESTADÍSTICAS MENSUALES (2,000 REGISTROS)
INSERT INTO estadisticas_mensuales (anio, mes, destino_top_id, total_reservas, ingresos_totales, datos_json)
SELECT 
    2020 + (i % 7),
    1 + (i % 12),
    (FLOOR(RANDOM() * 200) + 1)::INT,
    FLOOR(RANDOM() * 50 + 10)::INT,
    (5000000 + (RANDOM() * 45000000))::NUMERIC(12,2),
    jsonb_build_object(
        'visitas_web', FLOOR(RANDOM() * 5000 + 1000),
        'satisfaccion_promedio', ROUND((RANDOM() * 1.5 + 3.5)::numeric, 2),
        'canal_principal', 'Web App'
    )
FROM generate_series(1, 2000) AS i;