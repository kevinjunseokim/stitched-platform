from datetime import datetime
import json

from initialization.database import db


class SavedSearch(db.Model):
    __tablename__ = "saved_searches"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    query = db.Column(db.String(255), default="")
    filters_json = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        try:
            filters = json.loads(self.filters_json or "{}")
        except json.JSONDecodeError:
            filters = {}
        return {
            "id": self.id,
            "name": self.name,
            "query": self.query,
            "filters": filters,
            "createdAt": self.created_at.isoformat(),
        }
