"""Helpers to record activity events that power the home feed and notifications."""
import json

from sqlalchemy import exists, select

from initialization.database import db
from models import ActivityEvent, Follow, Item, Notification


def record_event(kind, actor_user_id, subject_type=None, subject_id=None, payload=None):
    """Insert a new ActivityEvent and fan out notifications to followers of the actor."""
    event = ActivityEvent(
        kind=kind,
        actor_user_id=actor_user_id,
        subject_type=subject_type,
        subject_id=subject_id,
        payload_json=json.dumps(payload or {}),
    )
    db.session.add(event)
    db.session.flush()

    if actor_user_id:
        _fan_out_notifications(event, actor_user_id)

    return event


def sync_item_feed_events():
    """Create feed events for public items that do not yet appear on the activity feed."""
    has_event = exists(
        select(ActivityEvent.id).where(
            ActivityEvent.subject_type == "item",
            ActivityEvent.subject_id == Item.id,
        )
    )
    items = (
        Item.query
        .filter_by(visibility="public", share_to_feed=True)
        .filter(~has_event)
        .all()
    )

    created = 0
    for item in items:
        # Insert directly so backfill does not fan out notifications.
        db.session.add(ActivityEvent(
            kind="added",
            actor_user_id=item.user_id,
            subject_type="item",
            subject_id=item.id,
            payload_json=json.dumps({"title": item.title}),
            created_at=item.created_at,
        ))
        created += 1

    if created:
        db.session.commit()
    return created


def _fan_out_notifications(event, actor_user_id):
    followers = (
        Follow.query
        .filter_by(target_type="user", target_id=actor_user_id)
        .all()
    )
    title_for = {
        "added": "added a new item",
        "listed": "listed an item for sale",
        "sold": "marked an item as sold",
        "updated": "updated an item",
    }
    title = title_for.get(event.kind, "had new activity")
    for follow in followers:
        notification = Notification(
            user_id=follow.follower_user_id,
            kind=f"follow.{event.kind}",
            title=f"Someone you follow {title}",
            body=None,
            payload_json=json.dumps({
                "eventId": event.id,
                "actorUserId": actor_user_id,
                "subjectType": event.subject_type,
                "subjectId": event.subject_id,
            }),
        )
        db.session.add(notification)
