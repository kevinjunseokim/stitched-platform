"""Auth flow: register, login, current-user, refresh, confirmation, password reset."""
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from utils.jwt_utils import get_secret_key


class TestRegister:
    def test_register_returns_user_and_tokens(self, client):
        response = client.post(
            "/api/register",
            json={
                "email": "Alice@example.com",
                "password": "supersecret",
                "displayName": "Alice Wonderland",
            },
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["access_token"]
        assert body["refresh_token"]
        # Email is normalised to lowercase.
        assert body["user"]["email"] == "alice@example.com"
        assert body["user"]["firstName"] == "Alice"
        assert body["user"]["lastName"] == "Wonderland"
        assert body["user"]["handle"]

    def test_register_with_custom_handle(self, client):
        response = client.post(
            "/api/register",
            json={
                "email": "bob@example.com",
                "password": "supersecret",
                "displayName": "Bob",
                "handle": "bobbygolf",
            },
        )
        assert response.status_code == 201
        assert response.get_json()["user"]["handle"] == "bobbygolf"

    def test_register_rejects_duplicate_email(self, client, register_user):
        register_user(email="dup@example.com")
        response = client.post(
            "/api/register",
            json={
                "email": "dup@example.com",
                "password": "supersecret",
                "displayName": "Dup",
            },
        )
        assert response.status_code == 400
        assert "already exists" in response.get_json()["error"]

    def test_register_rejects_duplicate_handle(self, client, register_user):
        register_user(handle="grailmaster", displayName="One Person")
        response = client.post(
            "/api/register",
            json={
                "email": "two@example.com",
                "password": "supersecret",
                "displayName": "Two Person",
                "handle": "grailmaster",
            },
        )
        assert response.status_code == 400
        assert "handle" in response.get_json()["error"].lower()

    @pytest.mark.parametrize(
        "payload,expected_fragment",
        [
            ({"password": "supersecret", "displayName": "X"}, "Email"),
            ({"email": "not-an-email", "password": "supersecret", "displayName": "X"}, "valid email"),
            ({"email": "x@y.io", "displayName": "X"}, "Password"),
            ({"email": "x@y.io", "password": "short", "displayName": "X"}, "at least 8"),
            ({"email": "x@y.io", "password": "supersecret"}, "Display name"),
            (
                {
                    "email": "x@y.io",
                    "password": "supersecret",
                    "displayName": "Has Name",
                    "handle": "no",
                },
                "Handle must be",
            ),
        ],
    )
    def test_register_validation(self, client, payload, expected_fragment):
        response = client.post("/api/register", json=payload)
        assert response.status_code == 400
        assert expected_fragment.lower() in response.get_json()["error"].lower()

    def test_register_auto_assigns_handle_collision(self, client):
        # Two users with the same first name should get unique handles.
        client.post(
            "/api/register",
            json={"email": "first@y.io", "password": "supersecret", "displayName": "Sam Smith"},
        )
        second = client.post(
            "/api/register",
            json={"email": "second@y.io", "password": "supersecret", "displayName": "Sam Stone"},
        )
        assert second.status_code == 201
        handle = second.get_json()["user"]["handle"]
        assert handle  # non-empty
        assert handle != "sam"  # collision suffixed


class TestLogin:
    def test_login_returns_tokens(self, client, register_user):
        register_user(email="loginuser@example.com", password="hunter22hunter")
        response = client.post(
            "/api/login",
            json={"email": "loginuser@example.com", "password": "hunter22hunter"},
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["access_token"]
        assert body["refresh_token"]
        assert body["user"]["email"] == "loginuser@example.com"

    def test_login_wrong_password(self, client, register_user):
        register_user(email="wp@example.com", password="rightpassword")
        response = client.post(
            "/api/login",
            json={"email": "wp@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.get_json()["error"]

    def test_login_unknown_email(self, client):
        response = client.post(
            "/api/login",
            json={"email": "ghost@example.com", "password": "supersecret"},
        )
        assert response.status_code == 401

    def test_login_requires_confirmed_email(self, app, client):
        # Override AUTO_CONFIRM at app level for this test only.
        app.config["AUTO_CONFIRM_EMAIL"] = False
        try:
            register_response = client.post(
                "/api/register",
                json={
                    "email": "unconfirmed@example.com",
                    "password": "supersecret",
                    "displayName": "Unconfirmed Cat",
                },
            )
            assert register_response.status_code == 201
            body = register_response.get_json()
            assert body.get("confirmation_required") is True
            assert "access_token" not in body

            login = client.post(
                "/api/login",
                json={"email": "unconfirmed@example.com", "password": "supersecret"},
            )
            assert login.status_code == 403
            assert "confirm" in login.get_json()["error"].lower()
        finally:
            app.config["AUTO_CONFIRM_EMAIL"] = True


class TestCurrentUser:
    def test_current_user_returns_session(self, auth_client):
        client = auth_client()
        response = client.get("/api/current-user")
        assert response.status_code == 200
        assert response.get_json()["user"]["id"] == client.user_id

    def test_current_user_without_token(self, client):
        response = client.get("/api/current-user")
        assert response.status_code == 401
        assert "Authorization" in response.get_json()["error"]

    def test_current_user_invalid_token(self, client):
        response = client.get(
            "/api/current-user", headers={"Authorization": "Bearer not.a.token"}
        )
        assert response.status_code == 401

    def test_current_user_malformed_header(self, client):
        response = client.get(
            "/api/current-user", headers={"Authorization": "Basic abc"}
        )
        assert response.status_code == 401
        assert "format" in response.get_json()["error"].lower()


class TestRefreshToken:
    def test_refresh_with_valid_token(self, client, register_user):
        data = register_user(email="refresh@example.com")
        response = client.post(
            "/api/refresh", json={"refresh_token": data["refresh_token"]}
        )
        assert response.status_code == 200
        assert response.get_json()["access_token"]

    def test_refresh_with_access_token_rejected(self, client, register_user):
        data = register_user(email="refresh2@example.com")
        # Using the access token as a refresh token should fail (type mismatch).
        response = client.post(
            "/api/refresh", json={"refresh_token": data["access_token"]}
        )
        assert response.status_code == 401

    def test_refresh_missing_token(self, client):
        response = client.post("/api/refresh", json={})
        assert response.status_code == 400


class TestConfirmEmail:
    def test_confirm_email_flow(self, app, client):
        app.config["AUTO_CONFIRM_EMAIL"] = False
        try:
            client.post(
                "/api/register",
                json={
                    "email": "needsconfirm@example.com",
                    "password": "supersecret",
                    "displayName": "Pending",
                },
            )
            with app.app_context():
                from models import User
                user = User.query.filter_by(email="needsconfirm@example.com").first()
                token = user.confirmation_token
            assert token

            response = client.post("/api/confirm-email", json={"token": token})
            assert response.status_code == 200
            body = response.get_json()
            assert body["access_token"]
            assert body["user"]["emailConfirmed"] is True
        finally:
            app.config["AUTO_CONFIRM_EMAIL"] = True

    def test_confirm_email_rejects_invalid_token(self, client):
        response = client.post("/api/confirm-email", json={"token": "not-real"})
        assert response.status_code == 400

    def test_confirm_email_requires_token(self, client):
        response = client.post("/api/confirm-email", json={})
        assert response.status_code == 400


class TestPasswordReset:
    def test_forgot_password_returns_generic_response(self, client, register_user):
        register_user(email="forgot@example.com")
        response = client.post("/api/forgot-password", json={"email": "forgot@example.com"})
        assert response.status_code == 200
        assert "reset" in response.get_json()["message"].lower()

    def test_forgot_password_unknown_email_does_not_reveal(self, client):
        response = client.post("/api/forgot-password", json={"email": "ghost@example.com"})
        assert response.status_code == 200
        # Same generic message regardless of whether the email exists.
        assert "reset" in response.get_json()["message"].lower()

    def test_reset_password_completes_flow(self, app, client, register_user):
        register_user(email="reset@example.com", password="oldpassword")
        client.post("/api/forgot-password", json={"email": "reset@example.com"})

        with app.app_context():
            from models import User
            user = User.query.filter_by(email="reset@example.com").first()
            token = user.reset_token
        assert token

        reset = client.post(
            "/api/reset-password",
            json={"token": token, "password": "newpassword99"},
        )
        assert reset.status_code == 200

        # Old password should fail, new password should succeed.
        old_login = client.post(
            "/api/login", json={"email": "reset@example.com", "password": "oldpassword"}
        )
        assert old_login.status_code == 401
        new_login = client.post(
            "/api/login",
            json={"email": "reset@example.com", "password": "newpassword99"},
        )
        assert new_login.status_code == 200

    def test_reset_password_invalid_token(self, client):
        response = client.post(
            "/api/reset-password",
            json={"token": "no-such-token", "password": "newpassword99"},
        )
        assert response.status_code == 400


class TestJwtUtils:
    def test_expired_token_rejected(self, client, app):
        # Construct an already-expired access token.
        with app.app_context():
            secret = get_secret_key()
        payload = {
            "user_id": "ghost",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
            "iat": datetime.now(timezone.utc) - timedelta(minutes=10),
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        response = client.get(
            "/api/current-user", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401

    def test_token_for_deleted_user(self, client, register_user, app):
        data = register_user(email="ghosted@example.com")
        with app.app_context():
            from initialization.database import db
            from models import User
            user = User.query.filter_by(email="ghosted@example.com").first()
            db.session.delete(user)
            db.session.commit()

        response = client.get(
            "/api/current-user",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        assert response.status_code == 401
