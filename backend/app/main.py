import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.router import api_router
from app.api.vk_oauth import router as vk_oauth_router
from app.config import settings
from app.db.session import engine, async_session
from app.scheduler.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Artika backend starting...")

    # Create all tables
    from app.models.base import Base
    import app.models  # noqa: F401 — registers all models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")

    # Create default admin user if not exists
    from app.models.user import User
    from app.auth.jwt_handler import hash_password
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == "admin@artika.ru"))
        if not result.scalar_one_or_none():
            admin = User(email="admin@artika.ru", hashed_password=hash_password("admin123"))
            db.add(admin)
            await db.commit()
            logger.info("Default admin user created.")

    start_scheduler()
    yield
    stop_scheduler()
    logger.info("Artika backend shutting down...")
    await engine.dispose()


app = FastAPI(
    title="Artika",
    description="AI-маркетинговая аналитика для Яндекс Директ, Метрика и Вебмастер",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["https://ads.vk.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(vk_oauth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
