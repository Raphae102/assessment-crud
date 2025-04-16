# app.py (Flask Backend)
from flask import Flask, request, jsonify, render_template, send_file
import mysql.connector
import io
import base64
from PIL import Image

# Load environment variables

app = Flask(__name__)

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'helldiver12345.',
    'database': 'testdb'
}

# Helper function to get database connection
def get_db_connection():
    conn = mysql.connector.connect(**db_config)
    return conn, conn.cursor()

# Initialize database and create table if it doesn't exist
def init_db():
    conn, cursor = get_db_connection()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        raw_image LONGBLOB NOT NULL,
        processed_image LONGBLOB NOT NULL
    )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# Process image - resize to 64x64 and convert to grayscale
def process_image(image_data):
    image = Image.open(io.BytesIO(image_data))
    # Convert to grayscale and resize
    processed_image = image.convert('L').resize((64, 64))
    
    # Save processed image to bytes
    output = io.BytesIO()
    processed_image.save(output, format='PNG')
    
    return output.getvalue()

@app.route('/')
def index():
    return render_template('index.html')

# Upload image
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Read image data
    raw_image_data = image_file.read()
    
    # Process image
    processed_image_data = process_image(raw_image_data)
    
    # Save to database
    conn, cursor = get_db_connection()
    cursor.execute(
        "INSERT INTO images (raw_image, processed_image) VALUES (%s, %s)",
        (raw_image_data, processed_image_data)
    )
    conn.commit()
    image_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'id': image_id}), 201

# Get all images
@app.route('/images', methods=['GET'])
def get_images():
    conn, cursor = get_db_connection()
    cursor.execute("SELECT id, upload_time FROM images ORDER BY upload_time DESC")
    images = []
    for (id, upload_time) in cursor:
        images.append({
            'id': id,
            'upload_time': upload_time.strftime('%Y-%m-%d %H:%M:%S')
        })
    cursor.close()
    conn.close()
    
    return jsonify(images)

# Get a specific image
@app.route('/images/<int:image_id>', methods=['GET'])
def get_image(image_id):
    conn, cursor = get_db_connection()
    cursor.execute("SELECT raw_image, processed_image FROM images WHERE id = %s", (image_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result is None:
        return jsonify({'error': 'Image not found'}), 404
    
    raw_image, processed_image = result
    
    # Convert to base64 for sending to frontend
    raw_base64 = base64.b64encode(raw_image).decode('utf-8')
    processed_base64 = base64.b64encode(processed_image).decode('utf-8')
    
    return jsonify({
        'id': image_id,
        'raw_image': raw_base64,
        'processed_image': processed_base64
    })

# update an image
@app.route('/images/<int:image_id>', methods=['PUT'])
def update_image(image_id):
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Read image data
    raw_image_data = image_file.read()
    
    # Process image
    processed_image_data = process_image(raw_image_data)
    
    # Update in database
    conn, cursor = get_db_connection()
    cursor.execute(
        "UPDATE images SET raw_image = %s, processed_image = %s, upload_time = CURRENT_TIMESTAMP WHERE id = %s",
        (raw_image_data, processed_image_data, image_id)
    )
    conn.commit()
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Image not found'}), 404
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True})

# Delete an image
@app.route('/images/<int:image_id>', methods=['DELETE'])
def delete_image(image_id):
    conn, cursor = get_db_connection()
    cursor.execute("DELETE FROM images WHERE id = %s", (image_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Image not found'}), 404
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True})

# Displaying Raw image 
@app.route('/raw-image/<int:image_id>', methods=['GET'])
def get_raw_image(image_id):
    conn, cursor = get_db_connection()
    cursor.execute("SELECT raw_image FROM images WHERE id = %s", (image_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result is None:
        return jsonify({'error': 'Image not found'}), 404
    
    raw_image = result[0]
    return send_file(io.BytesIO(raw_image), mimetype='image/jpeg')

# Displaying processed image
@app.route('/processed-image/<int:image_id>', methods=['GET'])
def get_processed_image(image_id):
    conn, cursor = get_db_connection()
    cursor.execute("SELECT processed_image FROM images WHERE id = %s", (image_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if result is None:
        return jsonify({'error': 'Image not found'}), 404
    
    processed_image = result[0]
    return send_file(io.BytesIO(processed_image), mimetype='image/jpeg')

if __name__ == '__main__':
    init_db()
    app.run(debug=True)