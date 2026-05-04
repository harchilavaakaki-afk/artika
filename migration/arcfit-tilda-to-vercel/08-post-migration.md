# 08 — Post-migration (после успешного переключения)

## T+24 часа

### Технические проверки
- [ ] https://arcfit.ru/ — 200 OK, контент Next.js (не Tilda)
- [ ] https://www.arcfit.ru/ — 308 редирект на arcfit.ru
- [ ] https://arcfit.ru/sitemap.xml — открывается
- [ ] https://arcfit.ru/robots.txt — корректный
- [ ] HTTPS-сертификат валидный (https://www.ssllabs.com/ssltest/analyze.html?d=arcfit.ru)
- [ ] OG-теги (https://www.opengraph.xyz/url/https%3A%2F%2Farcfit.ru)
- [ ] Schema.org валиден (https://search.google.com/test/rich-results)

### Аналитика
- [ ] Я.Метрика 95693874 → Сводка → видны хиты за сутки
- [ ] Сравнить количество визитов «Tilda день перед миграцией» vs «Next.js первые сутки» — разница не больше 30%
- [ ] Источники → Поисковые системы — Яндекс работает, Google работает
- [ ] Цели — формы отправляются, клики по тел/TG идут

### Лиды
- [ ] За 24 часа пришло X заявок (норма: ≥ среднее значение прошлой недели)
- [ ] Все заявки попадают в TG/CRM/email — нет потерь

### Поисковики
- [ ] Я.Вебмастер → arcfit.ru → Состояние сайта → Зелёный
- [ ] Я.Вебмастер → Индексирование → Не должно быть скачка ошибок 4xx/5xx
- [ ] Google Search Console → Coverage → нет резкого роста errors

## T+7 дней

### Тильда
- [ ] Если Tilda не нужна — отвязать домен в Tilda админке (Project → Domains → Remove `arcfit.ru`)
- [ ] Проект Tilda можно оставить как архив или удалить
- [ ] Tilda аккаунт остаётся (там может быть ещё что-то)

### SEO
- [ ] В Я.Вебмастер → Индексирование → Страницы в поиске — большинство Next.js URL уже проиндексированы
- [ ] 301-редиректы со старых Tilda-URL — Я.Вебмастер показывает «Перенаправление 301» как корректное
- [ ] Sitemap.xml — обработан, новые URL включены
- [ ] Поведение в SERP — позиции по ключевым запросам не упали критически
  - «фитнес видное», «фитнес-студия видное», «йога видное», «арктика фитнес»

### Performance
- [ ] PageSpeed Insights https://pagespeed.web.dev/?url=https://arcfit.ru
  - Mobile: > 70
  - Desktop: > 90
- [ ] Core Web Vitals — все зелёные (LCP, FID/INP, CLS)
- [ ] Time to First Byte — < 600 мс

### Trafic
- [ ] Я.Метрика → недельный отчёт vs предыдущая неделя на Tilda
- [ ] Если просадка > 30% — диагностировать (см. troubleshooting ниже)

## T+30 дней

### SEO стабилизация
- [ ] Позиции в Яндексе восстановились до уровня Tilda
- [ ] Все старые Tilda-URL либо проиндексированы как редирект, либо удалены из индекса
- [ ] Новые Next.js URL индексируются регулярно

### Контент
- [ ] За месяц добавлено новых статей в /blog (если планировалось)
- [ ] Расписание обновлялось еженедельно через skill `arcfit-next-schedule`
- [ ] Меню/цены/тренеры актуальны

### Конверсии
- [ ] Конверсия в лид (визит → форма) ≥ норма Tilda
- [ ] Если ниже — провести A/B тесты hero/CTA

## Memory-обновления

### Обновить:
1. `reference_arcfit_site.md` — добавить «✅ Прод теперь Next.js на Vercel (с 2026-XX-XX)»
2. `MEMORY.md` — обновить описание `reference_arcfit_site` чтобы отразить Vercel
3. Skill `arcfit-schedule` (Tilda) — пометить как **deprecated** или удалить (если Tilda отключена)
4. Skill `arcfit-next-schedule` — стал основным для расписания

### Создать:
- `reference_arcfit_migration_complete.md` — финальная карточка (что было сделано, дата, что мониторить)

## Troubleshooting типовых проблем

### «Сайт работает, но трафик упал на 50%»
**Причины:**
- Метрика не подключилась → проверить env `NEXT_PUBLIC_YM_ID`, проверить что счётчик пишет в реальном времени
- Поисковики ещё переиндексируют → подождать неделю
- 301-редиректы пропущены → проверить таблицу из 05-seo-redirects.md

### «Заявки перестали приходить»
- env `FITNESS_LEAD_WEBHOOK` не задан или неправильный URL
- Webhook на стороне CRM/TG падает с ошибкой → проверить логи Vercel `/api/lead`:
  ```bash
  source ~/.claude/secrets/vercel.env
  curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v6/runtime-logs?projectId=$VERCEL_PROJECT_ID_ARCFIT_NEXT&teamId=$VERCEL_TEAM_ID" \
    | python -m json.tool | grep -A3 "/api/lead"
  ```

### «На /schedule показано пустое расписание»
- env `FITNESS_API_*` не настроены → используется FALLBACK
- FALLBACK_SCHEDULE устарел → запустить skill `arcfit-next-schedule` чтобы обновить

### «Браузер показывает SSL-ошибку»
- Vercel ещё не выпустил сертификат → подождать 5-10 мин
- Если 30+ мин не выпустил — проверить домен в Vercel UI → Domains → состояние

### «Я.Вебмастер показывает много 404»
- 301-редиректы пропущены — добавить в next.config.ts
- Robots.txt блокирует индексацию — открыть https://arcfit.ru/robots.txt

## Долгосрочно

### Раз в месяц
- Аудит Я.Метрики — основные показатели стабильны?
- Lighthouse — performance не ухудшился?
- PageSpeed Insights — Mobile ≥ 70, Desktop ≥ 90?

### Раз в квартал
- Обновить контент, тренеров, цены если поменялись
- Проверить что все 301-редиректы ещё актуальны
- Добавить новые статьи в /blog (для SEO)
- Сравнить с конкурентами (sport-club-fitness.ru, planeta-fitness.ru и др. в Видном)

### Бэкапы
Vercel хранит все деплои — откат на любой commit через UI/API за 30 секунд. Дополнительные бэкапы не нужны.
