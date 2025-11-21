from flask import request, jsonify, send_from_directory
from functools import wraps
import os
import jwt
from datetime import datetime, timedelta, timezone

jwt_secret_key: str = os.getenv("JWT_secret_key", "")
jwt_algorithm: str = os.getenv("JWT_algorithm", "")

def GenerateToken(userID, lifeTime: timedelta=timedelta(hours=6)) -> str:
    dtNow: datetime = datetime.now(timezone.utc)
    payload: dict = {
        "user_id": userID,
        "exp": dtNow + lifeTime,
        "iat": dtNow
    }
    
    return jwt.encode(payload, jwt_secret_key, algorithm=jwt_algorithm)

def DecodeToken(token: str):
    if not token:
        return None, "Missing token"
    
    try:
        payload: dict = jwt.decode(token, jwt_secret_key, algorithms=jwt_algorithm)
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"
    except Exception as e:
        return None, f"Token decode error: {repr(e)}"
    
def DecodeAuthHeader():
    auth: str = request.headers.get("Authorization")
    
    if not auth:
        return None, "Missing Authorization header"
    
    try:
        token: str = auth.split(" ")[1]
        payload, error = DecodeToken(token)
        
        return payload, error
    except Exception as e:
        return None, f"Authorization header error: {repr(e)}"

def __default_onFailure(error: str):
    return jsonify({
        "success": False,
        "message": error
    }), 401

def required_auth(onFailure=__default_onFailure):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            payload, error = DecodeAuthHeader()
            
            if error:
                return onFailure(error)
                
            # Store payload in request context:
            request.user_payload = payload
            
            return func(*args, **kwargs)
        return wrapper
    return decorator
