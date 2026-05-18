from datetime import datetime
import json

from initialization.database import db


class WatchlistEntry(db.Model):
    __tablename__ = "watchlist_entries"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    target_type = db.Column(db.String(20), nullable=False)
    target_id = db.Column(db.String(80), nullable=False)
    label = db.Column(db.String(120))
    alert_pct = db.Column(db.Float, default=5.0)
    alert_freq = db.Column(db.String(20), default="daily")
    channels_json = db.Column(db.Text, default='["push"]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "target_type", "target_id", name="uq_watchlist"),
    )

    def to_dict(self):
        try:
            channels = json.loads(self.channels_json or "[]")
        except json.JSONDecodeError:
            channels = []
        return {
            "id": self.id,
            "targetType": self.target_type,
            "targetId": self.target_id,
            "label": self.label,
            "alertPct": self.alert_pct,
            "alertFreq": self.alert_freq,
            "channels": channels,
            "createdAt": self.created_at.isoformat(),
        }
