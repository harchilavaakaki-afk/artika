# 02 — Environment Variables в Vercel

Все переменные ставить в **Project Settings → Environment Variables → Production** (можно дублировать на Preview/Development если нужно тестировать).

Через API (Claude может сам, токен лежит в `~/.claude/secrets/vercel.env`):

```bash
source ~/.claude/secrets/vercel.env
curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/env?teamId=$VERCEL_TEAM_ID" \
  -d '{
    "key": "<KEY>",
    "value": "<VALUE>",
    "type": "encrypted",
    "target": ["production"]
  }'
```

## Список переменных

### Обязательные

| Key | Value (откуда взять) | Используется в | Public? |
|-----|----------------------|----------------|---------|
| `NEXT_PUBLIC_YM_ID` | `95693874` (взято с Tilda HTML, см. 00-current-state) | `src/components/analytics/YandexMetrika.tsx` | **public** (префикс `NEXT_PUBLIC_`) |
| `FITNESS_LEAD_WEBHOOK` | URL вебхука для отправки лидов. **TODO**: уточнить — Tilda сейчас отправляет через свой коннектор (TG бот / email / CRM); нам нужен или прямой URL TG-бота `https://api.telegram.org/bot<TOKEN>/sendMessage`, или Make.com/n8n webhook | `src/app/api/lead/route.ts` | encrypted |

### Опциональные (для живого расписания вместо fallback)

| Key | Value | Используется в | Public? |
|-----|-------|----------------|---------|
| `FITNESS_API_URL` | URL 1С Fitness API (например `https://1c-cloud.ru/api/<account>`) | `src/app/api/schedule/route.ts` | encrypted |
| `FITNESS_APP_KEY` | App key из 1C Fitness | `src/app/api/schedule/route.ts` | encrypted |
| `FITNESS_SECRET_KEY` | Secret key из 1C Fitness | `src/app/api/schedule/route.ts` | encrypted |

Если эти 3 не заданы — `/api/schedule` возвращает `FALLBACK_SCHEDULE` (статичное недельное расписание из кода). Это OK для запуска, но обновления потребуются раз в неделю через push в main.

### Дополнительно (при необходимости)

| Key | Value | Зачем |
|-----|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://arcfit.ru` | если в коде где-то нужен абсолютный URL для OG/canonical через env (сейчас в `SITE.url` хардкод — можно оставить) |
| `NEXT_PUBLIC_GTM_ID` | если используется Google Tag Manager | сейчас не используется — можно не ставить |
| `NEXT_PUBLIC_CALLTOUCH_SITE_ID` | если подключаем коллтрекинг | сейчас не подключён, см. `04-integrations.md` |
| `TELEGRAM_BOT_TOKEN` | если форма-лид шлёт напрямую в TG | альтернатива `FITNESS_LEAD_WEBHOOK` |
| `TELEGRAM_CHAT_ID` | ID чата куда лиды | парный к выше |

## Команда для скрипта-загрузки всех vars одним заходом

```bash
#!/bin/bash
source ~/.claude/secrets/vercel.env

set_env() {
  local key=$1
  local value=$2
  local type=${3:-encrypted}
  curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/env?teamId=$VERCEL_TEAM_ID" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"$type\",\"target\":[\"production\"]}" \
    | python -c "import sys,json; r=json.load(sys.stdin); print('OK' if 'created' in r else r)"
}

# Public (NEXT_PUBLIC_*) -> type=plain
set_env "NEXT_PUBLIC_YM_ID" "95693874" "plain"

# Encrypted
set_env "FITNESS_LEAD_WEBHOOK" "https://YOUR-WEBHOOK"
# set_env "FITNESS_API_URL" "https://..."
# set_env "FITNESS_APP_KEY" "..."
# set_env "FITNESS_SECRET_KEY" "..."
```

## Проверка после установки

```bash
source ~/.claude/secrets/vercel.env
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/env?teamId=$VERCEL_TEAM_ID" \
  | python -c "import sys,json; d=json.load(sys.stdin); [print(e['key'],e.get('target'),e.get('type')) for e in d.get('envs',[])]"
```

После любого изменения env — нужен **новый деплой**, иначе старые значения остаются в build. Достаточно пустого commit + push.

## Что НЕ класть в env

- VERCEL_TOKEN — это токен для управления Vercel, не нужен внутри билда
- Tilda-ключи (Project ID, Public/Secret Key) — больше не нужны после миграции
- Yandex OAuth токены — относятся к Директу/Метрике API, не к фронту
