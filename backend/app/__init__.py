from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db import init_db


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(title="Spell Bee Voice Bot")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()

    app.include_router(router, prefix="/api")

    return app
