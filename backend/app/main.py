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


async def _seed_initial_data(db):
    from app.models.project import Project
    from app.models.project_task import ProjectTask

    projects_data = [
        {"name": "Падел Центр Видное", "domain": "padelvidnoe.ru", "metrika_counter_id": 104590290},
    ]
    projects = []
    for p in projects_data:
        proj = Project(**p)
        db.add(proj)
        projects.append(proj)
    await db.flush()

    tasks_data = [
        # Падел Центр Видное
        (0, "Баннер фасад Арктика Видное", "Реклама", "in_progress",
         ["ШАГ 1: уточнить размеры панелей у монтажников",
          "ШАГ 2: перевести шрифты в кривые (SONGER ExtraBold)",
          "ШАГ 3: согласовать макет", "ШАГ 4: отправить в печать", "ШАГ 5: повесить баннер"]),
        (0, "Семейный день 11 апреля — лендинг и реклама", "Мероприятия", "in_progress",
         ["Лендинг готов, тел +7 495 172 73 96",
          "СРОЧНО: токен Telegram-бота для формы записи",
          "Опубликовать до вт 8 апреля",
          "Запустить рекламу VK/Telegram"]),
        (0, "Выход на УК ЖК Дивное", "Партнёрства", "not_started",
         ["Звонок 8-495-139-61-08", "Выйти на ЛПР", "Отправить оффер по модели Суханово"]),
        (0, "Выход на УК ЖК Зелёные аллеи и ЭкоДом", "Партнёрства", "not_started",
         ["УК +7 495 204-99-44", "ЭкоДом 8 800 301-42-52", "Предложить семейный день"]),
        (0, "Аудит карточек клуба на картах", "Маркетинг", "not_started",
         ["Яндекс Карты, 2ГИС, Google Maps",
          "Обновить описания, фото, контакты, часы работы"]),
        (0, "День падела для школы Nadin School", "Мероприятия", "not_started",
         ["Определить дату и программу", "Согласовать условия со школой", "Подготовить флаер"]),
    ]

    for proj_idx, title, category, status, details in tasks_data:
        task = ProjectTask(
            project_id=projects[proj_idx].id,
            title=title,
            category=category,
            status=status,
            details=details,
        )
        db.add(task)

    await db.commit()


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
    from app.models.project import Project
    from app.models.project_task import ProjectTask
    from app.auth.jwt_handler import hash_password
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == "admin@artika.ru"))
        if not result.scalar_one_or_none():
            admin = User(email="admin@artika.ru", hashed_password=hash_password("admin123"))
            db.add(admin)
            await db.commit()
            logger.info("Default admin user created.")

    # Reset to single project if multiple projects exist (cleanup)
    from sqlalchemy import delete as sa_delete
    async with async_session() as db:
        all_projects = (await db.execute(select(Project))).scalars().all()
        project_names = [p.name for p in all_projects]
        if len(all_projects) > 1 or (all_projects and all_projects[0].name != "Падел Центр Видное"):
            logger.info(f"Resetting projects (found: {project_names})...")
            await db.execute(sa_delete(ProjectTask))
            await db.execute(sa_delete(Project))
            await db.commit()
            await _seed_initial_data(db)
            logger.info("Projects reset to Падел Центр Видное only.")
        elif not all_projects:
            await _seed_initial_data(db)
            logger.info("Initial data seeded.")

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


@app.post("/admin/reset-projects")
async def reset_projects():
    """One-time reset: delete all projects/tasks and seed Падел Центр Видное only."""
    from app.models.project import Project
    from app.models.project_task import ProjectTask
    from sqlalchemy import delete as sa_delete
    async with async_session() as db:
        await db.execute(sa_delete(ProjectTask))
        await db.execute(sa_delete(Project))
        await db.commit()
        await _seed_initial_data(db)
    return {"status": "ok", "message": "Reset to Падел Центр Видное"}
