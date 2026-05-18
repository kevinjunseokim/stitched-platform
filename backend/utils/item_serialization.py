"""Serialize items with correct owner labels for the viewing user."""

from models import User


def serialize_item(item, viewer_user_id=None):
    owner = User.query.get(item.user_id) if item.user_id else None
    return item.to_dict(viewer_user_id=viewer_user_id, owner_user=owner)


def serialize_items(items, viewer_user_id=None):
    if not items:
        return []
    owner_ids = {item.user_id for item in items if item.user_id}
    owners = {
        user.id: user
        for user in User.query.filter(User.id.in_(owner_ids)).all()
    } if owner_ids else {}
    return [
        item.to_dict(viewer_user_id=viewer_user_id, owner_user=owners.get(item.user_id))
        for item in items
    ]
