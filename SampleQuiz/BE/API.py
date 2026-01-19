from flask import Blueprint, jsonify, request, make_response
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
        "SELECT ID, UserName, UserEmail, UserBirthDate, UserGender, CreationDatetime, UserRole FROM User WHERE ID = %s",
        (userID,)
    )

def GetUsersFromDB(db: DatabaseConnection):
    return db.fetch_query(
        "SELECT ID, UserName, UserEmail, UserBirthDate, UserGender, CreationDatetime, UserRole FROM User"
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

    useremail: str = data.get("useremail", None)
    userbirthdate: str = data.get("userbirthdate", None)
    usergender: str = data.get("usergender", None)
    
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
        "INSERT INTO User (UserName, UserPassword, UserEmail, UserBirthDate, UserGender) VALUES (%s, %s, %s, %s, %s)",
        (username, password, useremail, userbirthdate, usergender)
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
        "SELECT ID, UserName, UserRole, IF(UserPassword = %s, \"MATCH\", \"UNMATCH\") AS PasswordMatch FROM User WHERE UserName = %s",
        (password, username)
    )
    
    if user:
        passwordMatch: bool = user.get("PasswordMatch") == "MATCH"
        if passwordMatch:
            jwt: str = GenerateToken(user.get("ID"), user.get("UserRole"))

            response = make_response(jsonify({
                "success": True,
                "message": "Login successful",
                "token": jwt
            }))

            response.set_cookie("JWT", jwt)

            return response, 200
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

@api_blueprint.route("/Logout", methods=["POST"])
def Logout():
    response = make_response(jsonify({
        "success": True,
        "message": "Logout successful"
    }))

    response.set_cookie("JWT", "", expires=0)

    return response, 200

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
@required_db
@required_auth()
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
@required_db
@required_auth()
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
@required_db
@required_auth()
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
@required_auth()
@required_db
def GetScores(db: DatabaseConnection):
    userID: int = request.user_payload.get("user_id")
        
    scores = GetUserScoreFromDB(db, userID)
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200

@api_blueprint.route("/Users", methods=["GET"])
@required_db
@required_auth()
def GetAllUsers(db: DatabaseConnection):
    users = GetUsersFromDB(db)

    return jsonify({
        "success": True,
        "users": users
    }), 200

@api_blueprint.route("/User/<int:userID>", methods=["GET"])
@required_db
@required_auth()
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
@required_db
@required_auth()
def UpdateUser(db: DatabaseConnection, userID: int):
    if request.user_payload.get("user_role") != "ADMIN":
        if request.user_payload.get("user_id") != userID:
            return jsonify({
                "success": False,
                "message": "Not authorized to update this user"
            }), 403
    
    data = request.get_json()
    
    userEmailProvided: bool = "useremail" in data
    userEmail: str = data.get("useremail", None)
    userBirthDateProvided: bool = "userbirthdate" in data
    userBirthDate: str = data.get("userbirthdate", None)
    userGenderProvided: bool = "usergender" in data
    userGender: str = data.get("usergender", None)

    if not any(userEmailProvided, userBirthDateProvided, userGenderProvided):
        return jsonify({
            "success": False,
            "message": "No attributes provided"
        }), 400

    query: str = """
        UPDATE User
        SET
            {"UserEmail = %s, " if userEmailProvided else ""}
            {"UserBirthDate = %s, " if userBirthDateProvided else ""}
            {"UserGender = %s, " if userGenderProvided else ""}
        WHERE ID = %s
    """

    params: list = []

    if userEmailProvided:
        params.append(userEmail)
    if userBirthDateProvided:
        params.append(userBirthDate)
    if userGenderProvided:
        params.append(userGender)

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

@api_blueprint.route("/User/<int:userID>/password", methods=["POST"])
@required_db
@required_auth()
def UpdateUserPassword(db: DatabaseConnection, userID: int):
    if request.user_payload.get("user_role") != "ADMIN":
        if request.user_payload.get("user_id") != userID:
            return jsonify({
                "success": False,
                "message": "Not authorized to update this user's password"
            }), 403
    
    data = request.get_json()
    
    userPassword: str = data.get("userpassword", None)
    
    if not userPassword:
        return jsonify({
            "success": False,
            "message": "No password provided"
        }), 400
    
    result = db.execute_query("UPDATE User SET UserPassword = %s WHERE ID = %s", (userPassword, userID))
    
    if result is not None:
        return jsonify({
            "success": True,
            "message": "User password updated successfully"
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "User password update failed"
        }), 404

@api_blueprint.route("/User/<int:userID>", methods=["DELETE"])
@required_db
@required_auth()
def DeleteUserWithID(db: DatabaseConnection, userID: int):
    if request.user_payload.get("user_role") != "ADMIN":
        if request.user_payload.get("user_id") != userID:
            return jsonify({
                "success": False,
                "message": "Not authorized to delete this user"
            }), 403

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
@required_db
@required_auth()
def GetScoresWithUserID(db: DatabaseConnection, userID: int):
    scores = GetUserScoreFromDB(db, userID)
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200

@api_blueprint.route("/Level/<int:levelID>/Scores", methods=["GET"])
@required_db
@required_auth()
def GetScoresWithLevelID(db: DatabaseConnection, levelID: int):
    scores = db.fetch_query("SELECT ID, LevelID, QuizMark, TotalQuizMark, StartDatetime, CompletionDatetime, QuizInfo FROM Scores WHERE LevelID = %s AND CompletionDatetime IS NOT NULL ORDER BY CompletionDatetime ASC", (levelID,))
    
    return jsonify({
        "success": True,
        "scores": scores
    }), 200
