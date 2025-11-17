from flask import Flask, request, jsonify
from flask_cors import CORS
from db_connection import DatabaseConnection
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        # Check if username already exists
        existing_user = db.fetch_one('SELECT ID FROM User WHERE UserName = %s', (username,))
        if existing_user:
            db.disconnect()
            return jsonify({'success': False, 'message': 'Username already exists'}), 409

        # Insert new user
        hashed_password = hash_password(password)
        user_id = db.execute_query(
            'INSERT INTO User (UserName, UserPassword) VALUES (%s, %s)',
            (username, hashed_password)
        )

        db.disconnect()

        if user_id:
            return jsonify({'success': True, 'message': 'User registered successfully', 'userId': user_id}), 201
        else:
            return jsonify({'success': False, 'message': 'Registration failed'}), 500

    except Exception as e:
        print(f"Error in register: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        # Check credentials
        hashed_password = hash_password(password)
        user = db.fetch_one(
            'SELECT ID, UserName FROM User WHERE UserName = %s AND UserPassword = %s',
            (username, hashed_password)
        )

        db.disconnect()

        if user:
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'userId': user['ID'],
                'username': user['UserName']
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    try:
        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        # Delete user (scores will be deleted automatically due to CASCADE)
        result = db.execute_query('DELETE FROM User WHERE ID = %s', (user_id,))

        db.disconnect()

        if result is not None:
            return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'User deletion failed'}), 500

    except Exception as e:
        print(f"Error in delete_user: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/score', methods=['POST'])
def save_score():
    """Save user's quiz score"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        level_id = data.get('levelId')
        score = data.get('score')
        start_datetime = data.get('startDatetime')

        if not all([user_id, level_id, score is not None, start_datetime]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        # Convert timestamp to datetime
        dt = datetime.fromtimestamp(start_datetime / 1000)  # Convert from milliseconds

        # Insert score
        score_id = db.execute_query(
            'INSERT INTO Scores (UserID, LevelID, Score, StartDateTime) VALUES (%s, %s, %s, %s)',
            (user_id, level_id, score, dt)
        )

        db.disconnect()

        if score_id:
            return jsonify({'success': True, 'message': 'Score saved successfully', 'scoreId': score_id}), 201
        else:
            return jsonify({'success': False, 'message': 'Failed to save score'}), 500

    except Exception as e:
        print(f"Error in save_score: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/scores/<int:user_id>', methods=['GET'])
def get_user_scores(user_id):
    """Get all scores for a user"""
    try:
        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        # Get user scores with level information
        scores = db.fetch_query(
            '''SELECT s.ID, s.Score, s.StartDateTime, s.LevelID, l.LevelName
               FROM Scores s
               JOIN Levels l ON s.LevelID = l.ID
               WHERE s.UserID = %s
               ORDER BY s.StartDateTime DESC''',
            (user_id,)
        )

        db.disconnect()

        if scores is not None:
            # Convert datetime to string for JSON serialization
            for score in scores:
                score['StartDateTime'] = score['StartDateTime'].isoformat()
            return jsonify({'success': True, 'scores': scores}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to retrieve scores'}), 500

    except Exception as e:
        print(f"Error in get_user_scores: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/levels', methods=['GET'])
def get_levels():
    """Get all levels"""
    try:
        db = DatabaseConnection()
        if not db.connect():
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        levels = db.fetch_query('SELECT * FROM Levels')

        db.disconnect()

        if levels is not None:
            return jsonify({'success': True, 'levels': levels}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to retrieve levels'}), 500

    except Exception as e:
        print(f"Error in get_levels: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

