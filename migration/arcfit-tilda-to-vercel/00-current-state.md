# 00 — Снимок текущего состояния

Дата: **2026-05-04**

## Домен и DNS

| Параметр | Значение |
|---|---|
| Домен | `arcfit.ru` |
| Регистратор | RU-CENTER (nic.ru) |
| NS | `ns3-l2.nic.ru`, `ns4-l2.nic.ru`, `ns8-l2.nic.ru`, `ns4-cloud.nic.ru`, `ns8-cloud.nic.ru` |
| A `arcfit.ru` | `185.215.4.30` (Tilda) |
| MX | **TODO** проверить (если есть почта @arcfit.ru) |
| TXT (SPF/DKIM/DMARC) | **TODO** проверить |

## Tilda (текущий прод)

| Параметр | Значение |
|---|---|
| URL | https://arcfit.ru/ |
| Tilda Project ID | `8067531` |
| Tilda Public Key | `z4hz8yjayrase170rndg` |
| Tilda Secret Key | `e99c7db3f3c7d61442a2` |
| Главная страница | pageid `41059101` |
| ZB сетка расписания | `rec663851841` (recid `663851841`) |
| ZB заголовок+кнопка PDF | `rec663851839` |
| Yandex.Metrika ID на Tilda | **`95693874`** (clickmap, trackLinks, accurateTrackBounce, webvisor, ymCms=tilda) |

Источник истины расписания на Tilda — PDF из Telegram, обновляется еженедельно (см. skill `arcfit-schedule`).

## Vercel (будущий прод)

| Параметр | Значение |
|---|---|
| URL сейчас | https://arcfit-next.vercel.app |
| Vercel project ID | `prj_zRNjCcSmbjbN8DN8j7RVy61lWkt6` |
| Team ID | `team_bv0ra66xYqGMg6DsNOMuoUpm` |
| Repo | github.com/harchilavaakaki-afk/artika |
| rootDirectory | `atktika-fitness` |
| Production branch | `main` |
| Vercel API token | `~/.claude/secrets/vercel.env` |
| Текущие домены | только `arcfit-next.vercel.app` |

## Что встроено в код Next.js (готово к проду)

- ✅ Schema.org SportsActivityLocation на главной с реальным адресом, GEO, hours
- ✅ Canonical = `SITE.url` = `https://arcfit.ru` (см. `src/lib/constants.ts`)
- ✅ `YandexMetrika` компонент через `NEXT_PUBLIC_YM_ID` (см. `src/components/analytics/YandexMetrika.tsx`)
- ✅ `/api/lead` POST → `FITNESS_LEAD_WEBHOOK` env (см. `src/app/api/lead/route.ts`)
- ✅ `/api/schedule` с fallback и опциональным API через `FITNESS_API_URL`/`FITNESS_APP_KEY`/`FITNESS_SECRET_KEY`
- ✅ `/sitemap.xml`, `/robots.txt` авто-генерируются
- ✅ OG-теги, мета-описания на всех страницах
- ✅ Pages: `/`, `/schedule`, `/pricing`, `/trainers/[slug]`, `/facilities/[slug]`, `/programs/[slug]`, `/blog/[slug]`, `/contacts`, `/privacy`

## Что в коде НЕ настроено (нужно для миграции)

- ❌ `next.config.ts` — нет `redirects()` для 301 со старых Tilda URL
- ❌ `next.config.ts` — нет `headers()` (security headers, CSP)
- ❌ Trust phone formats — на Tilda был чат-виджет / онлайн-консультант (нужно проверить)
- ❌ Calltouch / коллтрекинг — не подключён (если был на Tilda — узнать)
- ❌ pixel VK / других рекламных сетей если использовались
- ❌ Cookie-уведомление (152-ФЗ требует) — проверить наличие на Tilda и в Next.js

## Связанная инфраструктура

- ООО АктивСпорт, ИНН 7704312680, ОГРН 1157746315385 — для футера и /privacy
- Бренд-бук: Unbounded + Inter, цвета teal/cyan/lime/коралл (см. `reference_arcfit_brandbook.md`)
- Telegram канал: https://t.me/arcfit
- Адрес: г. Видное, Зелёный пер., 10
- Телефоны: +7 925 088 9196 (общий), +7 936 142 3841 (продажи)

## TODO до начала миграции

1. Узнать MX/SPF/DKIM `arcfit.ru` (почта @arcfit.ru?)
2. Узнать webhook URL текущей Tilda-формы (куда летят заявки сейчас)
3. Узнать есть ли 1С Fitness API доступ для живого расписания
4. Узнать есть ли Calltouch
5. Сравнить URL-структуру Tilda и Next.js — нужны ли 301-редиректы
