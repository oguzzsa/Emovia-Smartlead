import os

from flask import Flask

from app.database import init_db
from config import config_by_name


def create_app(config_name=None):
    config_name = config_name or os.environ.get("APP_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    @app.after_request
    def add_cors_headers(response):
        """Allow browser-based Wix integrations to talk to this API."""
        response.headers["Access-Control-Allow-Origin"] = app.config["CORS_ORIGINS"]
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    with app.app_context():
        init_db(app)

    from app.routes import api_bp, pages_bp

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(pages_bp)
    return app
