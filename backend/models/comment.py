from datetime import datetime
import uuid

from initialization.database import db


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    target_type = db.Column(db.String(20), nullable=False)
    target_id = db.Column(db.String(80), nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        db.Index("ix_comment_target", "target_type", "target_id"),
    )

    def to_dict(self, author=None):
        result = {
            "id": self.id,
            "userId": self.user_id,
            "targetType": self.target_type,
            "targetId": self.target_id,
            "body": self.body,
            "createdAt": self.created_at.isoformat(),
        }
        if author is not None:
            result["author"] = {
                "id": author.id,
                "displayName": f"{author.first_name} {author.last_name}".strip(),
                "handle": author.handle,
                "initials": f"{(author.first_name or 'U')[0]}{(author.last_name or '')[:1]}".upper(),
            }
        return result
