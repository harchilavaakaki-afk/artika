# 09 — Пакет развертывания (готов к выкатке)

Этот документ — точка входа для тех, кто разворачивает arcfit.ru на новом домене. Здесь собрано **всё**, что нужно: код, ассеты, env, скрипт, чек-лист. Если ты только что открыл папку — читай этот файл первым после `README.md`.

## TL;DR за 30 секунд

1. Код Next.js — в `atktika-fitness/` (родительская папка репо)
2. Все необходимые env vars — в `.env.production.example`
3. Скрипт автоматического деплоя — `deploy.ps1` (Windows) / `deploy.sh` (macOS/Linux)
4. Точные DNS-записи — `01-dns-records.md`
5. План переключения — `06-cutover-plan.md`

## Что уже сделано (✅ зелёные пункты)

| Пункт | Статус | Комментарий |
|---|---|---|
| Next.js приложение собирается на Vercel | ✅ | https://arcfit-next.vercel.app — текущий URL до миграции |
| Vercel project ID, Team ID | ✅ | `prj_zRNjCcSmbjbN8DN8j7RVy61lWkt6`, `team_bv0ra66xYqGMg6DsNOMuoUpm` |
| rootDirectory = `atktika-fitness` | ✅ | Применено через API |
| Yandex.Metrika 95693874 встроена в SSR `<head>` | ✅ | env `NEXT_PUBLIC_YM_ID=95693874` залит в Vercel |
| Лид-форма `/api/lead` отправляет в 1C.Fitness | ✅ | env `FITNESS_LEAD_WEBHOOK=https://cloud.1c.fitness/api/hs/lead/Tilda/<UUID>` залит, тестовая заявка прошла (`success: true, tranid: arcfit-next-...`) |
| Цели Метрики (form_send, phone_click, tg_click) | ✅ | Реализованы через `src/lib/metrika.ts` + `TrackedLink` |
| SEO: titles/descriptions под Wordstat | ✅ | См. `reference_arcfit_wordstat_2026_05_04.md` (фитнес видное 3260, фитнес клуб видное 791, и т.д.) |
| Schema.org | ✅ | SportsActivityLocation, Service (areaServed=Видное), Person (тренеры), BreadcrumbList, FAQPage, BlogPosting |
| sitemap.xml — 48 URL | ✅ | `https://arcfit.ru/sitemap.xml` (генерируется) |
| robots.txt | ✅ | Все боты разрешены, AI-боты явно открыты |
| Расписание | ✅ | FALLBACK_SCHEDULE на текущую неделю в коде; обновляется skill `arcfit-next-schedule` |
| Hero видео + видео в карточках | ✅ | `hero-bg.mp4`, `videos/fitball.mp4`, `videos/lady-style.mp4`, `videos/hero-girl.mp4` |
| 133 визуальных ассета | ✅ | См. `assets-inventory.md` |

## Что нужно сделать перед/во время cutover

| Пункт | Статус | Где документировано |
|---|---|---|
| Решение по дате/окну переключения | ⬜ | `06-cutover-plan.md` |
| Доступ к DNS nic.ru | ⬜ | `01-dns-records.md` |
| Снижение TTL DNS до 300 сек за 24 часа | ⬜ | `01-dns-records.md` |
| Бэкап текущей DNS-зоны | ⬜ | `01-dns-records.md` |
| Добавить домен `arcfit.ru` в Vercel | ⬜ | `06-cutover-plan.md` шаг T-0 |
| Заменить A-record `185.215.4.30` → `76.76.21.21` | ⬜ | `01-dns-records.md` |
| 301-редиректы со старых Tilda URL | ⬜ | `05-seo-redirects.md` |
| Контент-аудит главной страницы относительно текущей Tilda | ⬜ | `03-content-checklist.md` |
| Я.Вебмастер sitemap (после миграции) | ⬜ | `08-post-migration.md` |
| Цели в Метрике (form_send, phone_click, tg_click) | ⬜ | Создать в Metrika UI: Цели → JavaScript-событие |

## Структура кода — что где

```
atktika-fitness/                      ← root для Vercel build
├── package.json                      ← Next.js 16.2.3, deps lock'd
├── next.config.ts                    ← Image remotePatterns; redirects здесь добавлять
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs                ← Tailwind v4
├── public/                           ← 37 MB ассетов (133 файла)
│   ├── images/hero/hero-bg.mp4       ← фон главной
│   ├── images/hero/hero-girl.png
│   ├── images/programs/*.jpg         ← 11 программ
│   ├── images/trainers/*.jpg         ← 9 тренеров
│   ├── images/facilities/*.jpg       ← 6 залов
│   ├── images/gallery/*.jpg          ← галерея студии
│   ├── videos/fitball.mp4            ← видео карточки фитбола
│   ├── videos/lady-style.mp4         ← видео карточки леди-стиль
│   ├── videos/hero-girl.mp4          ← запасное видео hero
│   ├── icons/                        ← SVG иконки программ + UI
│   ├── og-image.png                  ← OG для соц.сетей
│   └── apple-touch-icon.png, favicon-32x32.png
├── src/
│   ├── app/                          ← Next.js App Router (15 страниц)
│   │   ├── layout.tsx                ← <head> с Метрикой, OG, мета-шаблоны
│   │   ├── page.tsx                  ← главная: hero + WhyUs + Programs + ...
│   │   ├── schedule/page.tsx         ← расписание + ScheduleView
│   │   ├── pricing/page.tsx
│   │   ├── trainers/page.tsx + [slug]/
│   │   ├── programs/page.tsx + [slug]/
│   │   ├── facilities/page.tsx + [slug]/
│   │   ├── blog/page.tsx + [slug]/
│   │   ├── contacts/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── api/schedule/route.ts     ← FALLBACK_SCHEDULE + опц. 1C API
│   │   ├── api/lead/route.ts         ← form-encoded → cloud.1c.fitness
│   │   ├── sitemap.ts                ← авто-генерация 48 URL
│   │   └── robots.ts                 ← открыто для всех + AI-боты
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── YandexMetrika.tsx     ← дублирующая клиентская инициация
│   │   │   └── TrackedLink.tsx       ← <a> с reachGoal
│   │   ├── seo/
│   │   │   └── BreadcrumbSchema.tsx  ← BreadcrumbList JSON-LD
│   │   ├── layout/Header.tsx, Footer.tsx
│   │   ├── sections/Hero.tsx, Programs.tsx, ContactCTA.tsx, ...
│   │   └── ui/Breadcrumbs.tsx, StickyCTA.tsx
│   ├── content/blog/*.mdx            ← 4 статьи блога
│   └── lib/
│       ├── constants.ts              ← SITE, PROGRAMS, TRAINERS, FACILITIES (источник истины)
│       ├── program-content.ts        ← расширенные тексты + FAQ
│       ├── trainer-content.ts        ← bio тренеров
│       ├── facility-content.ts       ← описания залов
│       ├── blog.ts                   ← MDX парсер
│       ├── metrika.ts                ← reachGoal helper
│       └── api.ts
└── .vercel/project.json              ← linked: prj_zRNjCcSmbjbN8DN8j7RVy61lWkt6
```

## Окружения

### Production (Vercel)
- Vercel project: `arcfit-next` (prj_zRNjCcSmbjbN8DN8j7RVy61lWkt6)
- Branch для auto-deploy: `main`
- Environment variables — см. `.env.production.example`
- Все vars **уже залиты** в Vercel через API; для нового деплоя достаточно `git push origin <branch>:main`

### Локальный dev
```bash
cd atktika-fitness
cp ../migration/arcfit-tilda-to-vercel/.env.production.example .env.local
# отредактируй .env.local если нужно (для local dev можно оставить как есть, но webhook будет работать в production-канал)
npm install
npm run dev    # http://localhost:3000
```

## Как развернуть на новый домен

См. `06-cutover-plan.md`. Кратко:

1. **Подготовка (T-7 дней)** — пройти чек-листы из `03-content-checklist.md`
2. **T-24 ч** — снизить TTL DNS до 300, бэкап зоны
3. **T-0** — добавить `arcfit.ru` в Vercel (`deploy.ps1` или вручную) → получить TXT для верификации → прописать в nic.ru → дождаться verified → заменить A-record + CNAME www
4. **T+5 мин** — `nslookup arcfit.ru` (должен быть `76.76.21.21`)
5. **T+15 мин** — функциональная проверка (см. `06-cutover-plan.md`)

Скрипт **`deploy.ps1`** автоматизирует шаги Vercel API. Он НЕ меняет DNS — это всё равно нужно делать вручную в nic.ru (см. `01-dns-records.md`).

## Если что-то сломалось — `07-rollback-plan.md`

Краткое: меняешь A-record обратно на `185.215.4.30` (Tilda), TTL=300, через 5-15 мин старый сайт снова виден.

## Контактные точки в коде (если нужно поменять)

- Адрес/телефон: `atktika-fitness/src/lib/constants.ts` → `SITE`
- Цены: `atktika-fitness/src/app/pricing/page.tsx` → `plans`
- Расписание: `atktika-fitness/src/app/api/schedule/route.ts` → `FALLBACK_SCHEDULE` (или подключить 1C API через env)
- Тексты программ: `atktika-fitness/src/lib/program-content.ts`
- Bio тренеров: `atktika-fitness/src/lib/trainer-content.ts`
