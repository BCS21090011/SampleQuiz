from flask import Blueprint, request, jsonify
from BE.db_connection import DatabaseConnection
from functools import wraps
import jwt

auth_blueprint = Blueprint("Auth", __name__)

def required_auth(allowed_role=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            auth: str = request.headers.get("Authorization")
            