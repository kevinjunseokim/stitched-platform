from datetime import datetime
import uuid

from initialization.database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    handle = db.Column(db.String(30), unique=True, nullable=True, index=True)
    bio = db.Column(db.Text, default="", nullable=True)
    user_type = db.Column(db.String(30), default="collector", nullable=False)
    email_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    confirmation_token = db.Column(db.String(36))
    token_type = db.Column(db.String(30))
    reset_token = db.Column(db.String(36))
    reset_token_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    items = db.relationship("Item", backref="owner", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "displayName": f"{self.first_name} {self.last_name}".strip(),
            "handle": self.handle,
            "bio": self.bio or "",
            "initials": f"{(self.first_name or 'U')[0]}{(self.last_name or '')[:1]}".upper(),
            "userType": self.user_type,
            "emailConfirmed": self.email_confirmed,
            "createdAt": self.created_at.isoformat(),
        }
