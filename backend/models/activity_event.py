from datetime import datetime
import uuid

from initialization.database import db
from utils.json_field import parse_payload


class ActivityEvent(db.Model):
    __tablename__ = "activity_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kind = db.Column(db.String(30), nullable=False, index=True)
    actor_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    subject_type = db.Column(db.String(20))
    subject_id = db.Column(db.String(80), index=True)
    payload_json = db.Column(db.Text, default="{}")
    like_count = db.Column(db.Integer, default=0, nullable=False)
    comment_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "actor": self.actor_user_id,
            "subjectType": self.subject_type,
            "subjectId": self.subject_id,
            "payload": parse_payload(self.payload_json),
            "likes": self.like_count,
            "comments": self.comment_count,
            "createdAt": self.created_at.isoformat(),
        }
