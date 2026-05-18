from datetime import datetime

from initialization.database import db


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    target_type = db.Column(db.String(20), nullable=False)
    target_id = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "target_type", "target_id", name="uq_like"),
        db.Index("ix_like_target", "target_type", "target_id"),
    )
