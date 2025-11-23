from flask import Blueprint, jsonify, request
from BE.db_connection import DatabaseConnection
from BE.Auth import GenerateToken, DecodeToken, required_auth, DecodeAuthHeader
import json

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
                    "token": GenerateToken(user.get("ID"))
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

@api_blueprint.route("/ValidateJWT", methods=["POST"])
def ValidateJWT():
    try:
        data = request.get_json()
        token: str = data.get("token")
        
        if not token:
            return jsonify({
                "success": False,
                "message": "Token is required"
            }), 400
        
        payload, error = DecodeToken(token)
        
        if error:
            return jsonify({
                "success": False,
                "message": error
            }), 401
        
        return jsonify({
            "success": True,
            "message": "Token is valid",
            "payload": payload
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500

@api_blueprint.route("/User", methods=["GET"])
@required_auth
def GetUser():
    try:
        userID: int = request.user_payload.get("user_id")
        
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
                "user": user
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

@api_blueprint.route("/User", methods=["DELETE"])
@required_auth
def DeleteUser():
    try:
        userID: int = request.user_payload.get("user_id")
        
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

@api_blueprint.route("/SubmitScore", methods=["POST"])
@required_auth
def SubmitScore():
    try:
        userID: int = request.user_payload.get("user_id")
        
        data = request.get_json()
        lvlID: int = data.get("levelID")
        quizMark: int = data.get("quizMark")
        totalQuizMark: int = data.get("totalQuizMark")
        startDT: str = data.get("startDateTime")
        completionDT: str = data.get("completionDateTime", None)
        quizInfo: dict = data.get("quizInfo", {})
        
        quizInfoJSON: str = json.dumps(quizInfo)
        
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        db.execute_query(
            "INSERT INTO Scores (UserID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (userID, lvlID, quizMark, totalQuizMark, startDT, completionDT, quizInfoJSON)
        )
        
        db.disconnect()
        
        return jsonify({
            "success": True,
            "message": "Score submitted successfully"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500

@api_blueprint.route("/Scores", methods=["GET"])
@required_auth
def GetScores():
    try:
        userID: int = request.user_payload.get("user_id")
        
        db: DatabaseConnection = DatabaseConnection()
        if not db.connect():
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
            
        scores = db.fetch_query(
            "SELECT ID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo FROM Scores WHERE UserID = %s WHERE CompletionDatetime IS NOT NULL ORDER BY CompletionDatetime ASC",
            (userID,)
        )
            
        db.disconnect()
        
        return jsonify({
            "success": True,
            "scores": scores
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal server error\n{repr(e)}"
        }), 500
