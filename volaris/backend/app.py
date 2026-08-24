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
CORS(app)
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

    cur.execute("SELECT * FROM viajes ORDER BY id ASC LIMIT 20;")
    viajes = cur.fetchall()

    cur.close()
    conn.close()
    return jsonify(viajes), 200


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
            return jsonify({"error": "El correo electrónico ingresado ya se encuentra registrado."}), 400

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

        return jsonify({"error": mensaje}), 400

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

        if not bcrypt.check_password_hash(usuario["password_hash"], password):
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
                "email": usuario["email"],
                "rol": usuario["rol"],
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
        # Verificar si el usuario ya existe
        cur.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cur.fetchone()

        # Si no existe, se crea automáticamente con rol CLIENTE
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

        # Generar token JWT
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)