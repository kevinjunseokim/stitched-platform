import uuid
from datetime import datetime, timedelta

from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from initialization.database import db
from models import User
from utils.jwt_utils import generate_access_token, generate_refresh_token
from utils.validators import (
    parse_display_name,
    slugify_handle,
    validate_email,
    validate_handle,
    validate_password,
)


class AuthService:
    @staticmethod
    def auto_confirm_enabled():
        return current_app.config.get("AUTO_CONFIRM_EMAIL", True)

    @staticmethod
    def register(data):
        email, email_error = validate_email(data.get("email"))
        if email_error:
            return None, email_error, 400

        password, password_error = validate_password(data.get("password"))
        if password_error:
            return None, password_error, 400

        first_name, last_name, name_error = parse_display_name(
            data.get("displayName"),
            data.get("first_name"),
            data.get("last_name"),
        )
        if name_error:
            return None, name_error, 400

        if User.query.filter_by(email=email).first():
            return None, "An account with this email already exists", 400

        requested_handle = data.get("handle")
        if requested_handle:
            handle, handle_error = validate_handle(requested_handle)
            if handle_error:
                return None, handle_error, 400
        else:
            handle = AuthService._generate_unique_handle(email, first_name)

        if User.query.filter_by(handle=handle).first():
            return None, "That handle is already taken", 400

        auto_confirm = AuthService.auto_confirm_enabled()
        confirmation_token = str(uuid.uuid4())

        user = User(
            email=email,
            password_hash=generate_password_hash(password, method="pbkdf2:sha256"),
            first_name=first_name,
            last_name=last_name,
            handle=handle,
            user_type=data.get("user_type", "collector"),
            email_confirmed=auto_confirm,
            confirmation_token=None if auto_confirm else confirmation_token,
        )
        db.session.add(user)
        db.session.commit()

        response = AuthService._auth_response(
            user,
            "Registration successful",
            include_tokens=auto_confirm,
        )
        if not auto_confirm:
            response["confirmation_required"] = True
            response["message"] = (
                "Account created. Check your email to confirm your address before signing in."
            )
        return response, None, 201

    @staticmethod
    def login(data):
        email, email_error = validate_email(data.get("email"))
        if email_error:
            return None, email_error, 400

        password, password_error = validate_password(data.get("password"))
        if password_error:
            return None, password_error, 400

        user = User.query.filter_by(email=email).first()
        if (
            not user
            or not user.password_hash
            or not check_password_hash(user.password_hash, password)
        ):
            return None, "Invalid email or password", 401

        if not user.email_confirmed:
            return None, "Please confirm your email before signing in", 403

        return AuthService._auth_response(user, "Login successful"), None, 200

    @staticmethod
    def confirm_email(token):
        if not token:
            return None, "Confirmation token is required", 400

        user = User.query.filter_by(confirmation_token=token).first()
        if not user:
            return None, "Invalid or expired confirmation link", 400

        user.email_confirmed = True
        user.confirmation_token = None
        db.session.commit()

        return AuthService._auth_response(user, "Email confirmed successfully"), None, 200

    @staticmethod
    def resend_confirmation(email_value):
        email, email_error = validate_email(email_value)
        if email_error:
            return None, email_error, 400

        user = User.query.filter_by(email=email).first()
        if user and not user.email_confirmed:
            user.confirmation_token = str(uuid.uuid4())
            db.session.commit()

        return {
            "message": "If an account with this email exists and is unconfirmed, a confirmation link has been sent"
        }, None, 200

    @staticmethod
    def forgot_password(email_value):
        email, email_error = validate_email(email_value)
        if email_error:
            return None, email_error, 400

        user = User.query.filter_by(email=email).first()
        if user:
            user.reset_token = str(uuid.uuid4())
            user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
            user.token_type = "password_reset"
            db.session.commit()

        return {
            "message": "If an account with this email exists, you will receive a password reset link shortly"
        }, None, 200

    @staticmethod
    def reset_password(token, password_value):
        if not token:
            return None, "Reset token is required", 400

        password, password_error = validate_password(password_value)
        if password_error:
            return None, password_error, 400

        user = User.query.filter_by(reset_token=token).first()
        if (
            not user
            or user.token_type != "password_reset"
            or not user.reset_token_expires
            or user.reset_token_expires < datetime.utcnow()
        ):
            return None, "Invalid or expired reset link", 400

        user.password_hash = generate_password_hash(password, method="pbkdf2:sha256")
        user.reset_token = None
        user.reset_token_expires = None
        user.token_type = None
        user.email_confirmed = True
        user.confirmation_token = None
        db.session.commit()

        return AuthService._auth_response(user, "Password reset successful"), None, 200

    @staticmethod
    def _auth_response(user, message, include_tokens=True):
        response = {
            "message": message,
            "user": user.to_dict(),
        }
        if include_tokens:
            response["access_token"] = generate_access_token(user.id)
            response["refresh_token"] = generate_refresh_token(user.id)
        return response

    @staticmethod
    def _generate_unique_handle(email, first_name):
        candidates = [
            slugify_handle(first_name),
            slugify_handle(email.split("@")[0]),
        ]
        for base in candidates:
            handle = base
            suffix = 1
            while User.query.filter_by(handle=handle).first():
                suffix += 1
                trimmed = base[: max(1, 30 - len(str(suffix)))]
                handle = f"{trimmed}{suffix}"
            if handle:
                return handle
        return f"collector{uuid.uuid4().hex[:6]}"
