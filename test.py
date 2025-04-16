from flask import Flask,render_template , jsonify , request
import mysql.connector
import base64
from PIL import Image
import io
from datetime import datetime


# Setup Flask App
app=Flask(__name__)

# Setup For Database Config
db = {
    'host':'localhost',
    'user':'root',
    'password':'localhost',
    'database':'newdb'
}

# setup for database connection 
def get_connection():
    con = mysql.connector.connect(**db)
    return con


@app.route('/')
def index():
    return "Hello"


if __name__ == '__main__':
    app.run(debug=True)