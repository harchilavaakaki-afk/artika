# Artika — AI Marketing Analytics Platform

## Старт сессии
При начале каждой сессии Claude ОБЯЗАН сразу:
1. Залогиниться в бэкенд (`POST https://artika.onrender.com/api/v1/auth/login`)
2. Получить проекты + задачи + кампании
3. Показать короткую сводку пользователю
4. Спросить "Что делаем?"

Пользователь может написать **"статус"** — Claude покажет текущее состояние всех проектов.

## Работа с любого устройства (дом / офис / телефон)

### Приложение уже в продакшне:
- **Фронтенд**: https://frontend-rho-five-49.vercel.app
- **Бэкенд API**: https://artika.onrender.com
- **Логин**: admin@artika.ru / admin123

### Если пользователь написал **"приложение"**:
Claude открывает https://frontend-rho-five-49.vercel.app и показывает статус.

### Настройка на новом устройстве (один раз):
```bash
# 1. Клонировать репо
git clone https://github.com/harchilavaakaki-afk/artika.git
cd artika

# 2. Загрузить память Claude из облака
bash sync-memory.sh pull

# 3. Установить зависимости (если нужна разработка)
cd frontend && npm install && cd ..
cd backend && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt && cd ..
```

### Сохранить память в конце сессии:
```bash
bash sync-memory.sh push
```

### Память Claude хранится в приватном GitHub репо:
https://github.com/harchilavaakaki-afk/artika-memory (приватный)

### Запуск локально (если нужна разработка):
```bash
# Бэкенд (терминал 1)
cd backend && .venv/Scripts/uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload

# Фронтенд (терминал 2)
cd frontend && npm run dev
```

### Деплой изменений:
```bash
git add -A && git commit -m "описание" && git push
# Render и Vercel подхватывают автоматически
```

## Что это
Система аналитики и автоматизации рекламы для нескольких сайтов/проектов.
Стек: FastAPI + SQLite + React + TypeScript.

## Как запускать

### Бэкенд
```
cd backend
.venv/Scripts/uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Фронтенд
```
cd frontend
npm run dev
```

Или через `.claude/launch.json` — `preview_start name=backend` и `preview_start name=frontend`.

## Auth
- URL: `http://localhost:8000`
- Email: `admin@artika.ru`
- Password: `admin123`
- Логин: `curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@artika.ru","password":"admin123"}'`

## Проекты (10 штук)

| ID | Название | Домен | Метрика | Вебмастер |
|----|----------|-------|---------|-----------|
| 1 | y-2work.ru | y-2work.ru | 106573383 | https:y-2work.ru:443 |
| 2 | Падел Центр | padelvidnoe.ru | 104590290 | — |
| 3 | ПКР Партнер | pkrpartner.ru | — | https:pkrpartner.ru:443 |
| 4 | Лента Работа | lentarabotapartner.ru | 103593183 | https:lentarabotapartner.ru:443 |
| 5 | Мир Кадров | worldofstaff.ru | 106228168 | https:worldofstaff.ru:443 |
| 6 | ПКР Лента | y-prk.ru | 104641748 | — |
| 7 | ПКР Самокат | kurierps-samokatpartner.ru | 106870736 | https:kurierps-samokatpartner.ru:443 |
| 8 | Туворк Самокат | 2workpartner.ru | 106871416 | — |
| 9 | 2work Partner | 2workpartner.ru | — | https:2workpartner.ru:443 |
| 10 | y-prk.ru | y-prk.ru | — | https:y-prk.ru:443 |

## API ключи (в backend/.env)

| Сервис | Переменная | Статус |
|--------|-----------|--------|
| Яндекс OAuth | YANDEX_OAUTH_TOKEN | ✅ Работает |
| Яндекс Метрика counter | YANDEX_METRIKA_COUNTER_ID=104590290 | ✅ |
| Яндекс Вебмастер host | YANDEX_WEBMASTER_HOST_ID | ✅ |
| Яндекс Директ | — | ⏳ Заявка отправлена (app: 6403e4add4594584a94030e97f06848a) |
| VK Ads access token | VK_ADS_ACCESS_TOKEN | ✅ Expires 24h, обновляется через client_credentials |
| VK client_id | VK_ADS_CLIENT_ID=UJymkmckkxMvK0zs | ✅ |
| VK client_secret | VK_ADS_CLIENT_SECRET | ✅ |

## VK токен (истекает каждые 24 часа!)

Для обновления токена VK:
```bash
curl -s -X POST "https://target.my.com/api/v2/oauth2/token.json" \
  -d "grant_type=client_credentials&client_id=UJymkmckkxMvK0zs&client_secret=$(grep VK_ADS_CLIENT_SECRET backend/.env | cut -d= -f2)"
```
Ответ содержит новый `access_token` — записать в `.env` как `VK_ADS_ACCESS_TOKEN=`.

## Яндекс Логин
- Логин: `h.akaky`
- Яндекс Директ тестовая заявка: client_id `6403e4add4594584a94030e97f06848a`, статус "одобрена"

## Архитектура

```
backend/app/
  api/          # FastAPI роутеры
  clients/      # HTTP клиенты (yandex_direct, yandex_metrika, yandex_webmaster, vk_ads)
  models/       # SQLAlchemy модели
  services/     # sync_service.py — основная синхронизация данных
  config.py     # Настройки из .env
frontend/src/
  pages/        # DashboardPage, CampaignsPage, SettingsPage...
  api/          # endpoints.ts, client.ts
  store/        # Zustand stores
```

## Как работать со мной (Claude)

1. **Держи вкладки Chrome открытыми** — когда закрываешь все вкладки, расширение теряет соединение
2. **Серверы**: бэкенд на 8000, фронтенд на 5173 — запускай через терминал или `preview_start`
3. **Изменения в коде** — я сам перезапускаю через hot reload
4. **Скриншоты** — присылай напрямую в чат, я их вижу
5. **Токены** — VK токен истекает каждые 24 часа, напомни мне обновить если что-то не работает

## Известные проблемы

- Яндекс Директ error 58 → ожидаем одобрения новой заявки
- Chrome extension теряет соединение при закрытии всех вкладок → держи хотя бы одну
- VK Реклама: кампании в новом кабинете ads.vk.com, API возвращает 0 (нет кампаний через старый myTarget API)
