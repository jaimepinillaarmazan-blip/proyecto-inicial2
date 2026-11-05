from flask import Flask, render_template

# Inicializamos la aplicación Flask
app = Flask(__name__)

# Creamos la ruta principal ("/") que los usuarios verán al entrar a la web
@app.route('/')
def inicio():
    # Flask buscará automáticamente este archivo dentro de la carpeta "templates"
    return render_template('index.html')

# Esta condición asegura que el servidor solo se ejecute si corremos este archivo directamente
if __name__ == '__main__':
    # debug=True nos permite ver los errores en la consola mientras programamos
    app.run(debug=True)