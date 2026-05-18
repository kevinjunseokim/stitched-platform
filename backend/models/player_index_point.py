from datetime import datetime

from initialization.database import db


class PlayerIndexPoint(db.Model):
    __tablename__ = "player_index_points"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    player_id = db.Column(db.String(80), db.ForeignKey("players.id"), nullable=False, index=True)
    ts = db.Column(db.DateTime, nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("player_id", "ts", name="uq_player_ts"),
    )

    def to_dict(self):
        return {
            "playerId": self.player_id,
            "ts": self.ts.isoformat(),
            "value": self.value,
        }
