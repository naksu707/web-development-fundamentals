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

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])
bcrypt = Bcrypt(app)

SECRET_KEY = "volaris_secreto_super_seguro_2026_key_desarrollo"

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


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

    imagen_url = None
    if 'imagen' in request.files:
        file = request.files['imagen']
        if file and file.filename != '':
            filename = secure_filename(f"{numero_doc}_{file.filename}")
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            imagen_url = f"/uploads/{filename}"

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT id FROM usuarios WHERE email = %s;", (email,))
        if cur.fetchone():
            return jsonify({"error": "El correo electrónico ingresado ya se encuentra registrado."}), 409

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
            SELECT DISTINCT destino AS lugar FROM viajes 
            WHERE LOWER(TRANSLATE(destino, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(TRANSLATE(%s, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU'))
            UNION
            SELECT DISTINCT origen AS lugar FROM viajes 
            WHERE LOWER(TRANSLATE(origen, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(TRANSLATE(%s, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU'))
            LIMIT 5;
        """, (f"%{query_texto}%", f"%{query_texto}%"))

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
        
        try:
            cur.execute("""
                SELECT 
                    v.*,
                    COALESCE(a.nombre, 'Volaris Partner') AS nombre_agencia
                FROM viajes v
                LEFT JOIN agencias a ON v.agencia_id = a.id
                WHERE v.id = %s;
            """, (viaje_id,))
            viaje = cur.fetchone()
        except Exception:
            conn.rollback()
            cur.execute("SELECT *, 'Volaris Partner' AS nombre_agencia FROM viajes WHERE id = %s;", (viaje_id,))
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
        


if __name__ == "__main__":
    app.run(debug=True, port=5000)