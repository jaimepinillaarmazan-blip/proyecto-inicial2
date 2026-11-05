from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

# 1. Función para conectar a la base de datos
def obtener_conexion():
    conn = sqlite3.connect('base_datos.db')
    conn.row_factory = sqlite3.Row # Permite acceder a los datos como diccionarios
    return conn

# 2. Función para crear la tabla si no existe (incluye la duración)
def inicializar_bd():
    conn = obtener_conexion()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitud REAL NOT NULL,
            longitud REAL NOT NULL,
            tipo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            duracion_horas INTEGER NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Ejecutamos la creación de la tabla al iniciar
inicializar_bd()

# 3. Ruta principal de la página
@app.route('/')
def inicio():
    return render_template('index.html')

# 4. Ruta para ENVIAR los reportes al mapa (Frontend solicita datos)
@app.route('/api/reportes', methods=['GET'])
def obtener_reportes():
    conn = obtener_conexion()
    # Aquí obtenemos todos los reportes de la base de datos
    reportes_bd = conn.execute('SELECT * FROM reportes').fetchall()
    conn.close()
    
    # Convertimos los datos a un formato que JavaScript pueda leer (JSON)
    reportes_json = [dict(reporte) for reporte in reportes_bd]
    return jsonify(reportes_json)

# 5. Ruta para GUARDAR un nuevo reporte desde el botón
@app.route('/api/reportes', methods=['POST'])
def guardar_reporte():
    nuevo_reporte = request.json
    conn = obtener_conexion()
    
    # Insertamos los datos incluyendo el tiempo de duración
    conn.execute('''
        INSERT INTO reportes (latitud, longitud, tipo, descripcion, duracion_horas) 
        VALUES (?, ?, ?, ?, ?)
    ''', (nuevo_reporte['latitud'], nuevo_reporte['longitud'], nuevo_reporte['tipo'], nuevo_reporte['descripcion'], nuevo_reporte['duracion_horas']))
    
    conn.commit()
    conn.close()
    
    return jsonify({"estado": "éxito", "mensaje": "Reporte guardado"}), 201

if __name__ == '__main__':
    app.run(debug=True)