from models import User


def find_user_by_handle_or_id(value):
    return User.query.filter(
        (User.handle == value) | (User.id == value)
    ).first()
