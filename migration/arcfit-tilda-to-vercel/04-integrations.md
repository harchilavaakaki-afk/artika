# 04 — Интеграции (Метрика, формы, 1С, Calltouch, Telegram)

## 4.1 Яндекс.Метрика

### Текущая (на Tilda)
- Counter ID: **`95693874`**
- Опции: clickmap, trackLinks, accurateTrackBounce, webvisor, ymCms=tilda
- Подключение: вшито Tilda, инициализация setTimeout 2000мс

### После миграции (на Next.js)
Тот же счётчик, чтобы СОХРАНИТЬ историю визитов / целей / отчётов:

1. В Vercel env: `NEXT_PUBLIC_YM_ID=95693874`
2. Компонент `src/components/analytics/YandexMetrika.tsx` уже готов — подключается в `src/app/layout.tsx`
3. После переключения DNS — в Метрика Webmaster проверить, что счётчик начал получать хиты с нового движка (Tilda → Next.js)
4. **В настройках счётчика 95693874**: добавить домен `arcfit.ru` (он уже там) + при желании отметить событие «миграция платформы» аннотацией

### Цели (нужно повторить или импортировать)
Текущие цели на Tilda — посмотреть в Метрика → Счётчик 95693874 → Цели. Типовые:
- `form_send` (JS-event, отправка любой формы) — на Tilda триггер встроен
- `phone_click` (клик по тел.)
- `tg_click` (клик по Telegram)

В Next.js трекинг целей через `window.ym(95693874, 'reachGoal', 'goalName')`. Например в `/api/lead` после успешной отправки + в onClick тел/TG.

### JS-события для Next.js
Добавить в компоненты:

```tsx
// При клике на тел/TG/email
onClick={() => window.ym?.(95693874, 'reachGoal', 'phone_click')}
```

```tsx
// После успешной отправки формы
window.ym?.(95693874, 'reachGoal', 'form_send', { phone, name });
```

### Webvisor 2.0
Включён на Tilda. На Vercel-домене после переключения проверить что записи продолжаются:
- Метрика → Карты → Вебвизор → должны быть свежие записи с domain=arcfit.ru

## 4.2 Формы / лиды

### Текущая на Tilda (АКТУАЛЬНОЕ — подтверждено владельцем)

**Webhook URL (приёмник заявок):**
```
https://cloud.1c.fitness/api/hs/lead/Tilda/245e31f4-7c6c-4727-90c9-737e631cbf21
```

**CRM:**
- Bitrix24: `https://sport-vsegda.bitrix24.ru`

**Корпоративные email** (fallback / уведомления):
- `info@sport-vsegda.ru`
- `arktikafitness@sport-vsegda.ru`

Цепочка: Tilda-форма → 1C Fitness webhook → 1C CRM → Bitrix24 (через интеграцию) → Email уведомления менеджерам.

### После миграции на Next.js — ✅ РАБОТАЕТ (2026-05-04)

В коде `/api/lead/route.ts` (server-only):
- Принимает JSON `{name, phone, email?, program?}` от формы
- Преобразует в **Tilda-формат form-encoded** (`Name`, `Phone`, `Email`, `formid`, `formname`, `tranid`, `source`) — ключевой момент: 1C.Fitness ожидает именно этот payload, JSON отвечает 502
- Шлёт через `FITNESS_LEAD_WEBHOOK` env

Vercel env (✅ залит в production):
```
FITNESS_LEAD_WEBHOOK=https://cloud.1c.fitness/api/hs/lead/Tilda/245e31f4-7c6c-4727-90c9-737e631cbf21
```

Тот же endpoint, что использует Tilda — поэтому 1C.Fitness, Bitrix24 и email-уведомления продолжат работать без изменений на стороне CRM.

**Тест 2026-05-04** (после фикса form-encoded):
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"_DEPLOY_TEST_VERIFY_","phone":"+79990000001"}' \
  https://arcfit-next.vercel.app/api/lead
# → {"success":true,"tranid":"arcfit-next-1777889833881-wm4y7w"}
```
✅ Заявка дошла в 1C.Fitness → проброс в Bitrix24 + email.

⚠️ URL содержит секретный UUID в пути (`245e31f4-...`). Хранится только в **encrypted** env, не коммитится в код, не светится в client bundle (server-side only — в `/api/lead/route.ts` это соблюдено).

### Опционально — отдельный канал для Vercel
Если нужно различать «лиды с Tilda» и «лиды с Next.js» в 1C Fitness — попросить владельца завести **второй webhook UUID** в 1C Fitness админке (например `/lead/Vercel/<новый-UUID>`). Тогда:
- Tilda оставляет старый URL (для совместимости пока работает)
- Vercel получает новый — и в 1C видно «source = Vercel»

Если различать не нужно — использовать тот же URL.

### Поля формы
Сейчас в Next.js форма `ContactCTA` принимает `name` + `phone`. Если на Tilda есть дополнительные:
- Email
- Согласие на обработку ПД (чекбокс)
- Тип услуги (выбор программы)
- UTM-параметры (передать через скрытые поля)

— добавить в `/api/lead/route.ts` и в компонент.

### Защита от спама
- Honeypot-поле (скрытое для пользователя, бот заполнит)
- Rate-limit: на уровне Vercel Edge Function или внешнего сервиса
- Опционально reCAPTCHA / Yandex SmartCaptcha

## 4.3 1С Fitness API (онлайн-расписание)

### Если есть API доступ
Endpoint Tilda обычно дёргает `/getCourtSchedule` — то же поддерживается в `src/app/api/schedule/route.ts`:

```ts
const res = await fetch(`${apiUrl}/getCourtSchedule`, {
  method: 'POST',
  body: JSON.stringify({ APP_KEY: appKey, SECRET_KEY: secretKey }),
});
```

Env vars:
- `FITNESS_API_URL` — например `https://1c-cloud.ru/api/<account-slug>`
- `FITNESS_APP_KEY`
- `FITNESS_SECRET_KEY`

При наличии — расписание обновляется автоматически из 1С, не нужно еженедельных пушей в код.

### Если нет API доступа
Расписание статичное в `FALLBACK_SCHEDULE` массиве в коде. Обновление еженедельно через skill `arcfit-next-schedule` (PDF → код → push).

**TODO**: уточнить у владельца клуба — есть ли 1С Fitness API.

## 4.4 Calltouch / коллтрекинг

### На Tilda
Не подключён по результатам сканирования HTML.

### На Next.js
Если когда-то решат подключить — это:
- Скрипт `https://www.calltouch.ru/api/calltracking/init.js`
- Подмена номера телефона на странице
- Передача source/medium в Calltouch для отчётов

Шаблон есть у соседнего проекта Падел (см. `reference_calltouch_api.md`). Если нужно — добавить компонент `Calltouch.tsx` по аналогии с `YandexMetrika.tsx`.

## 4.5 Чат / онлайн-консультант

### Tilda
**TODO**: проверить есть ли чат-виджет (Jivo / TalkMe / Tidio / Cleversite) в Tilda HTML. По текущему сканированию — не нашёл, но проверить вручную.

### Next.js
Если был — добавить тот же скрипт виджета через компонент в `layout.tsx`.

## 4.6 Telegram-канал

Ссылки на t.me/arcfit на каждой странице — статические, мигрируются с кодом. Никакой бот-API не нужен (это не лид-форма, просто внешняя ссылка).

## 4.7 Карты (Yandex Maps embed)

В Next.js используется `<Map />` компонент. На Tilda — встроенный T-block с Yandex Maps. Координаты совпадают: `55.561548, 37.712605`.

После миграции проверить что карта рендерится корректно (нет ошибок API key).

## 4.8 Open Graph / соц.сети

При шаринге в TG/VK/WhatsApp нужны:
- `og:image` 1200×630px
- `og:title`, `og:description`
- `og:url` = canonical

В Next.js `metadata.openGraph` — настроено. Проверить через https://www.opengraph.xyz/url/https%3A%2F%2Farcfit.ru после миграции.

## 4.9 Поисковые консоли

### Yandex Webmaster
- Подтвердить владение `arcfit.ru` (если уже подтверждено для Tilda — после смены движка переподтвердить НЕ нужно, владение по DNS/HTML-meta сохраняется)
- В разделе «Переезд сайта» — НЕ использовать (это для смены домена, не движка)
- Sitemap: `https://arcfit.ru/sitemap.xml` (Next.js генерирует) — добавить в Webmaster

### Google Search Console
- То же самое — подтвердить если ещё нет, добавить sitemap

### Поисковый трафик первые 2-4 недели
Возможны кратковременные просадки трафика из-за переиндексации. Это нормально — поисковики обнаруживают новый HTML, мета-теги, структуру.

## 4.10 Что отключить после миграции

После успешного переключения — Tilda-сайт может работать в фоне ещё неделю-две на Vercel-домене напрямую (например `mysite.tilda.ws` — Tilda свой URL), пока не убедимся что всё стабильно. Потом:
- В Tilda → Project → отключить публикацию (или удалить проект если не нужен)
- В Tilda → Domains → отвязать `arcfit.ru` от Tilda-проекта (чтобы Tilda не пыталась его обслуживать)

Не отключать **сразу в день миграции** — нужен запас на rollback (см. 07).
