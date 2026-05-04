# STATUS — что готово, что осталось (на 2026-05-04)

## ✅ Сделано (можно ничего не делать)

### Код Next.js
- [x] Папка переименована `atktika fitness` → `atktika-fitness` (Vercel function names не разрешают пробелы)
- [x] Vercel `rootDirectory` = `atktika-fitness` (через PATCH API)
- [x] GitHub auto-deploy на push в `main` работает: rebuild ~40 сек, ~134 файла билдится
- [x] Все 4 видео-ассета попадают в git (через exception в `.gitignore` для mp4)

### Аналитика и трекинг
- [x] **Yandex.Metrika 95693874** инициализируется в SSR `<head>` (`src/app/layout.tsx`) — виден поисковиками
- [x] Env `NEXT_PUBLIC_YM_ID=95693874` залит в Vercel (production+preview+development)
- [x] Helper `src/lib/metrika.ts` (`reachGoal`) — без хардкода ID
- [x] Цели срабатывают:
    - `form_send` → ContactCTA после успешной отправки формы
    - `phone_click` → 3 кнопки в Header + кнопка в Footer (с `source` параметром)
    - `tg_click` → кнопка Telegram в Footer

### Лид-форма
- [x] `/api/lead` отправляет в **1C.Fitness** webhook `https://cloud.1c.fitness/api/hs/lead/Tilda/<UUID>`
- [x] Формат payload — Tilda-style `application/x-www-form-urlencoded` (Name, Phone, Email, formid, formname, **tranid**, source)
- [x] Тестовый POST → `{"success":true,"tranid":"arcfit-next-..."}` — заявка дошла
- [x] Env `FITNESS_LEAD_WEBHOOK` залит в Vercel (encrypted, production)
- [x] Поток: 1C.Fitness CRM → Bitrix24 sport-vsegda.bitrix24.ru → email уведомления info@/arktikafitness@sport-vsegda.ru

### SEO — мета и контент
- [x] **Title под Wordstat**: «фитнес-клуб» (791/мес) вместо «фитнес-студия» (32/мес) везде, кроме брендовых упоминаний
- [x] Каждая страница (/, /pricing, /schedule, /programs, /facilities, /trainers) имеет уникальный title без дублей
- [x] Description упоминает адрес «Зелёный пер., 10» для гео-релевантности
- [x] /pricing title: «Фитнес Видное — цены и абонементы» (под 179+99+51)
- [x] /schedule, /programs, /facilities, /trainers — title содержат «в Видном»
- [x] /programs/yoga и /programs/pilates — расширены FAQ под длинно-хвостовые запросы (студия йоги, для беременных, реформер) + +200 символов в description с городскими привязками

### SEO — Schema.org
- [x] **SportsActivityLocation** на главной (с PostalAddress, GeoCoordinates, OpeningHours)
- [x] **ExerciseGym** на главной
- [x] **Service** на /programs/[slug] с `areaServed: City Видное`, `provider: SportsActivityLocation`
- [x] **Person** на /trainers/[slug] с `worksFor: SportsActivityLocation`
- [x] **BreadcrumbList** на /programs/[slug], /trainers/[slug], /facilities/[slug], /blog/[slug]
- [x] **FAQPage** на /programs/[slug] (расширены) и /pricing
- [x] **BlogPosting** на /blog/[slug] с image, publisher.logo, isAccessibleForFree, inLanguage
- [x] **Offer** на /pricing для абонементов

### SEO — техническое
- [x] `robots.txt` — открыт для всех + явные правила для GPTBot/PerplexityBot/ClaudeBot/Applebot
- [x] `sitemap.xml` — 48 URL (главная + 8 разделов + slugs программ/тренеров/залов + блог)
- [x] Canonical = `https://arcfit.ru/...` на каждой странице
- [x] OG + Twitter Cards с `siteName: Фитнес-клуб Арктика`, `og:image: og-image.png`
- [x] Все `<Image>` имеют осмысленный alt с городом (проверено static анализом)

### Расписание
- [x] FALLBACK_SCHEDULE на текущую неделю (24 занятия 4–10 мая 2026)
- [x] Заголовок «Неделя 4 — 10 мая 2026» под H1 на /schedule
- [x] Skill `arcfit-next-schedule` — для еженедельного обновления через push в main

### Документация миграции (эта папка)
- [x] `00-current-state.md` — снимок «как есть»
- [x] `01-dns-records.md` — точные записи для nic.ru
- [x] `02-vercel-env-vars.md` — список env vars (все залиты)
- [x] `03-content-checklist.md` — что перенести с Tilda
- [x] `04-integrations.md` — Метрика, формы, 1C.Fitness, Bitrix24, email
- [x] `05-seo-redirects.md` — canonical, redirects, robots, sitemap
- [x] `06-cutover-plan.md` — пошаговый план переключения
- [x] `07-rollback-plan.md` — откат если что-то сломалось
- [x] `08-post-migration.md` — чек-лист первых 24 ч и недели
- [x] `09-deployment-package.md` — финальный сборочный документ
- [x] `access-required.md` — что нужно от владельца
- [x] `assets-inventory.md` — инвентарь визуальных ассетов
- [x] `.env.production.example` — шаблон env vars
- [x] `deploy.ps1` / `deploy.sh` — скрипты автоматизации Vercel
- [x] `STATUS.md` — этот файл

## ⬜ Осталось — нужны решения / доступы

### Блокеры миграции (без них нельзя выкатывать)

- [ ] **Доступ к DNS nic.ru** — добавить TXT для верификации Vercel + сменить A-record (см. `01-dns-records.md`)
- [ ] **Решение по дате/времени cutover** (см. `06-cutover-plan.md`)
- [ ] **Снижение TTL DNS до 300** за 24 часа до миграции
- [ ] **Бэкап текущей DNS-зоны** (скриншот/экспорт из nic.ru)

### Сильно желательно ДО миграции

- [ ] **Контент-аудит**: открыть текущий arcfit.ru на Tilda и сверить с arcfit-next.vercel.app — все ли тренеры, цены, фото, тексты соответствуют (см. `03-content-checklist.md`)
- [ ] **Список Tilda URL** для 301-редиректов: `curl Tilda API` → собрать → добавить в `next.config.ts` redirects (см. `05-seo-redirects.md`)
- [ ] **Фото фасада/занятий с реальными людьми** — увеличит уникальность для SEO + Я.Бизнес

### После миграции (первая неделя)

- [ ] **Я.Вебмастер** — подтвердить владение arcfit.ru, отправить sitemap
- [ ] **Google Search Console** — то же
- [ ] **Цели в Метрике 95693874** — создать через UI 4 цели:
    - JS-событие `form_send` (получение лида)
    - JS-событие `phone_click` (клик по тел.)
    - JS-событие `tg_click` (клик по Telegram)
    - URL-цель `/api/lead` (резервная)
- [ ] Создать аннотацию в Метрике «Миграция Tilda → Vercel <дата>»
- [ ] Через 7 дней — проверить позиции по «фитнес видное», «йога видное», «пилатес видное» в Я.Вебмастере

### Опции (можно делать после)

- [ ] **1C.Fitness API для онлайн-расписания** (если есть API key) — задать `FITNESS_API_URL/APP_KEY/SECRET_KEY`, отключить статичный fallback
- [ ] Реальные фото отзывов клиентов → Schema.org `Review`/`AggregateRating`
- [ ] FAQ-блок на главной (под «фитнес видное цены» 179, «фитнес видное отзывы» 83)
- [ ] Я.Бизнес/2GIS/Zoon карточки — обновить адресной + актуальные фото

## Метрики до/после миграции (сравнить через 30 дней)

| Метрика | До (Tilda) | Цель после (Next.js) |
|---|---|---|
| Я.Метрика — визиты/неделя | (текущий уровень) | не ниже текущего |
| Доля брендовых запросов «арктика» | 102/мес (3% от «фитнес видное») | + 30% за квартал |
| Лиды/неделя через форму | (текущий уровень) | не ниже текущего |
| LCP (PageSpeed Mobile) | (Tilda) | < 2.5 сек |
| Я.Вебмастер — индексация sitemap | — | 90%+ за 14 дней |

## Реквизиты

- ООО АктивСпорт, ИНН 7704312680, ОГРН 1157746315385
- Адрес: г. Видное, Зелёный переулок, 10
- Телефон: +7 925 088 9196 (общий), +7 936 142 3841 (продажи)
- Telegram: https://t.me/arcfit
- Email уведомления о лидах: info@sport-vsegda.ru, arktikafitness@sport-vsegda.ru
