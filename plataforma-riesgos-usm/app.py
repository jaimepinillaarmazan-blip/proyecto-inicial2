from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

def obtener_conexion():
    conn = sqlite3.connect('base_datos.db')
    conn.row_factory = sqlite3.Row
    return conn

# Se agregan las columnas "likes" y "dislikes" con valor por defecto 0
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
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

inicializar_bd()

@app.route('/')
def inicio():
    return render_template('index.html')

@app.route('/api/reportes', methods=['GET'])
def obtener_reportes():
    conn = obtener_conexion()
    reportes_bd = conn.execute('SELECT * FROM reportes ORDER BY fecha_creacion DESC LIMIT 25').fetchall()
    conn.close()
    return jsonify([dict(reporte) for reporte in reportes_bd])

@app.route('/api/reportes', methods=['POST'])
def guardar_reporte():
    nuevo_reporte = request.json
    conn = obtener_conexion()
    conn.execute('''
        INSERT INTO reportes (latitud, longitud, tipo, descripcion, duracion_horas) 
        VALUES (?, ?, ?, ?, ?)
    ''', (nuevo_reporte['latitud'], nuevo_reporte['longitud'], nuevo_reporte['tipo'], nuevo_reporte['descripcion'], nuevo_reporte['duracion_horas']))
    conn.commit()
    conn.close()
    return jsonify({"estado": "éxito"}), 201

# --- NUEVA RUTA PARA RECIBIR LOS VOTOS ---
@app.route('/api/reportes/<int:id_reporte>/votar', methods=['POST'])
def votar_reporte(id_reporte):
    datos = request.json
    tipo_voto = datos.get('tipo') # Recibe 'like' o 'dislike'
    
    conn = obtener_conexion()
    if tipo_voto == 'like':
        conn.execute('UPDATE reportes SET likes = likes + 1 WHERE id = ?', (id_reporte,))
    elif tipo_voto == 'dislike':
        conn.execute('UPDATE reportes SET dislikes = dislikes + 1 WHERE id = ?', (id_reporte,))
    
    conn.commit()
    conn.close()
    return jsonify({"estado": "éxito"}), 200

if __name__ == '__main__':
    app.run(debug=True)