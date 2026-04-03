# Artika — Агенты и ассистенты

## Уровень 1: Hooks (автоматически)

| Событие | Действие | Файл |
|---------|----------|------|
| Конец сессии (Stop) | `sync-memory.sh push` → сохранить память в GitHub | settings.json |
| После `git push` (PostToolUse) | Логировать начало деплоя | settings.json |

Настроены в: `~/.claude/settings.json`

---

## Уровень 2: Scheduled Agents (по расписанию)

Настраиваются через Windows Task Scheduler или `/schedule` в Claude Code.

| Агент | Расписание | Скрипт |
|-------|------------|--------|
| Утренний брифинг | 9:00 каждый день | `agents/morning-briefing.sh` |
| VK Token Refresh | Каждые 23 часа | `agents/vk-token-refresh.sh` |
| Еженедельный отчёт | Пятница 18:00 | `agents/weekly-report.sh` |

Для настройки на Windows (PowerShell):
```powershell
# Утренний брифинг в 9:00
$action = New-ScheduledTaskAction -Execute "bash" -Argument '"C:/Users/harch/OneDrive/Рабочий стол/cloude/Artika/agents/morning-briefing.sh"'
$trigger = New-ScheduledTaskTrigger -Daily -At "09:00"
Register-ScheduledTask -TaskName "Artika Morning Briefing" -Action $action -Trigger $trigger

# VK Token Refresh каждые 23 часа
$action2 = New-ScheduledTaskAction -Execute "bash" -Argument '"C:/Users/harch/OneDrive/Рабочий стол/cloude/Artika/agents/vk-token-refresh.sh"'
$trigger2 = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 23) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "Artika VK Token Refresh" -Action $action2 -Trigger $trigger2
```

---

## Уровень 3: Субагенты (Claude запускает параллельно)

Когда прошу сложный анализ, Claude запускает несколько агентов одновременно:

**Analytics Agent** — запрашивает Яндекс Метрику по всем 10 проектам
**Campaign Agent** — проверяет кампании VK + Яндекс Директ
**Deploy Agent** — мониторит статус Vercel + Render

Я (Claude) вызываю их автоматически через `Agent tool` когда нужно.

---

## Уровень 4: Команды менеджера проекта

Пиши мне напрямую:

| Команда | Что делает |
|---------|-----------|
| `статус` | Полная сводка всех проектов, задач, токенов |
| `утро` | Утренний брифинг (задачи, метрики, токены) |
| `задачи` | Показать все задачи по статусам |
| `метрика [проект]` | Получить данные Яндекс Метрики |
| `кампании` | Статус всех рекламных кампаний |
| `деплой` | Git push + проверить Render/Vercel |
| `vk токен` | Обновить VK Access Token |
| `отчёт` | Сгенерировать еженедельный отчёт |
| `новый сайт` | Чеклист создания нового лэндинга |
| `приложение` | Открыть фронтенд Artika |

---

## Уровень 5: MCP интеграции (уже подключены)

| Инструмент | Для чего использую |
|-----------|-------------------|
| **Vercel MCP** | Статус деплоев, логи билда, runtime logs |
| **Slack MCP** | Отправка статусов команде, поиск обсуждений |
| **Gmail MCP** | Чтение писем клиентов, черновики ответов |
| **Figma MCP** | Просмотр дизайнов, экспорт ассетов |
| **PostHog MCP** | Аналитика поведения пользователей |

---

## Субагенты Claude — как работают

Claude автоматически запускает параллельных агентов для:

```
Ты: "покажи статус всех 10 проектов с метриками"

Claude запускает параллельно:
├── Agent 1: Метрика проекты 1-5 (Яндекс API)
├── Agent 2: Метрика проекты 6-10 (Яндекс API)
├── Agent 3: VK кампании (VK Ads API)
└── Agent 4: Яндекс Директ кампании

→ Результат за 10 сек вместо 40 сек
```

---

## Диагностика

Если что-то не работает:
```bash
# Быстрая проверка всех систем
bash agents/status-check.sh

# Проверить memory sync
bash sync-memory.sh pull

# Обновить VK токен вручную
bash agents/vk-token-refresh.sh
```
