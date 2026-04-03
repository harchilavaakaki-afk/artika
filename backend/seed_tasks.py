"""Seed project tasks into the database."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select, text
from app.db.session import async_session, engine
from app.models.base import Base
from app.models.project_task import ProjectTask


# project_id=None means "Artika platform" general tasks
# project_id=2 means "Падел Центр"

TASKS = [
    # === ARTIKA PLATFORM (project_id will be set to first project or None) ===
    # Ядро
    {"project_id": None, "title": "Авторизация", "description": "JWT + OAuth, логин/регистрация, защита роутов", "status": "done", "category": "Ядро платформы", "sort_order": 1},
    {"project_id": None, "title": "Мультипроект", "description": "10 сайтов, выбор проекта в интерфейсе", "status": "done", "category": "Ядро платформы", "sort_order": 2},
    {"project_id": None, "title": "Настройки", "description": "Управление токенами 4 сервисов", "status": "done", "category": "Ядро платформы", "sort_order": 3},
    {"project_id": None, "title": "Синхронизация данных", "description": "APScheduler, ручной триггер, автообновление 5 мин", "status": "done", "category": "Ядро платформы", "sort_order": 4},

    # Дашборд
    {"project_id": None, "title": "Главный дашборд", "description": "KPI-карточки, статусы подключений, карточки платформ", "status": "done", "category": "Дашборд и аналитика", "sort_order": 10},
    {"project_id": None, "title": "Яндекс Метрика", "description": "5 вкладок: Обзор, Источники, Аудитория, Контент, Цели", "status": "done", "category": "Дашборд и аналитика", "sort_order": 11},
    {"project_id": None, "title": "Яндекс Вебмастер", "description": "4 вкладки: Запросы, Диагностика, Переобход, Сайтмапы", "status": "done", "category": "Дашборд и аналитика", "sort_order": 12},

    # Реклама
    {"project_id": None, "title": "Яндекс Директ", "description": "UI готов: список кампаний, создание, вкл/выкл, группы объявлений", "status": "partial", "category": "Рекламные платформы", "details": ["API error 58 — заявка одобрена, ждём активации", "Данные из Директ не загружаются пока API не активирован"], "sort_order": 20},
    {"project_id": None, "title": "Кампании (общий вид)", "description": "Агрегированная таблица всех кампаний с навигацией", "status": "done", "category": "Рекламные платформы", "sort_order": 21},
    {"project_id": None, "title": "Детали кампании", "description": "3 вкладки: Статистика, Ключевые слова, Группы объявлений", "status": "done", "category": "Рекламные платформы", "sort_order": 22},
    {"project_id": None, "title": "Ключевые слова", "description": "Таблица с поиском, ставки, статусы", "status": "done", "category": "Рекламные платформы", "sort_order": 23},
    {"project_id": None, "title": "VK Реклама", "description": "OAuth, CRUD кампаний, группы, баннеры, привязка к проектам", "status": "done", "category": "Рекламные платформы", "sort_order": 24},

    # AI
    {"project_id": None, "title": "AI Insights (Claude)", "description": "Анализ эффективности, ключевых слов, генерация вариантов объявлений", "status": "done", "category": "AI", "sort_order": 30},

    # A/B
    {"project_id": None, "title": "A/B тесты", "description": "UI форма создания теста есть (30%)", "status": "partial", "category": "A/B тесты", "details": ["Нет бэкенда — нет API эндпоинтов /ab-tests", "Нет сохранения — тесты не пишутся в БД", "Нет результатов — нет трекинга и статанализа", "Кнопка создания не работает — нет мутации"], "sort_order": 40},

    # Соцсети
    {"project_id": None, "title": "Telegram Ads", "description": "Страница-заглушка, нет API, нет функционала", "status": "not_started", "category": "Соцсети", "sort_order": 50},
    {"project_id": None, "title": "Instagram", "description": "Страница-заглушка, нет API, нет функционала", "status": "not_started", "category": "Соцсети", "sort_order": 51},

    # Медиа
    {"project_id": None, "title": "Генерация контента (Gemini)", "description": "API ключ есть, интеграция не сделана", "status": "not_started", "category": "Медиа-центр / Контент", "sort_order": 60},
    {"project_id": None, "title": "Генерация баннеров", "description": "Создание изображений для рекламы — не начато", "status": "not_started", "category": "Медиа-центр / Контент", "sort_order": 61},
    {"project_id": None, "title": "Медиа-библиотека", "description": "Хранение и управление ассетами — не начато", "status": "not_started", "category": "Медиа-центр / Контент", "sort_order": 62},

    # Автоматизация
    {"project_id": None, "title": "Автооптимизация ставок", "description": "Рекомендации по bid strategy — не начато", "status": "not_started", "category": "Автоматизация", "sort_order": 70},

    # Баги (as tasks with status=bug on platform level)
    {"project_id": None, "title": "Яндекс Директ API error 58", "description": "Заявка одобрена, ждём активации", "status": "bug", "category": "Баги / Ограничения", "sort_order": 90},
    {"project_id": None, "title": "VK токен истекает каждые 24ч", "description": "Нужно обновлять через client_credentials", "status": "bug", "category": "Баги / Ограничения", "sort_order": 91},
    {"project_id": None, "title": "VK API — кампании возвращают 0", "description": "Новый кабинет ads.vk.com, старый myTarget API не видит", "status": "bug", "category": "Баги / Ограничения", "sort_order": 92},
    {"project_id": None, "title": "Chrome extension теряет соединение", "description": "Держать хотя бы одну вкладку открытой", "status": "bug", "category": "Баги / Ограничения", "sort_order": 93},
    {"project_id": None, "title": "Токены в БД не зашифрованы", "description": "settings.py — нужен Fernet", "status": "bug", "category": "Баги / Ограничения", "sort_order": 94},

    # === ПАДЕЛ ЦЕНТР (project_id=2) ===
    {"project_id": 2, "title": "Лендинг /family-day", "description": "HTML/CSS готов, конверсионная структура собрана", "status": "partial", "category": "Семейный день · 11 апреля", "details": ["Нет фотографий — ждём генерацию", "Placeholder-телефон — нужен реальный номер", "Форма записи без бэкенда", '"Осталось 24 места" — нужна реальная цифра'], "sort_order": 1},
    {"project_id": 2, "title": "Посты для соцсетей", "description": "Готовы тексты для VK, Telegram, Instagram + сторис", "status": "done", "category": "Семейный день · 11 апреля", "sort_order": 2},
    {"project_id": 2, "title": "Рекламные тексты и таргетинг", "description": "VK Ads: 3 варианта объявлений, таргетинг, бюджет 16 800₽", "status": "done", "category": "Семейный день · 11 апреля", "sort_order": 3},
    {"project_id": 2, "title": "Фото/баннеры", "description": "Герой-баннер 1920x800, VK баннер 1080x1080, сторис 1080x1920", "status": "not_started", "category": "Семейный день · 11 апреля", "details": ["Промпты готовы — нужно сгенерировать"], "sort_order": 4},
    {"project_id": 2, "title": "Бэкенд формы записи", "description": "Telegram-бот / Google Forms / email", "status": "not_started", "category": "Семейный день · 11 апреля", "sort_order": 5},
    {"project_id": 2, "title": "Телефон для записи", "description": "Два номера: +7 495 172 73 65 и +7 495 004 60 00 — какой использовать?", "status": "not_started", "category": "Блокеры (нужно от клиента)", "sort_order": 10},
    {"project_id": 2, "title": "Проверить название ЖК", "description": "Сухарево или Суханово Парк — уточнить", "status": "not_started", "category": "Блокеры (нужно от клиента)", "sort_order": 11},
    {"project_id": 2, "title": "Подтвердить дату", "description": "11 апреля — пятница, рабочий день, 14:00", "status": "not_started", "category": "Блокеры (нужно от клиента)", "sort_order": 12},
    {"project_id": 2, "title": "Домен для рекламы", "description": "padel-site1.netlify.app — технический. Нужен нормальный", "status": "not_started", "category": "Блокеры (нужно от клиента)", "sort_order": 13},
    {"project_id": 2, "title": "Цели Яндекс.Метрики", "description": "Клик телефон, клик TG, отправка формы, скролл", "status": "not_started", "category": "Финализация", "sort_order": 20},
    {"project_id": 2, "title": "UTM-метки", "description": "Добавить UTM во все ссылки", "status": "not_started", "category": "Финализация", "sort_order": 21},
    {"project_id": 2, "title": "Финальная проверка на мобилке", "description": "Sticky CTA, адаптивность, скорость", "status": "not_started", "category": "Финализация", "sort_order": 22},
    {"project_id": 2, "title": "Публикация лендинга", "description": "Деплой на Netlify", "status": "not_started", "category": "Запуск", "sort_order": 30},
    {"project_id": 2, "title": "Публикация постов", "description": "VK + Telegram + Instagram по расписанию", "status": "not_started", "category": "Запуск", "sort_order": 31},
    {"project_id": 2, "title": "Запуск VK Ads", "description": "Гео ЖК + ретаргетинг, бюджет 16 800₽", "status": "not_started", "category": "Запуск", "sort_order": 32},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(ProjectTask).limit(1))
        if result.scalar_one_or_none():
            print("Tasks already seeded, skipping.")
            return

        # Find first project for Artika platform tasks
        first_project_result = await db.execute(text("SELECT id FROM projects ORDER BY id LIMIT 1"))
        first_project = first_project_result.scalar_one_or_none()

        for t in TASKS:
            pid = t["project_id"]
            if pid is None and first_project:
                pid = first_project
            task = ProjectTask(
                project_id=pid,
                title=t["title"],
                description=t.get("description"),
                status=t["status"],
                category=t.get("category"),
                details=t.get("details"),
                sort_order=t.get("sort_order", 0),
            )
            db.add(task)

        await db.commit()
        print(f"Seeded {len(TASKS)} tasks successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
