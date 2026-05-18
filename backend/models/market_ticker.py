from datetime import datetime

from initialization.database import db


class MarketTickerEntry(db.Model):
    __tablename__ = "market_ticker_entries"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    label = db.Column(db.String(80), nullable=False)
    value = db.Column(db.String(40), nullable=False)
    pct_change = db.Column(db.Float, default=0.0)
    sport = db.Column(db.String(20))
    sort_order = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "label": self.label,
            "value": self.value,
            "pct": self.pct_change,
            "sport": self.sport,
        }
