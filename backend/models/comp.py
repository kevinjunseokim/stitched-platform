from datetime import datetime

from initialization.database import db


class Comp(db.Model):
    __tablename__ = "comps"

    id = db.Column(db.String(40), primary_key=True)
    player_id = db.Column(db.String(80), db.ForeignKey("players.id"), index=True)
    title = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(80))
    sale_date = db.Column(db.String(20), index=True)
    price_cents = db.Column(db.Integer, nullable=False)
    buyers_premium = db.Column(db.Float, default=0.20)
    item_type = db.Column(db.String(80), index=True)
    auth = db.Column(db.String(120))
    confidence = db.Column(db.Integer, default=80)
    used_in_valuation = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "player": self.player_id,
            "title": self.title,
            "source": self.source,
            "date": self.sale_date,
            "price": self.price_cents // 100 if self.price_cents else 0,
            "premium": self.buyers_premium,
            "type": self.item_type,
            "auth": self.auth,
            "confidence": self.confidence,
            "usedIn": self.used_in_valuation,
        }
