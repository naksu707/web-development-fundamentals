import os
import datetime
import jwt
from flask import Flask, jsonify, request, send_from_directory
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from db import get_db_connection
from werkzeug.utils import secure_filename
import random
import string
from apscheduler.schedulers.background import BackgroundScheduler
import json

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])
bcrypt = Bcrypt(app)

SECRET_KEY = "volaris_secreto_super_seguro_2026_key_desarrollo"

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

PREFIJOS_AGENCIA = {
    1: "CT",  # Agencia 1
    2: "VL",  # Agencia 2 
    3: "PS",  # Agencia 3
    4: "VC"   # Agencia 4
}

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ==========================================
# LANDING PAGE
# ==========================================
@app.route("/api/viajes", methods=["GET"])
def obtener_viajes():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT DISTINCT ON (LOWER(destino)) * 
            FROM viajes 
            WHERE fecha_salida >= CURRENT_DATE AND cupos_disponibles > 0
            ORDER BY LOWER(destino), fecha_salida ASC;
        """)
        viajes = cur.fetchall()

        viajes_ordenados = sorted(viajes, key=lambda x: x['fecha_salida'])

        return jsonify(viajes_ordenados), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en obtener_viajes: {e}")
        return jsonify([]), 500

    finally:
        cur.close()
        conn.close()


@app.route("/api/estadisticas/resumen", methods=["GET"])
def resumen_estadisticas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT 
            (SELECT COUNT(*) FROM usuarios WHERE rol = 'CLIENTE') AS total_clientes,
            (SELECT COUNT(*) FROM viajes) AS total_viajes,
            (SELECT COUNT(*) FROM reservas) AS total_reservas,
            (SELECT COALESCE(SUM(precio_final), 0) FROM reservas) AS ingresos_totales;
    """)
    resumen = cur.fetchone()

    cur.close()
    conn.close()
    return jsonify(resumen), 200

# ==========================================
# HU-01: REGISTRO DE USUARIOS
# ==========================================
@app.route("/api/auth/registro", methods=["POST"])
def registrar_usuario():
    tipo_doc = request.form.get("tipo_doc", "").strip()
    numero_doc = request.form.get("numero_doc", "").strip()
    nombre = request.form.get("nombre", "").strip()
    apellido = request.form.get("apellido", "").strip()
    genero = request.form.get("genero", "").strip() or None
    numero_telefono = request.form.get("numero_telefono", "").strip() or None
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    rol = request.form.get("rol", "CLIENTE").strip().upper()
    pais = request.form.get("pais", "Colombia").strip()
    departamento_provincia = request.form.get("departamento_provincia", "").strip() or None

    if not tipo_doc or not numero_doc or not nombre or not email or not password:
        return jsonify({"error": "Todos los campos obligatorios deben completarse."}), 400

    if rol not in ["CLIENTE", "AGENCIA"]:
        return jsonify({"error": "El tipo de usuario seleccionado no es válido."}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if rol == "AGENCIA" or tipo_doc == "NIT":
            cur.execute("SELECT id FROM agencias WHERE nit = %s;", (numero_doc,))
            agencia_existente = cur.fetchone()
            
            if not agencia_existente:
                return jsonify({
                    "error": "El NIT ingresado no existe, valida nuevamente con un NIT ya inscrito"
                }), 400

        cur.execute("SELECT id FROM usuarios WHERE email = %s;", (email,))
        if cur.fetchone():
            return jsonify({"error": "El correo electrónico ingresado ya se encuentra registrado."}), 409

        imagen_url = None
        if 'imagen' in request.files:
            file = request.files['imagen']
            if file and file.filename != '':
                filename = secure_filename(f"{numero_doc}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                imagen_url = f"/uploads/{filename}"

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        cur.execute(
            """
                INSERT INTO usuarios (
                    tipo_doc, numero_doc, nombre, apellido, genero, 
                    numero_telefono, email, password_hash, rol, 
                    pais, departamento_provincia, imagen_url
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::rol_usuario, %s, %s, %s)
                RETURNING id, tipo_doc, numero_doc, nombre, apellido, email, rol, imagen_url;
            """,
            (
                tipo_doc, numero_doc, nombre, apellido, genero,
                numero_telefono, email, password_hash, rol,
                pais, departamento_provincia, imagen_url
            ),
        )

        nuevo_usuario = cur.fetchone()
        conn.commit()

        return jsonify({
            "mensaje": "Usuario registrado exitosamente",
            "usuario": nuevo_usuario,
        }), 201

    except psycopg2.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)

        if "usuarios_email_key" in error_msg or "email" in error_msg:
            mensaje = "El correo electrónico ingresado ya se encuentra registrado."
        elif "numero_doc" in error_msg:
            mensaje = "El número de documento ingresado ya está registrado."
        else:
            mensaje = "No se pudo realizar el registro con los datos ingresados."

        return jsonify({"error": mensaje}), 409

    except Exception as e:
        conn.rollback()
        print(f"Error en servidor durante el registro: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor. Inténtalo de nuevo más tarde."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-02: INICIO DE SESIÓN Y MANEJO DE SESIÓN
# ==========================================
@app.route("/api/auth/login", methods=["POST"])
def login():
    datos = request.get_json() or {}
    email = datos.get("email", "").strip().lower()
    password = datos.get("password", "")

    if not email or not password:
        return jsonify({"error": "Por favor ingresa tu correo y contraseña."}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cur.fetchone()

        if not usuario:
            return jsonify({"error": "El correo ingresado no se encuentra registrado."}), 404

        pwd_hash = usuario["password_hash"]
        es_valida = False

        try:
            es_valida = bcrypt.check_password_hash(pwd_hash, password)
        except ValueError:
            es_valida = (pwd_hash == password)

        if not es_valida:
            return jsonify({"error": "La contraseña ingresada es incorrecta."}), 401

        payload = {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "mensaje": "Inicio de sesión exitoso",
            "token": token,
            "usuario": {
                "id": usuario["id"],
                "nombre": usuario["nombre"],
                "apellido": usuario["apellido"],
                "tipo_doc": usuario["tipo_doc"],      
                "numero_doc": usuario["numero_doc"],   
                "email": usuario["email"],
                "numero_telefono": usuario["numero_telefono"],
                "genero": usuario["genero"],
                "rol": usuario["rol"],
                "imagen_url": usuario["imagen_url"],
                "fecha_registro": usuario["fecha_registro"].isoformat() if usuario.get("fecha_registro") else None
            },
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en login: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor. Inténtalo de nuevo."}), 500

    finally:
        cur.close()
        conn.close()

@app.route("/api/auth/google", methods=["POST"])
def google_login():
    datos = request.get_json() or {}
    email = datos.get("email", "").strip().lower()
    nombre = datos.get("nombre", "Usuario Google").strip()

    if not email:
        return jsonify({"error": "No se recibió un correo de Google válido."}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cur.fetchone()

        if not usuario:
            password_dummy = bcrypt.generate_password_hash("GoogleAuth_SecurePassword").decode("utf-8")
            cur.execute(
                """
                INSERT INTO usuarios (tipo_doc, numero_doc, nombre, apellido, email, password_hash, rol, pais)
                VALUES ('CC', %s, %s, '', %s, %s, 'CLIENTE', 'Colombia')
                RETURNING id, nombre, email, rol;
                """,
                (f"G-{int(datetime.datetime.utcnow().timestamp())}", nombre, email, password_dummy)
            )
            usuario = cur.fetchone()
            conn.commit()

        payload = {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "mensaje": "Inicio de sesión con Google exitoso",
            "token": token,
            "usuario": {
                "id": usuario["id"],
                "nombre": usuario["nombre"],
                "email": usuario["email"],
                "rol": usuario["rol"],
            },
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en google_login: {e}")
        return jsonify({"error": "Error interno del servidor al procesar la solicitud con Google."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-03: CONSULTA DE PERFIL Y VIAJES
# ==========================================
@app.route("/api/reservas/usuario/<int:usuario_id>", methods=["GET"])
def obtener_reservas_usuario(usuario_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT id, nombre, apellido, email, numero_telefono, genero, rol, imagen_url, fecha_registro 
            FROM usuarios WHERE id = %s;
        """, (usuario_id,))
        usuario = cur.fetchone()

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        if usuario.get("fecha_registro"):
            usuario["fecha_registro"] = usuario["fecha_registro"].isoformat()

        cur.execute("""
            SELECT 
                r.id AS id_reserva,
                r.codigo AS codigo_reserva,
                r.estado AS estado_reserva,
                r.precio_final,
                TO_CHAR(r.fecha_reserva, 'HH12:MI AM / Month DD, YYYY') AS fecha_reserva_formateada,
                v.id AS id_viaje,
                v.destino,
                v.origen,
                v.imagen_url
            FROM reservas r
            JOIN viajes v ON r.viaje_id = v.id
            WHERE r.usuario_id = %s
            ORDER BY r.fecha_reserva DESC;
        """, (usuario_id,))

        reservas = cur.fetchall()

        return jsonify({
            "usuario": usuario,
            "reservas": reservas
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en obtener_reservas_usuario: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

    finally:
        cur.close()
        conn.close()

# ACTUALIZAR DATOS COMPLETOS DE PERFIL
@app.route("/api/auth/perfil/<int:usuario_id>", methods=["PUT"])
def actualizar_perfil(usuario_id):
    nombre = request.form.get("nombre", "").strip()
    apellido = request.form.get("apellido", "").strip()
    numero_telefono = request.form.get("numero_telefono", "").strip() or None
    genero = request.form.get("genero", "").strip() or None
    password = request.form.get("password", "").strip()

    if not nombre:
        return jsonify({"error": "El nombre es obligatorio."}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT numero_doc, password_hash, imagen_url, fecha_registro FROM usuarios WHERE id = %s;", (usuario_id,))
        usuario_actual = cur.fetchone()

        if not usuario_actual:
            return jsonify({"error": "Usuario no encontrado."}), 404

        imagen_url = usuario_actual["imagen_url"]
        if 'imagen' in request.files:
            file = request.files['imagen']
            if file and file.filename != '':
                filename = secure_filename(f"{usuario_actual['numero_doc']}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                imagen_url = f"/uploads/{filename}"

        password_hash = usuario_actual["password_hash"]
        if password:
            if len(password) < 8:
                return jsonify({"error": "La nueva contraseña debe tener al menos 8 caracteres."}), 400
            password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        cur.execute(
            """
            UPDATE usuarios 
            SET nombre = %s, apellido = %s, numero_telefono = %s, genero = %s, imagen_url = %s, password_hash = %s
            WHERE id = %s
            RETURNING id, nombre, apellido, email, numero_telefono, genero, rol, imagen_url, fecha_registro;
            """,
            (nombre, apellido, numero_telefono, genero, imagen_url, password_hash, usuario_id)
        )
        usuario_actualizado = cur.fetchone()
        if usuario_actualizado.get("fecha_registro"):
            usuario_actualizado["fecha_registro"] = usuario_actualizado["fecha_registro"].isoformat()

        conn.commit()

        return jsonify({
            "mensaje": "Perfil actualizado correctamente",
            "usuario": usuario_actualizado
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error al actualizar perfil: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-04: BUSCADOR DE VIAJES
# ==========================================
@app.route("/api/viajes/buscar", methods=["GET"])
def buscar_viajes():
    destino = request.args.get("destino", "").strip()
    fecha = request.args.get("fecha", "").strip()
    pasajeros = request.args.get("pasajeros", type=int, default=1)
    
    tipo_salida = request.args.get("tipo_salida", "").strip()
    duracion = request.args.get("duracion", "").strip()
    categoria = request.args.get("categoria", "").strip()
    precio_min = request.args.get("precio_min", type=float, default=0)
    precio_max = request.args.get("precio_max", type=float, default=5000000)

    if precio_max >= 5000000:
        precio_max = 999999999.0

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        query = "SELECT * FROM viajes WHERE cupos_disponibles >= %s AND precio_base BETWEEN %s AND %s AND fecha_salida >= CURRENT_DATE"
        params = [pasajeros, precio_min, precio_max]

        if fecha:
            query += " AND fecha_salida >= %s"
            params.append(fecha)

        if tipo_salida:
            lista_tipos = [t.strip().upper() for t in tipo_salida.split(",") if t.strip()]
            if lista_tipos:
                placeholders = ", ".join(["%s"] * len(lista_tipos))
                query += f" AND UPPER(tipo_salida::text) IN ({placeholders})"
                params.extend(lista_tipos)

        if duracion:
            lista_durs = [d.lower().strip() for d in duracion.split(",") if d.strip()]
            dur_conditions = []

            for d in lista_durs:
                if "pasad" in d or "1" in d:
                    dur_conditions.append("duracion_dias = 1")
                elif "fin" in d or "2" in d or "3" in d:
                    dur_conditions.append("duracion_dias BETWEEN 2 AND 4")
                elif "semana" in d or "completa" in d or "5" in d:
                    dur_conditions.append("duracion_dias >= 5")

            if dur_conditions:
                query += " AND (" + " OR ".join(dur_conditions) + ")"

        if categoria:
            lista_cats = [c.strip() for c in categoria.split(",") if c.strip()]
            cat_conditions = []
            for c in lista_cats:
                palabra = c.split('/')[0].strip().lower()
                cat_conditions.append("LOWER(TRANSLATE(categoria, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) LIKE LOWER(TRANSLATE(%s, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'))")
                params.append(f"%{palabra}%")
            
            if cat_conditions:
                query += " AND (" + " OR ".join(cat_conditions) + ")"

        if destino:
            query += """ 
                AND (
                    LOWER(TRANSLATE(destino, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) LIKE LOWER(TRANSLATE(%s, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) OR
                    LOWER(TRANSLATE(origen, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) LIKE LOWER(TRANSLATE(%s, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'))
                )
            """
            params.extend([f"%{destino}%", f"%{destino}%"])

        query += " ORDER BY fecha_salida ASC, precio_base ASC;"
        cur.execute(query, tuple(params))
        resultados = cur.fetchall()

        return jsonify(resultados), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en buscar_viajes: {e}")
        return jsonify({"error": "Ocurrió un error al realizar la búsqueda."}), 500

    finally:
        cur.close()
        conn.close()

@app.route("/api/viajes/sugerencias", methods=["GET"])
def obtener_sugerencias():
    query_texto = request.args.get("q", "").strip()

    if not query_texto or len(query_texto) < 2:
        return jsonify([]), 200

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT DISTINCT destino AS lugar 
            FROM viajes 
            WHERE LOWER(TRANSLATE(destino, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) LIKE LOWER(TRANSLATE(%s, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'))
              AND fecha_salida >= CURRENT_DATE 
              AND cupos_disponibles > 0
            LIMIT 5;
        """, (f"%{query_texto}%",))

        resultados = [row["lugar"] for row in cur.fetchall()]
        return jsonify(resultados), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en sugerencias: {e}")
        return jsonify([]), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-05: DETALLE DE VIAJE Y CUPOS EN TIEMPO REAL
# ==========================================
@app.route("/api/viajes/<int:viaje_id>", methods=["GET"])
def obtener_detalle_viaje(viaje_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                v.*,
                COALESCE(a.nombre_agencia, 'Volaris Partner') AS nombre_agencia
            FROM viajes v
            LEFT JOIN agencias a ON v.agencia_id = a.id
            WHERE v.id = %s;
        """, (viaje_id,))
        viaje = cur.fetchone()

        if not viaje:
            return jsonify({"error": "El viaje solicitado no se encuentra disponible."}), 404

        cur.execute("""
            SELECT 
                dia_numero, 
                titulo, 
                descripcion, 
                TO_CHAR(hora_inicio, 'HH12:MI AM') AS hora_inicio 
            FROM itinerarios 
            WHERE viaje_id = %s 
            ORDER BY dia_numero ASC, hora_inicio ASC;
        """, (viaje_id,))
        viaje["itinerario_dias"] = cur.fetchall()

        cur.execute("""
            SELECT 
                c.id,
                c.calificacion,
                c.mensaje,
                TO_CHAR(c.fecha, 'DD/MM/YYYY') AS fecha_formateada,
                COALESCE(u.nombre, 'Viajero Volaris') AS usuario_nombre,
                u.imagen_url AS usuario_foto
            FROM comentarios c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.viaje_id = %s
            ORDER BY c.fecha DESC;
        """, (viaje_id,))
        viaje["comentarios"] = cur.fetchall()

        for campo_fecha in ["fecha_salida", "fecha_llegada"]:
            if viaje.get(campo_fecha) and hasattr(viaje[campo_fecha], "isoformat"):
                viaje[campo_fecha] = viaje[campo_fecha].isoformat()

        return jsonify(viaje), 200

    except Exception as e:
        conn.rollback()
        print(f"Error crítico en obtener_detalle_viaje: {e}")
        return jsonify({"error": "Error interno al consultar los detalles del viaje."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-06 & HU-07: CONTROL DE CUPOS Y CREACIÓN DE RESERVAS
# ==========================================
@app.route("/api/reservas", methods=["POST"])
def crear_reserva():
    datos = request.get_json() or {}
    viaje_id = datos.get("id_viaje") or datos.get("viaje_id")
    cantidad_cupos = datos.get("cantidad_cupos", 1)

    auth_header = request.headers.get("Authorization")
    usuario_id = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            usuario_id = payload.get("id")
        except jwt.PyJWTError:
            pass

    if not viaje_id or cantidad_cupos <= 0:
        return jsonify({"error": "Parámetros de reserva inválidos."}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT id, agencia_id, precio_base, fecha_salida, cupos_disponibles 
            FROM viajes 
            WHERE id = %s 
            FOR UPDATE;
        """, (viaje_id,))
        viaje = cur.fetchone()

        if not viaje:
            conn.rollback()
            return jsonify({"error": "El viaje no existe o no está disponible."}), 404

        cupos_disponibles = viaje["cupos_disponibles"]

        if cupos_disponibles < cantidad_cupos:
            conn.rollback()
            return jsonify({
                "error": f"Sin cupos suficientes. Solo quedan {cupos_disponibles} disponibles."
            }), 409

        precio_base = float(viaje["precio_base"] or 0)
        fecha_salida = viaje["fecha_salida"]
        hoy = datetime.date.today()

        if isinstance(fecha_salida, datetime.datetime):
            fecha_salida = fecha_salida.date()

        dias_diferencia = (fecha_salida - hoy).days

        if 0 <= dias_diferencia <= 3:
            precio_unitario = precio_base * 0.5
        else:
            precio_unitario = precio_base

        precio_final_total = precio_unitario * cantidad_cupos

        cur.execute("""
            UPDATE viajes 
            SET cupos_disponibles = cupos_disponibles - %s 
            WHERE id = %s;
        """, (cantidad_cupos, viaje_id))

        cur.execute("""
            INSERT INTO reservas (usuario_id, viaje_id, fecha_reserva, precio_final, estado)
            VALUES (%s, %s, CURRENT_TIMESTAMP, %s, 'CONFIRMADA'::estado_reserva)
            RETURNING id;
        """, (usuario_id, viaje_id, precio_final_total))

        nueva_reserva = cur.fetchone()
        reserva_id = nueva_reserva["id"]

        id_agencia = viaje.get("agencia_id") or 2
        prefijo = PREFIJOS_AGENCIA.get(int(id_agencia), "VL")

        cur.execute("""
            SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 3) AS INTEGER)), 0) AS max_num
            FROM reservas
            WHERE codigo LIKE %s;
        """, (f"{prefijo}%",))
        
        siguiente_num = cur.fetchone()["max_num"] + 1
        codigo_reserva = f"{prefijo}{siguiente_num:03d}"

        cur.execute("""
            UPDATE reservas 
            SET codigo = %s 
            WHERE id = %s;
        """, (codigo_reserva, reserva_id))

        conn.commit()

        return jsonify({
            "mensaje": "Reserva realizada exitosamente",
            "id_reserva": reserva_id,
            "codigo": codigo_reserva,
            "codigo_reserva": codigo_reserva,
            "cupos_reservados": cantidad_cupos,
            "precio_final": precio_final_total
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"Error al procesar reserva: {e}")
        return jsonify({"error": "Error interno al procesar la reserva en la base de datos."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# DETALLE DE RESERVA ESPECÍFICA (DESTINO-DETALLE)
# ==========================================
@app.route("/api/reservas/detalle/<string:identificador>", methods=["GET"])
def obtener_detalle_reserva(identificador):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        reserva = None
        
        if identificador.isdigit():
            reserva_id_num = int(identificador)
            
            cur.execute("""
                SELECT 
                    r.id, r.codigo, r.usuario_id, r.viaje_id, r.precio_final, r.estado,
                    TO_CHAR(r.fecha_reserva, 'HH12:MI AM / Month DD, YYYY') AS fecha_reserva_formateada,
                    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
                    u.tipo_doc AS usuario_tipo_doc, u.numero_doc AS usuario_numero_doc, u.numero_telefono AS usuario_telefono
                FROM reservas r
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.id = %s;
            """, (reserva_id_num,))
            reserva = cur.fetchone()

            if not reserva:
                cur.execute("""
                    SELECT 
                        r.id, r.codigo, r.usuario_id, r.viaje_id, r.precio_final, r.estado,
                        TO_CHAR(r.fecha_reserva, 'HH12:MI AM / Month DD, YYYY') AS fecha_reserva_formateada,
                        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
                        u.tipo_doc AS usuario_tipo_doc, u.numero_doc AS usuario_numero_doc, u.numero_telefono AS usuario_telefono
                    FROM reservas r
                    LEFT JOIN usuarios u ON r.usuario_id = u.id
                    WHERE r.viaje_id = %s
                    ORDER BY r.id DESC LIMIT 1;
                """, (reserva_id_num,))
                reserva = cur.fetchone()

        else:
            cur.execute("""
                SELECT 
                    r.id, r.codigo, r.usuario_id, r.viaje_id, r.precio_final, r.estado,
                    TO_CHAR(r.fecha_reserva, 'HH12:MI AM / Month DD, YYYY') AS fecha_reserva_formateada,
                    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
                    u.tipo_doc AS usuario_tipo_doc, u.numero_doc AS usuario_numero_doc, u.numero_telefono AS usuario_telefono
                FROM reservas r
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.codigo = %s;
            """, (identificador,))
            reserva = cur.fetchone()

        if not reserva:
            return jsonify({"error": "La reserva no existe."}), 404

        cur.execute("SELECT * FROM viajes WHERE id = %s;", (reserva["viaje_id"],))
        viaje = cur.fetchone()

        if viaje:
            cur.execute("""
                SELECT dia_numero, titulo, descripcion, TO_CHAR(hora_inicio, 'HH12:MI AM') AS hora_inicio 
                FROM itinerarios WHERE viaje_id = %s ORDER BY dia_numero ASC;
            """, (reserva["viaje_id"],))
            viaje["itinerario_dias"] = cur.fetchall()

            for campo in ["fecha_salida", "fecha_llegada"]:
                if viaje.get(campo) and hasattr(viaje[campo], "isoformat"):
                    viaje[campo] = viaje[campo].isoformat()

        pasajeros = [{
            "nombre": reserva.get("usuario_nombre") or "Pasajero",
            "apellido": reserva.get("usuario_apellido") or "",
            "tipo_documento": reserva.get("usuario_tipo_doc") or "CC",
            "numero_documento": reserva.get("usuario_numero_doc") or "-",
            "email": reserva.get("usuario_email") or "",
            "telefono": reserva.get("usuario_telefono") or ""
        }]

        return jsonify({
            "reserva": reserva,
            "viaje": viaje,
            "usuario": {
                "nombre": reserva.get("usuario_nombre"),
                "apellido": reserva.get("usuario_apellido"),
                "email": reserva.get("usuario_email"),
                "tipo_doc": reserva.get("usuario_tipo_doc"),
                "numero_doc": reserva.get("usuario_numero_doc")
            },
            "pasajeros": pasajeros
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en obtener_detalle_reserva: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-08: GESTIÓN Y PUBLICACIÓN DE RESEÑAS
# ==========================================
@app.route("/api/resenas", methods=["GET"])
def obtener_resenas():
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"rol": "INVITADO", "resenas": [], "pendientes": []}), 200

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
        rol = str(payload.get("rol", "")).strip().upper()
    except jwt.PyJWTError:
        return jsonify({"rol": "INVITADO", "resenas": [], "pendientes": []}), 200

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if rol == "AGENCIA":
            
            cur.execute("""
                SELECT c.id, c.calificacion, c.mensaje AS comentario, 
                       TO_CHAR(c.fecha, 'HH12:MI AM / Month DD, YYYY') AS fecha,
                       v.destino AS titulo_viaje, v.imagen_url
                FROM comentarios c
                JOIN viajes v ON c.viaje_id = v.id
                WHERE v.agencia_id = %s
                ORDER BY c.fecha DESC
                LIMIT 10;
            """, (usuario_id,))
            resenas = cur.fetchall()
            return jsonify({"rol": "AGENCIA", "resenas": resenas, "pendientes": []}), 200

        else: 
           
            cur.execute("""
                SELECT c.id, c.calificacion, c.mensaje AS comentario, 
                       TO_CHAR(c.fecha, 'HH12:MI AM / Month DD, YYYY') AS fecha,
                       v.destino AS titulo_viaje, v.imagen_url
                FROM comentarios c
                JOIN viajes v ON c.viaje_id = v.id
                WHERE c.usuario_id = %s
                ORDER BY c.fecha DESC;
            """, (usuario_id,))
            resenas = cur.fetchall()

            cur.execute("""
                SELECT DISTINCT v.id, v.destino
                FROM reservas r
                JOIN viajes v ON r.viaje_id = v.id
                WHERE r.usuario_id = %s 
                  AND r.estado = 'COMPLETADA'
                  AND v.id NOT IN (SELECT viaje_id FROM comentarios WHERE usuario_id = %s);
            """, (usuario_id, usuario_id))
            pendientes = cur.fetchall()

            return jsonify({"rol": "CLIENTE", "resenas": resenas, "pendientes": pendientes}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en obtener_resenas: {e}")
        return jsonify({"rol": "INVITADO", "resenas": [], "pendientes": []}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/resenas", methods=["POST"])
def crear_resena():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "No autorizado"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify({"error": "Token inválido"}), 401

    datos = request.get_json() or {}
    viaje_id = datos.get("viaje_id")
    calificacion = datos.get("calificacion")
    mensaje = datos.get("mensaje", "").strip()

    if not viaje_id or not calificacion or not mensaje:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO comentarios (usuario_id, viaje_id, calificacion, mensaje, fecha)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);
        """, (usuario_id, viaje_id, calificacion, mensaje))
        conn.commit()
        return jsonify({"mensaje": "Reseña registrada con éxito"}), 201
    except Exception as e:
        conn.rollback()
        print(f"Error al guardar reseña: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
    finally:
        cur.close()
        conn.close()
        
# ==========================================
# HU-09: RADICACIÓN E INTEGRACIÓN DE PQR
# ==========================================
@app.route("/api/pqr/reservas-usuario", methods=["GET"])
def obtener_reservas_pqr_usuario():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify([]), 200

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify([]), 200

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT r.id AS reserva_id, r.codigo, r.estado, 
                   v.destino, TO_CHAR(v.fecha_salida, 'YYYY-MM-DD') AS fecha_salida
            FROM reservas r
            JOIN viajes v ON r.viaje_id = v.id
            WHERE r.usuario_id = %s
            ORDER BY r.fecha_reserva DESC;
        """, (usuario_id,))
        return jsonify(cur.fetchall()), 200
    except Exception as e:
        conn.rollback()
        print(f"Error al obtener reservas PQR usuario: {e}")
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/pqr/reservas-documento/<string:numero_doc>", methods=["GET"])
def obtener_reservas_por_documento(numero_doc):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT r.id AS reserva_id, r.codigo, r.estado, u.id AS usuario_id,
                   v.destino, TO_CHAR(v.fecha_salida, 'YYYY-MM-DD') AS fecha_salida
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN viajes v ON r.viaje_id = v.id
            WHERE u.numero_doc = %s
            ORDER BY r.fecha_reserva DESC;
        """, (numero_doc.strip(),))
        
        reservas = cur.fetchall()
        if not reservas:
            return jsonify({"mensaje": "No se encontraron reservas asociadas al documento.", "reservas": []}), 404

        return jsonify({"reservas": reservas, "usuario_id": reservas[0]["usuario_id"]}), 200
    except Exception as e:
        conn.rollback()
        print(f"Error al obtener reservas por documento: {e}")
        return jsonify({"error": "Error al consultar las reservas"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/pqr", methods=["POST"])
def radicar_pqr():
    datos = request.get_json() or {}
    tipo = datos.get("tipo", "").strip().upper()
    descripcion = datos.get("descripcion", "").strip()
    reserva_id = datos.get("reserva_id")
    usuario_id_invitado = datos.get("usuario_id")

    if not tipo or not descripcion:
        return jsonify({"error": "El tipo y la descripción son obligatorios"}), 400

    auth_header = request.headers.get("Authorization")
    usuario_id = None

    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            usuario_id = payload.get("id")
        except jwt.PyJWTError:
            pass

    if not usuario_id and usuario_id_invitado:
        usuario_id = usuario_id_invitado

    codigo_radicado = "PQR-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO pqr (codigo_radicado, usuario_id, reserva_id, tipo, descripcion, estado)
            VALUES (%s, %s, %s, %s::tipo_pqr, %s, 'PENDIENTE'::estado_pqr)
            RETURNING codigo_radicado;
        """, (codigo_radicado, usuario_id, reserva_id if reserva_id else None, tipo, descripcion))
        
        nuevo_radicado = cur.fetchone()["codigo_radicado"]
        conn.commit()

        return jsonify({
            "mensaje": "PQR radicada con éxito",
            "codigo_radicado": nuevo_radicado
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"Error en radicar_pqr: {e}")
        return jsonify({"error": "Error al guardar la PQR"}), 500
    finally:
        cur.close()
        conn.close()
        
# ==========================================
# HU-10: SEGUIMIENTO Y RESPUESTA DE PQR
# ==========================================
@app.route("/api/pqr/agencia/pendientes", methods=["GET"])
def obtener_pqrs_pendientes_agencia():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify([]), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify([]), 401

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT numero_doc FROM usuarios WHERE id = %s;", (usuario_id,))
        usr = cur.fetchone()
        nit_agencia = usr["numero_doc"].strip() if usr and usr.get("numero_doc") else ""

        cur.execute("""
            SELECT p.id, p.codigo_radicado, p.tipo, p.descripcion, p.estado, p.respuesta,
                   COALESCE(u.nombre, 'Invitado') AS cliente_nombre, 
                   COALESCE(u.apellido, '') AS cliente_apellido,
                   v.destino, TO_CHAR(p.fecha_radicacion, 'YYYY-MM-DD') AS fecha
            FROM pqr p
            JOIN reservas r ON p.reserva_id = r.id
            JOIN viajes v ON r.viaje_id = v.id
            JOIN agencias a ON v.agencia_id = a.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE a.nit = %s 
              AND p.estado IN ('PENDIENTE', 'EN_PROCESO')
            ORDER BY p.id DESC;
        """, (nit_agencia,))
        
        pqrs = cur.fetchall()
        return jsonify(pqrs), 200

    except Exception as e:
        conn.rollback()
        print(f"Error al obtener PQRs pendientes para agencia: {e}")
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/pqr/agencia/respondidas", methods=["GET"])
def obtener_pqrs_respondidas_agencia():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify([]), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify([]), 401

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT numero_doc FROM usuarios WHERE id = %s;", (usuario_id,))
        usr = cur.fetchone()
        nit_agencia = usr["numero_doc"].strip() if usr and usr.get("numero_doc") else ""

        cur.execute("""
            SELECT p.id, p.codigo_radicado, p.tipo, p.descripcion, p.estado, p.respuesta,
                   COALESCE(u.nombre, 'Cliente') AS cliente_nombre, 
                   COALESCE(u.apellido, '') AS cliente_apellido,
                   v.destino
            FROM pqr p
            JOIN reservas r ON p.reserva_id = r.id
            JOIN viajes v ON r.viaje_id = v.id
            JOIN agencias a ON v.agencia_id = a.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE a.nit = %s 
              AND p.estado = 'RESUELTO'
            ORDER BY p.id DESC;
        """, (nit_agencia,))
        
        pqrs = cur.fetchall()
        return jsonify(pqrs), 200

    except Exception as e:
        conn.rollback()
        print(f"Error al obtener PQRs respondidas por agencia: {e}")
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/pqr/<int:pqr_id>/responder", methods=["PUT"])
def responder_pqr(pqr_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "No autorizado"}), 401

    datos = request.get_json() or {}
    respuesta_texto = datos.get("respuesta", "").strip()
    nuevo_estado = datos.get("estado", "RESUELTO").strip().upper()

    if not respuesta_texto:
        return jsonify({"error": "La respuesta no puede estar vacía"}), 400

    if "REVISI" in nuevo_estado or "PROCESO" in nuevo_estado:
        estado_db = "EN_PROCESO"
    else:
        estado_db = "RESUELTO"

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            UPDATE pqr
            SET respuesta = %s, estado = %s::estado_pqr
            WHERE id = %s
            RETURNING id, codigo_radicado, estado;
        """, (respuesta_texto, estado_db, pqr_id))
        
        pqr_actualizada = cur.fetchone()
        if not pqr_actualizada:
            return jsonify({"error": "No se encontró la PQR a responder"}), 404

        conn.commit()
        return jsonify({
            "mensaje": "PQR actualizada con éxito",
            "pqr": pqr_actualizada
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error al responder PQR: {e}")
        return jsonify({"error": f"Error interno en la base de datos: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/pqr/cliente", methods=["GET"])
def obtener_pqrs_cliente():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify([]), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify([]), 401

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT DISTINCT 
                p.codigo_radicado, 
                p.tipo, 
                p.descripcion, 
                p.estado, 
                COALESCE(p.respuesta, 'Pendiente de respuesta por la agencia') AS respuesta,
                TO_CHAR(p.fecha_radicacion, 'YYYY-MM-DD') AS fecha
            FROM pqr p
            LEFT JOIN reservas r ON p.reserva_id = r.id
            WHERE p.usuario_id = %s OR r.usuario_id = %s
            ORDER BY p.codigo_radicado DESC;
        """, (usuario_id, usuario_id))
        
        pqrs = cur.fetchall()
        return jsonify(pqrs), 200

    except Exception as e:
        conn.rollback()
        print(f"Error al obtener PQR cliente: {e}")
        return jsonify([]), 500

    finally:
        cur.close()
        conn.close()

# ==========================================
# HU-12: CONSOLIDACIÓN MENSUAL DE DATOS (CRON JOB)
# ==========================================
def consolidar_estadisticas_mensuales():
    print("Ejecutando Cron Job: Consolidación de Estadísticas Mensuales...")
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        hoy = datetime.date.today()
        primer_dia_mes_actual = hoy.replace(day=1)
        ultimo_dia_mes_anterior = primer_dia_mes_actual - datetime.timedelta(days=1)
        primer_dia_mes_anterior = ultimo_dia_mes_anterior.replace(day=1)

        anio_evaluar = primer_dia_mes_anterior.year
        mes_evaluar = primer_dia_mes_anterior.month

        cur.execute("""
            SELECT COUNT(*) AS total_res, COALESCE(SUM(precio_final), 0) AS ingresos
            FROM reservas
            WHERE fecha_reserva >= %s AND fecha_reserva <= %s;
        """, (primer_dia_mes_anterior, ultimo_dia_mes_anterior))
        res_data = cur.fetchone()

        cur.execute("""
            SELECT v.id AS viaje_id, COUNT(r.id) as total
            FROM reservas r
            JOIN viajes v ON r.viaje_id = v.id
            WHERE r.fecha_reserva >= %s AND r.fecha_reserva <= %s
            GROUP BY v.id ORDER BY total DESC LIMIT 1;
        """, (primer_dia_mes_anterior, ultimo_dia_mes_anterior))
        top_dest = cur.fetchone()
        destino_top_id = top_dest['viaje_id'] if top_dest else None

        cur.execute("""
            SELECT 
                COUNT(*) AS total_pqr,
                COUNT(CASE WHEN estado = 'RESUELTO' THEN 1 END) AS resueltas
            FROM pqr
            WHERE fecha_radicacion >= %s AND fecha_radicacion <= %s;
        """, (primer_dia_mes_anterior, ultimo_dia_mes_anterior))
        pqr_data = cur.fetchone()

        datos_json = json.dumps({
            "total_pqrs": pqr_data['total_pqr'],
            "pqrs_resueltas": pqr_data['resueltas']
        })

        cur.execute("""
            INSERT INTO estadisticas_mensuales (anio, mes, destino_top_id, total_reservas, ingresos_totales, datos_json)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (
            anio_evaluar, 
            mes_evaluar, 
            destino_top_id, 
            res_data['total_res'], 
            res_data['ingresos'], 
            datos_json
        ))

        conn.commit()
        print(f"Consolidación guardada para {mes_evaluar}/{anio_evaluar}")

    except Exception as e:
        conn.rollback()
        print(f"Error en consolidación mensual: {e}")
    finally:
        cur.close()
        conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(consolidar_estadisticas_mensuales, 'cron', day=1, hour=0, minute=0)
scheduler.start()


# ==========================================
# HU-11: ENDPOINTS DE ANALÍTICA (CLIENTE Y AGENCIA)
# ==========================================
@app.route("/api/analitica/cliente", methods=["GET"])
def analitica_cliente():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                v.destino,
                SUM(em.total_reservas) AS reservas_acumuladas,
                ROUND(AVG(COALESCE((em.datos_json->>'satisfaccion_promedio')::numeric, 4.8)), 1) AS satisfaccion
            FROM estadisticas_mensuales em
            JOIN viajes v ON em.destino_top_id = v.id
            WHERE v.tipo_salida = 'NACIONAL'
            GROUP BY v.destino
            ORDER BY reservas_acumuladas DESC LIMIT 5;
        """)
        top_nacionales = cur.fetchall()

        cur.execute("""
            SELECT 
                v.destino,
                SUM(em.total_reservas) AS reservas_acumuladas,
                ROUND(AVG(COALESCE((em.datos_json->>'satisfaccion_promedio')::numeric, 4.9)), 1) AS satisfaccion
            FROM estadisticas_mensuales em
            JOIN viajes v ON em.destino_top_id = v.id
            WHERE v.tipo_salida = 'INTERNACIONAL'
            GROUP BY v.destino
            ORDER BY reservas_acumuladas DESC LIMIT 5;
        """)
        top_internacionales = cur.fetchall()

        cur.execute("""
            SELECT 
                COALESCE(v.categoria, 'Playa / Sol') AS categoria,
                SUM(em.total_reservas) AS total_reservas
            FROM estadisticas_mensuales em
            JOIN viajes v ON em.destino_top_id = v.id
            WHERE v.categoria IS NOT NULL
            GROUP BY v.categoria
            ORDER BY total_reservas DESC LIMIT 5;
        """)
        experiencias_top = cur.fetchall()

        rec_nac = top_nacionales[0]["destino"] if top_nacionales else "Desierto de la Tatacoa"
        rec_inter = top_internacionales[0]["destino"] if top_internacionales else "Ámsterdam"

        return jsonify({
            "top_nacionales": top_nacionales,
            "top_internacionales": top_internacionales,
            "experiencias_top": experiencias_top,
            "recomendado_nacional": rec_nac,
            "recomendado_internacional": rec_inter
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en analitica_cliente: {e}")
        return jsonify({"error": "Error al consultar la tabla estadisticas_mensuales"}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/api/analitica/agencia", methods=["GET"])
def analitica_agencia():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "No autorizado"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload.get("id")
    except jwt.PyJWTError:
        return jsonify({"error": "Token inválido"}), 401

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT numero_doc FROM usuarios WHERE id = %s;", (usuario_id,))
        usr = cur.fetchone()
        nit_agencia = usr["numero_doc"].strip() if usr and usr.get("numero_doc") else ""

        cur.execute("""
            SELECT 
                COUNT(DISTINCT r.id) AS total_reservas,
                COALESCE(SUM(r.precio_final), 0) AS ingresos_totales,
                COUNT(DISTINCT p.id) AS total_pqrs,
                COUNT(DISTINCT CASE WHEN p.estado = 'RESUELTO' THEN p.id END) AS pqrs_resueltas
            FROM viajes v
            JOIN agencias a ON v.agencia_id = a.id
            LEFT JOIN reservas r ON r.viaje_id = v.id
            LEFT JOIN pqr p ON p.reserva_id = r.id
            WHERE a.nit = %s;
        """, (nit_agencia,))
        resumen = cur.fetchone()

        cur.execute("""
            SELECT 
                em.anio::text AS anio_label,
                SUM(em.total_reservas) AS reservas_anuales,
                ROUND(SUM(em.ingresos_totales), 0) AS ingresos_anuales
            FROM estadisticas_mensuales em
            GROUP BY em.anio ORDER BY em.anio ASC;
        """)
        historico_ingresos = cur.fetchall()

        cur.execute("""
            SELECT TO_CHAR(r.fecha_reserva, 'Dy') AS dia, COUNT(r.id) AS total
            FROM reservas r
            JOIN viajes v ON r.viaje_id = v.id
            JOIN agencias a ON v.agencia_id = a.id
            WHERE a.nit = %s
            GROUP BY TO_CHAR(r.fecha_reserva, 'Dy'), EXTRACT(DOW FROM r.fecha_reserva)
            ORDER BY EXTRACT(DOW FROM r.fecha_reserva);
        """, (nit_agencia,))
        reservas_semanales = cur.fetchall()

        cur.execute("""
            SELECT p.codigo_radicado, p.tipo, p.descripcion, p.estado,
                   COALESCE(u.nombre, 'Cliente') AS cliente_nombre
            FROM pqr p
            JOIN reservas r ON p.reserva_id = r.id
            JOIN viajes v ON r.viaje_id = v.id
            JOIN agencias a ON v.agencia_id = a.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE a.nit = %s ORDER BY p.id DESC LIMIT 5;
        """, (nit_agencia,))
        casos_recientes = cur.fetchall()

        return jsonify({
            "resumen": resumen,
            "historico_ingresos": historico_ingresos,
            "reservas_semanales": reservas_semanales,
            "casos_recientes": casos_recientes
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en analitica_agencia: {e}")
        return jsonify({"error": "Error interno"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/analitica/historico-mensual", methods=["GET"])
def analitica_historico_mensual():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                em.anio, 
                em.mes, 
                em.total_reservas, 
                em.ingresos_totales,
                COALESCE(v.destino, 'N/A') AS destino_top,
                em.datos_json
            FROM estadisticas_mensuales em
            LEFT JOIN viajes v ON em.destino_top_id = v.id
            ORDER BY em.anio ASC, em.mes ASC;
        """)
        historico = cur.fetchall()

        return jsonify(historico), 200

    except Exception as e:
        conn.rollback()
        print(f"Error en analitica_historico_mensual: {e}")
        return jsonify({"error": "Error interno al consultar histórico"}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
    