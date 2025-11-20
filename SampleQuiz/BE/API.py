from flask import Blueprint, jsonify, request
from BE.db_connection import DatabaseConnection

api_blueprint = Blueprint("API", __name__)

@api_blueprint.route("/Register", methods=["POST"])
def Register():
    try:
        data = request.get_json()
        username: str = data.get("username")
        password: str = data.get("password")
        
        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400
        
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        # Check if username already exists in the database:
        existingUser = db.fetch_one("SELECT ID FROM User WHERE UserName = %s", (username,))
        if existingUser:
            db.disconnect()
            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 409
        
        # Insert new user:
        userID = db.execute_query(
            "INSERT INTO User (UserName, UserPassword) VALUES (%s, %s)",
            (username, password)
        )
        
        db.disconnect()
        
        if userID:
            return jsonify({
                "success": True,
                "message": "User registered successfully",
                "userId": userID
            }), 201
        else:
            return jsonify({
                "success": False,
                "message": "Registration failed"
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500

@api_blueprint.route("/Login", methods=["POST"])
def Login():
    try:
        data = request.get_json()
        username: str = data.get("username")
        password: str = data.get("password")
        
        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400
        
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        # Check credentials:
        user = db.fetch_one(
            "SELECT ID, UserName, IF(UserPassword = %s, \"MATCH\", \"UNMATCH\") AS PasswordMatch FROM User WHERE UserName = %s",
            (password, username)
        )
        
        db.disconnect()
        
        if user:
            passwordMatch: bool = user.get("PasswordMatch") == "MATCH"
            if passwordMatch:
                return jsonify({
                    "success": True,
                    "message": "Login successful",
                    "userId": user.get("ID"),
                    "username": user.get("UserName")
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": "Invalid username or password"
                }), 401
        else:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500
        
@api_blueprint.route("/User/<int:userID>", methods=["GET"])
def GetUser(userID: int):
    try:
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
            
        user = db.fetch_one(
            "SELECT ID, UserName FROM User WHERE ID = %s",
            (userID,)
        )
            
        db.disconnect()
        
        if user:
            return jsonify({
                "success": True,
                "user": {
                    "userId": user.get("ID"),
                    "username": user.get("UserName")
                }
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500

@api_blueprint.route("/User/<int:userID>", methods=["DELETE"])
def DeleteUser(userID: int):
    try:
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        rowsAffected = db.execute_query(
            "DELETE FROM User WHERE ID = %s",
            (userID,)
        )
        
        db.disconnect()
        
        if rowsAffected > 0:
            return jsonify({
                "success": True,
                "message": "User deleted successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500
