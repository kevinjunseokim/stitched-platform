from datetime import datetime

from initialization.database import db


class NotableSale(db.Model):
    __tablename__ = "notable_sales"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    house = db.Column(db.String(80))
    sale_date = db.Column(db.String(20))
    price_cents = db.Column(db.Integer, nullable=False)
    player_id = db.Column(db.String(80), db.ForeignKey("players.id"), nullable=True, index=True)
    sport = db.Column(db.String(20), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "house": self.house,
            "date": self.sale_date,
            "price": (self.price_cents or 0) // 100,
            "player": self.player_id,
            "sport": self.sport,
        }
