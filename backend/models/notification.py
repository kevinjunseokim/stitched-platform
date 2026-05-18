from datetime import datetime
import uuid

from initialization.database import db
from utils.json_field import parse_payload


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    kind = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text)
    payload_json = db.Column(db.Text, default="{}")
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "title": self.title,
            "body": self.body,
            "payload": parse_payload(self.payload_json),
            "read": self.read_at is not None,
            "readAt": self.read_at.isoformat() if self.read_at else None,
            "createdAt": self.created_at.isoformat(),
        }
