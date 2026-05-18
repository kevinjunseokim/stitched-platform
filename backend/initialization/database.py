from flask_sqlalchemy import SQLAlchemy
from flask_migrate import upgrade


db = SQLAlchemy()


def initialize_database(app):
    with app.app_context():
        upgrade(directory=app.config.get("MIGRATIONS_DIRECTORY", "migrations"))

        if app.config.get("ENVIRONMENT") == "development":
            from initialization.seed import seed_all

            seed_all()
