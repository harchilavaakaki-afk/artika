# Artika — AI Marketing Analytics Platform

FastAPI + SQLite + React + TypeScript. 10 проектов (кадры, падел, курьеры).

## Стиль работы Claude
- **Кратко.** Минимум текста, максимум дела. Не повторять то, что пользователь уже знает.
- **Без пересказа.** Не описывать что сделал — показывать результат.
- **Параллельно.** Несколько API/agent вызовов одновременно, где возможно.
- **Память вместо контекста.** Справочные данные — в memory файлах, не перечитывать.
- **Не спрашивать лишнего.** Если ответ очевиден из контекста — делать.

## Старт сессии
1. `bash sync-memory.sh pull` (тихо)
2. Логин бэкенд → `POST https://artika.onrender.com/api/v1/auth/login` (admin@artika.ru / admin123)
3. Задачи + проекты → короткая сводка
4. "Что делаем?"

## Команды
| Cmd | Действие |
|-----|---------|
| `статус` | Сводка: проекты, задачи, токены |
| `утро` | `bash agents/morning-briefing.sh` |
| `задачи` | GET /api/v1/projects/1/tasks → по статусам |
| `кампании` | GET /api/v1/campaigns/ |
| `деплой` | git push (Render+Vercel auto) |
| `vk токен` | `bash agents/vk-token-refresh.sh` |
| `отчёт` | `bash agents/weekly-report.sh` |

## Где что
- Агенты: `agents/` (см. `agents/AGENTS.md`)
- Проекты, API, ключи: см. memory файлы (`project_artika.md`, `reference_artika_api.md`)
- Hooks: `~/.claude/settings.json` (Stop→sync, PostToolUse→deploy log)
- Бэкенд: `backend/app/` (api/, clients/, models/, services/)
- Фронтенд: `frontend/src/` (pages/, api/, store/)
- Локально: backend :8000, frontend :5173

## Известные ограничения
- Яндекс Директ: ожидаем одобрения (error 58)
- VK: ads.vk.com кабинет, myTarget API → 0 кампаний
- Chrome ext: держать минимум 1 вкладку
