from datetime import datetime
import uuid

from initialization.database import db
from utils.items import cents_to_dollars, parse_json_array


class Item(db.Model):
    __tablename__ = "items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    sport = db.Column(db.String(50), nullable=False)
    league = db.Column(db.String(50))
    player_id = db.Column(db.String(100), nullable=False)
    team = db.Column(db.String(120))
    item_type = db.Column(db.String(80), nullable=False)
    season = db.Column(db.String(30))
    game_date = db.Column(db.String(30))
    usage_type = db.Column(db.String(80))
    event = db.Column(db.String(255))
    stats = db.Column(db.String(255))
    rookie = db.Column(db.Boolean, default=False, nullable=False)
    postseason = db.Column(db.Boolean, default=False, nullable=False)
    authentication_source = db.Column(db.String(120))
    certification_number = db.Column(db.String(120))
    provenance = db.Column(db.String(255))
    acquisition_price_cents = db.Column(db.Integer)
    acquisition_date = db.Column(db.String(30))
    acquisition_source = db.Column(db.String(120))
    lot_reference = db.Column(db.String(120))
    notes = db.Column(db.Text)
    visibility = db.Column(db.String(30), default="public", nullable=False)
    for_sale = db.Column(db.Boolean, default=False, nullable=False)
    asking_price_cents = db.Column(db.Integer)
    share_to_feed = db.Column(db.Boolean, default=True, nullable=False)
    estimate_low_cents = db.Column(db.Integer)
    estimate_mid_cents = db.Column(db.Integer)
    estimate_high_cents = db.Column(db.Integer)
    confidence = db.Column(db.String(30), default="Medium", nullable=False)
    tint = db.Column(db.String(20), default="#5C3820")
    glyph = db.Column(db.String(4), default="S")
    tags_json = db.Column(db.Text, default="[]", nullable=False)
    badges_json = db.Column(db.Text, default="[]", nullable=False)
    images_json = db.Column(db.Text, default="[]", nullable=False)
    like_count = db.Column(db.Integer, default=0, nullable=False)
    comment_count = db.Column(db.Integer, default=0, nullable=False)
    sold_at = db.Column(db.DateTime, nullable=True)
    sold_price_cents = db.Column(db.Integer, nullable=True)
    sold_to = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def to_dict(self, viewer_user_id=None, owner_user=None):
        acquired = cents_to_dollars(self.acquisition_price_cents)
        mid = cents_to_dollars(self.estimate_mid_cents)
        if mid is None:
            mid = cents_to_dollars(self.acquisition_price_cents)
        estimate = {
            "low": cents_to_dollars(self.estimate_low_cents) if self.estimate_low_cents is not None else mid,
            "mid": mid,
            "high": cents_to_dollars(self.estimate_high_cents) if self.estimate_high_cents is not None else mid,
        }

        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "sport": self.sport,
            "league": self.league,
            "player": self.player_id,
            "team": self.team,
            "type": self.item_type,
            "season": self.season,
            "gameDate": self.game_date,
            "usage": self.usage_type,
            "event": self.event or "",
            "stats": self.stats or "",
            "rookie": self.rookie,
            "postseason": self.postseason,
            "auth": self.authentication_source,
            "cert": self.certification_number,
            "provenance": self.provenance or "",
            "acquired": acquired,
            "acquiredDate": self.acquisition_date,
            "source": self.acquisition_source or "",
            "lot": self.lot_reference or "",
            "notes": self.notes or "",
            "visibility": self.visibility,
            "forSale": self.for_sale,
            "askingPrice": cents_to_dollars(self.asking_price_cents),
            "share": self.share_to_feed,
            "estimate": estimate,
            "confidence": self.confidence,
            "tint": self.tint,
            "glyph": self.glyph,
            "tags": parse_json_array(self.tags_json),
            "badges": parse_json_array(self.badges_json),
            "images": parse_json_array(self.images_json),
            "likes": self.like_count,
            "commentsCount": self.comment_count,
            "soldAt": self.sold_at.isoformat() if self.sold_at else None,
            "soldPrice": cents_to_dollars(self.sold_price_cents),
            "soldTo": self.sold_to,
            "owner": self._owner_label(viewer_user_id, owner_user),
            "ownerUser": owner_user.to_dict() if owner_user else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }

    def _owner_label(self, viewer_user_id, owner_user):
        if viewer_user_id and self.user_id == viewer_user_id:
            return "you"
        if owner_user and owner_user.handle:
            return owner_user.handle
        if owner_user:
            return (owner_user.first_name or "collector").lower()
        return "collector"

