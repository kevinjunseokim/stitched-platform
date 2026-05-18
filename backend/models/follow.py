from datetime import datetime

from initialization.database import db


class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    follower_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    target_type = db.Column(db.String(20), nullable=False)
    target_id = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("follower_user_id", "target_type", "target_id", name="uq_follow"),
        db.Index("ix_follow_target", "target_type", "target_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "targetType": self.target_type,
            "targetId": self.target_id,
            "createdAt": self.created_at.isoformat(),
        }
