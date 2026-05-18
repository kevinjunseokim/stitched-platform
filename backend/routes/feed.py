from flask import Blueprint, g, jsonify, request

from models import ActivityEvent, Item, Like, Player, User
from utils.auth import jwt_required
from utils.item_serialization import serialize_items
from utils.json_field import parse_payload


feed_bp = Blueprint("feed", __name__)


@feed_bp.route("/feed", methods=["GET"])
@jwt_required
def get_feed():
    limit = min(int(request.args.get("limit", 50)), 100)
    user = g.current_user

    events = (
        ActivityEvent.query
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit * 2)
        .all()
    )

    # Hide other collectors' private pieces from the global feed.
    visible_events = []
    private_item_ids = set()
    item_subject_ids = [e.subject_id for e in events if e.subject_type == "item" and e.subject_id]
    if item_subject_ids:
        for item in Item.query.filter(Item.id.in_(item_subject_ids)).all():
            if item.visibility != "public" and item.user_id != user.id:
                private_item_ids.add(item.id)

    for event in events:
        if event.kind == "milestone":
            continue
        if event.subject_type == "item" and event.subject_id in private_item_ids:
            continue
        visible_events.append(event)
        if len(visible_events) >= limit:
            break

    items_map = {}
    players_map = {}
    actors_map = {}

    item_ids = [e.subject_id for e in visible_events if e.subject_type == "item" and e.subject_id]
    if item_ids:
        hydrated_items = serialize_items(
            Item.query.filter(Item.id.in_(item_ids)).all(),
            viewer_user_id=user.id,
        )
        items_map = {row["id"]: row for row in hydrated_items}

    actor_ids = [e.actor_user_id for e in visible_events if e.actor_user_id]
    if actor_ids:
        for u in User.query.filter(User.id.in_(actor_ids)).all():
            actors_map[u.id] = u.to_dict()

    player_ids = list({e.subject_id for e in visible_events if e.subject_type == "player" and e.subject_id})
    payload_player_ids = []
    for e in visible_events:
        payload = parse_payload(e.payload_json)
        if payload.get("player"):
            payload_player_ids.append(payload["player"])
    all_player_ids = list({*player_ids, *payload_player_ids})
    if all_player_ids:
        for p in Player.query.filter(Player.id.in_(all_player_ids)).all():
            players_map[p.id] = p.to_dict()

    liked_event_ids = set()
    event_ids = [e.id for e in visible_events]
    if event_ids:
        liked = Like.query.filter(
            Like.user_id == user.id,
            Like.target_type == "event",
            Like.target_id.in_(event_ids),
        ).all()
        liked_event_ids = {l.target_id for l in liked}

    hydrated = []
    for e in visible_events:
        d = e.to_dict()
        d["liked"] = e.id in liked_event_ids
        if e.subject_type == "item" and e.subject_id in items_map:
            d["item"] = items_map[e.subject_id]
        if e.subject_type == "player" and e.subject_id in players_map:
            d["player"] = players_map[e.subject_id]
        if e.actor_user_id and e.actor_user_id in actors_map:
            d["actorUser"] = actors_map[e.actor_user_id]
        payload = d.get("payload") or {}
        if payload.get("player") and payload["player"] in players_map:
            d["player"] = players_map[payload["player"]]
        hydrated.append(d)

    return jsonify({"events": hydrated}), 200
