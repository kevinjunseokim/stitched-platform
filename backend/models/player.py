from datetime import datetime

from initialization.database import db


class Player(db.Model):
    __tablename__ = "players"

    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    team = db.Column(db.String(120))
    sport = db.Column(db.String(20), index=True)
    initials = db.Column(db.String(4))
    color = db.Column(db.String(20))
    current_index = db.Column(db.Float, default=0.0)
    d30 = db.Column(db.Float, default=0.0)
    d90 = db.Column(db.Float, default=0.0)
    d365 = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "team": self.team,
            "sport": self.sport,
            "initials": self.initials,
            "color": self.color,
            "index": self.current_index,
            "d30": self.d30,
            "d90": self.d90,
            "d365": self.d365,
        }
