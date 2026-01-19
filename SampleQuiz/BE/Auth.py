from flask import request, jsonify, redirect
from functools import wraps
import os
import jwt
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

jwt_secret_key: str = os.getenv("JWT_secret_key", "")
jwt_algorithm: str = os.getenv("JWT_algorithm", "")

def GenerateToken(userID: int, role: str, lifeTime: timedelta=timedelta(hours=6)) -> str:
    dtNow: datetime = datetime.now(timezone.utc)
    payload: dict = {
        "user_id": userID,
        "user_role": role,
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
    cookie: str = request.cookies.get("JWT", None)

    if cookie is None:
        return None, "Missing JWT cookie"
    
    try:
        payload: dict = jwt.decode(cookie, jwt_secret_key, algorithms=jwt_algorithm)
        print(f"Payload: {payload}")
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"
    except Exception as e:
        return None, f"Token decode error: {repr(e)}"

def required_auth(adminOnly: bool=False):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            payload, error = DecodeAuthHeader()
            
            if error:
                return jsonify({
                "success": False,
                "message": error
            }), 401

            if adminOnly and payload.get("user_role") != "ADMIN":
                return jsonify({
                    "success": False,
                    "message": "Admin only"
                }), 403
                
            # Store payload in request context:
            request.user_payload = payload
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def required_page_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        payload, error = DecodeAuthHeader()
        
        if error:
            urlParams: dict = request.args.to_dict()
            urlParams.setdefault("dest", request.path)
            
            urlParamsStr: str = urlencode(urlParams)
            
            # Redirect to login page with destination parameter:
            login_url = f"/Login.html?{urlParamsStr}"
            return redirect(login_url)
            
        # Store payload in request context:
        request.user_payload = payload
        
        return func(*args, **kwargs)
    return wrapper
