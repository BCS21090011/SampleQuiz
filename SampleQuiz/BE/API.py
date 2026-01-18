from flask import Blueprint, jsonify, request
from BE.db_connection import DatabaseConnection
from BE.Auth import GenerateToken, DecodeToken, required_auth, DecodeAuthHeader
import json
from functools import wraps

api_blueprint = Blueprint("API", __name__)

def required_db(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            db: DatabaseConnection = DatabaseConnection()

            if not db.connect():
                return jsonify({
                    "success": False,
                    "message": "Database connection failed"
                }), 500

            returnVal = func(*args, db=db, **kwargs)

            db.disconnect()

            return returnVal
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Internal server error\n{repr(e)}"
            }), 500
    return wrapper

def GetUserFromDB(db: DatabaseConnection, userID: int):
    return db.fetch_one(
        "SELECT ID, UserName FROM User WHERE ID = %s",
        (userID,)
    )

def GetUsersFromDB(db: DatabaseConnection):
    return db.fetch_query(
        "SELECT ID, UserName FROM User"
    )

def DeleteUserFromDB(db: DatabaseConnection, userID: int):
    return db.execute_query(
        "DELETE FROM User WHERE ID = %s",
        (userID,)
    )

def GetUserScoreFromDB(db: DatabaseConnection, userID: int):
    return db.fetch_query(
        "SELECT ID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo FROM Scores WHERE UserID = %s AND CompletionDatetime IS NOT NULL ORDER BY CompletionDatetime ASC",
        (userID,)
    )

@api_blueprint.route("/Register", methods=["POST"])
@required_db
def Register(db: DatabaseConnection):
    data = request.get_json()
    username: str = data.get("username")
    password: str = data.get("password")
    
    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400
    
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

@api_blueprint.route("/Login", methods=["POST"])
@required_db
def Login(db: DatabaseConnection):
    data = request.get_json()
    username: str = data.get("username")
    password: str = data.get("password")
    
    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400
    
    # Check credentials:
    user = db.fetch_one(
        "SELECT ID, UserName, IF(UserPassword = %s, \"MATCH\", \"UNMATCH\") AS PasswordMatch FROM User WHERE UserName = %s",
        (password, username)
    )
    
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
@required_db
def GetUser(db: DatabaseConnection):
    userID: int = request.user_payload.get("user_id")
        
    user = GetUserFromDB(db, userID)
    
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

@api_blueprint.route("/User", methods=["DELETE"])
@required_auth
@required_db
def DeleteUser(db: DatabaseConnection):
    userID: int = request.user_payload.get("user_id")

    result = DeleteUserFromDB(db, userID)
    
    if result is not None:
        return jsonify({
            "success": True,
            "message": "User deleted successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "User deletion failed"
        }), 404

@api_blueprint.route("/SubmitScore", methods=["POST"])
@required_auth
@required_db
def SubmitScore(db: DatabaseConnection):
    userID: int = request.user_payload.get("user_id")
    
    data = request.get_json()
    lvlID: int = data.get("Lvl")
    quizMark: int = data.get("QuizMark")
    totalQuizMark: int = data.get("TotalQuizMark")
    startDT: str = data.get("StartDatetime")
    completionDT: str = data.get("CompletionDatetime", None)
    quizInfo: dict = data.get("QuizInfo", {})
    
    quizInfoJSON: str = json.dumps(quizInfo)
    
    db.execute_query(
        "INSERT INTO Scores (UserID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (userID, lvlID, quizMark, totalQuizMark, startDT, completionDT, quizInfoJSON)
    )
    
    return jsonify({
        "success": True,
        "message": "Score submitted successfully"
    }), 201

@api_blueprint.route("/Scores", methods=["GET"])
@required_auth
@required_db
def GetScores(db: DatabaseConnection):
    userID: int = request.user_payload.get("user_id")
        
    scores = GetUserScoreFromDB(db, userID)
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200

@api_blueprint.route("/Users", methods=["GET"])
@required_auth
@required_db
def GetAllUsers(db: DatabaseConnection):
    users = GetUsersFromDB(db)

    return jsonify({
        "success": True,
        "users": users
    }), 200

@api_blueprint.route("/User/<int:userID>", methods=["GET"])
@required_auth
@required_db
def GetUserWithID(db: DatabaseConnection, userID: int):
    user = GetUserFromDB(db, userID)
    
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

@api_blueprint.route("/User/<int:userID>", methods=["PATCH"])
@required_auth
@required_db
def UpdateUser(db: DatabaseConnection, userID: int):
    data = request.get_json()
    password: str = data.get("password", None)
    # All attributes here, maybe best to separate password and role with other attributes

    # Check if any attribute is provided, don't execute if not provided:
    if password is None:
        return jsonify({
            "success": False,
            "message": "No data provided"
        }), 400

    query: str = f"""
        UPDATE User
        SET
            {"UserPassword = %s, " if password else ""}
        WHERE ID = %s
    """

    params: list = []

    if password:
        params.append(password)

    params.append(userID)

    result = db.execute_query(query,params)

    if result is not None:
        return jsonify({
            "success": True,
            "message": "User updated successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "User update failed"
        }), 404

@api_blueprint.route("/User/<int:userID>", methods=["DELETE"])
@required_auth
@required_db
def DeleteUserWithID(db: DatabaseConnection, userID: int):
    result = DeleteUserFromDB(db, userID)
    
    if result is not None:
        return jsonify({
            "success": True,
            "message": "User deleted successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "User deletion failed"
        }), 404

@api_blueprint.route("/User/<int:userID>/Scores", methods=["GET"])
@required_auth
@required_db
def GetScoresWithUserID(db: DatabaseConnection, userID: int):
    scores = GetUserScoreFromDB(db, userID)
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200

@api_blueprint.route("/Level/<int:levelID>/Scores", methods=["GET"])
@required_auth
@required_db
def GetScoresWithLevelID(db: DatabaseConnection, levelID: int):
    scores = db.fetch_query("SELECT ID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo FROM Scores WHERE LevelID = %s AND CompletionDatetime IS NOT NULL ORDER BY CompletionDatetime ASC", (levelID,))
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200
