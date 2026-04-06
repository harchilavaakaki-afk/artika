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
        {"name": "y-2work.ru", "domain": "y-2work.ru", "metrika_counter_id": 106573383},
        {"name": "Падел Центр", "domain": "padelvidnoe.ru", "metrika_counter_id": 104590290},
        {"name": "ПКР Партнер", "domain": "pkrpartner.ru"},
        {"name": "Лента Работа", "domain": "lentarabotapartner.ru", "metrika_counter_id": 103593183},
        {"name": "Мир Кадров", "domain": "worldofstaff.ru", "metrika_counter_id": 106228168},
        {"name": "ПКР Лента", "domain": "y-prk.ru", "metrika_counter_id": 104641748},
        {"name": "ПКР Самокат", "domain": "kurierps-samokatpartner.ru", "metrika_counter_id": 106870736},
        {"name": "Туворк Самокат", "domain": "2workpartner.ru", "metrika_counter_id": 106871416},
        {"name": "2work Partner", "domain": "2workpartner.ru"},
        {"name": "y-prk.ru", "domain": "y-prk.ru"},
        {"name": "Лэндинг Семейный день", "domain": "padelvidnoe.ru", "metrika_counter_id": 104590290},
    ]
    projects = []
    for p in projects_data:
        proj = Project(**p)
        db.add(proj)
        projects.append(proj)
    await db.flush()

    tasks_data = [
        # project index 0 = y-2work.ru (Artika platform)
        (0, "Настроить Яндекс Директ API", "Интеграции", "bug",
         ["Заявка ОТКЛОНЕНА 31.03.2026 — нужно переподать",
          "client_id: 6403e4add4594584a94030e97f06848a, логин: h.akaky",
          "Методы: campaigns.get, adgroups.get, ads.get, keywords.get, reports x2",
          "Частота: 6 запросов в час"]),
        (0, "Подключить Яндекс Метрику", "Интеграции", "done",
         ["Токен работает", "Counter ID настроен"]),
        (0, "Подключить Яндекс Вебмастер", "Интеграции", "done", ["API работает"]),
        (0, "Подключить VK Реклама", "Интеграции", "partial",
         ["Токен обновляется каждые 24ч", "Кампании через ads.vk.com не тянутся через старый API"]),
        (0, "Настроить автосинхронизацию", "Система", "done", ["Scheduler раз в час"]),
        (0, "Задеплоить фронтенд на Vercel", "Деплой", "done",
         ["https://frontend-rho-five-49.vercel.app"]),
        (0, "Задеплоить бэкенд на Render", "Деплой", "done",
         ["https://artika.onrender.com", "Free tier: cold start ~50 сек после простоя"]),
        (0, "Система чек-листов по проектам", "Фичи", "done",
         ["Модель ProjectTask", "CRUD API", "UI с прогресс-баром и категориями"]),
        (0, "AI-аналитика (Claude)", "Фичи", "partial",
         ["Клиент подключён", "Нужно прописать промпты"]),
        (0, "Шифрование credentials в БД", "Безопасность", "not_started",
         ["Fernet ключ готов в конфиге", "Применить к API токенам"]),
        # project index 1 = Падел Центр
        (1, "Настроить Яндекс Метрику", "Аналитика", "done", ["Counter ID 104590290"]),
        (1, "Семейный день 11 апреля", "Мероприятия", "partial",
         ["Лендинг готов", "Реклама запущена", "Ждём результатов"]),
        (1, "Запустить рекламу VK", "Реклама", "partial",
         ["Объявления созданы", "Требует мониторинга"]),
        (1, "Настроить ретаргетинг", "Реклама", "not_started", []),
        (1, "Анализ ключевых слов", "SEO", "not_started", []),
        (1, "Баннер фасад Арктика Видное", "Реклама", "in_progress",
         ["ШАГ 1: уточнить размеры панелей у монтажников",
          "ШАГ 2: перевести шрифты в кривые (SONGER ExtraBold)",
          "ШАГ 3: согласовать макет", "ШАГ 4: отправить в печать", "ШАГ 5: повесить баннер"]),
        (1, "Выход на УК ЖК Дивное — семейный день", "Партнёрства", "not_started",
         ["Пн 7 апр: звонок 8-495-139-61-08", "Вт: подготовить оффер PDF", "Ср: отправить"]),
        (1, "Выход на УК ЖК Зелёные аллеи и ЭкоДом", "Партнёрства", "not_started",
         ["Пн 7 апр: УК +7 495 204-99-44, ЭкоДом 8 800 301-42-52", "Ср-Чт: отправить оффер"]),
        (1, "Аудит карточек клуба на картах", "Маркетинг", "not_started",
         ["Яндекс Карты, 2ГИС, Google Maps", "Обновить описания, фото, контакты"]),
        (1, "День падела для школы Nadin School", "Мероприятия", "not_started",
         ["Определить дату и программу", "Согласовать условия", "Подготовить флаер"]),
        # project index 10 = Лэндинг Семейный день
        (10, "Подключить форму записи (токен Telegram-бота)", "Разработка", "not_started",
         ["СРОЧНО до 8 апреля", "Токен формата: 123456:ABC-DEF..."]),
        (10, "Опубликовать лендинг на домене", "Деплой", "not_started",
         ["Дедлайн: вт 8 апреля", "Телефон уже обновлён: +7 495 172 73 96"]),
        (10, "Запустить рекламу VK и Telegram", "Реклама", "not_started",
         ["Запустить после публикации", "Аудитория: жители ЖК Суханово Парк"]),
        (10, "Настроить цели Яндекс.Метрики", "Аналитика", "not_started",
         ["Клик по телефону, отправка формы, прокрутка 50/90%", "Counter: 104590290"]),
        (10, "Мобильная проверка лендинга", "QA", "not_started",
         ["Адаптивность iPhone/Android", "Скорость, кнопки, форма"]),
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

    # Seed projects and tasks if DB is empty
    async with async_session() as db:
        project_count = (await db.execute(select(Project))).scalars().all()
        if not project_count:
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
