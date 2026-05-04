# Миграция arcfit.ru: Tilda → Vercel (Next.js)

Полный пакет миграции прод-сайта Арктика Фитнес с Tilda на собственную Next.js версию (`arcfit-next.vercel.app` → `arcfit.ru`).

## Цель
Заменить Tilda-сайт на Next.js версию по адресу `https://arcfit.ru`. Сохранить:
- SEO-историю (трафик из Яндекса/Google)
- Яндекс.Метрику (счётчик `95693874`)
- Поток заявок (формы → CRM/Telegram)
- Расписание (еженедельное обновление)
- Почту на @arcfit.ru если используется

## Структура папки

| Файл | Что внутри |
|------|------------|
| [STATUS.md](STATUS.md) | **🟢 Главный трекер: что сделано, что осталось.** Читать первым после этого README |
| [09-deployment-package.md](09-deployment-package.md) | Финальный сборочный документ: где код, ассеты, env, как развернуть |
| [.env.production.example](.env.production.example) | Готовый шаблон env vars (значения уже залиты в Vercel) |
| [deploy.ps1](deploy.ps1) / [deploy.sh](deploy.sh) | Скрипты автоматизации Vercel: status, set-env, add-domain, redeploy, prod-check |
| [00-current-state.md](00-current-state.md) | Снимок «как есть» — DNS, IP, интеграции на Tilda, что в коде Next.js |
| [01-dns-records.md](01-dns-records.md) | Точные DNS-записи для nic.ru: что заменить, что оставить |
| [02-vercel-env-vars.md](02-vercel-env-vars.md) | Env vars Vercel — все ✅ залиты, документ для воспроизведения окружения |
| [03-content-checklist.md](03-content-checklist.md) | Что перенести с Tilda: тренеры, цены, фото, тексты |
| [04-integrations.md](04-integrations.md) | Метрика 95693874, форма → 1C.Fitness webhook (✅ работает), Bitrix24, email |
| [05-seo-redirects.md](05-seo-redirects.md) | Canonical, robots.txt, sitemap.xml, 301-редиректы |
| [06-cutover-plan.md](06-cutover-plan.md) | Пошаговый план переключения в день миграции |
| [07-rollback-plan.md](07-rollback-plan.md) | Что делать если что-то сломалось |
| [08-post-migration.md](08-post-migration.md) | Чек-лист первых 24 часов и первой недели после |
| [access-required.md](access-required.md) | Что нужно от пользователя (доступы, решения) |
| [assets-inventory.md](assets-inventory.md) | Инвентарь визуальных ассетов: 133 файла / 36.3 MB |

## Принцип переключения
DNS A-record apex `arcfit.ru` меняется с Tilda IP `185.215.4.30` на Vercel IP `76.76.21.21` (или ALIAS на `cname.vercel-dns.com`). TTL 300 сек → новый сайт виден через ~5 мин у большинства пользователей, до 1 часа у всех.

## Готовность чек
- [x] Все env vars залиты в Vercel (см. 02) ✅ 2026-05-04
- [ ] Контент 1:1 с Tilda (см. 03) — частично, нужен финальный аудит
- [x] Формы работают, тестовая заявка дошла в 1C.Fitness (см. 04) ✅
- [x] Метрика 95693874 стреляет на arcfit-next.vercel.app (SSR HTML) ✅
- [x] SEO мета/Schema.org готовы под Wordstat-данные (см. STATUS.md) ✅
- [ ] DNS-записи подготовлены, TTL понижен до 300 (см. 01) — **нужен доступ к nic.ru**
- [ ] Cutover-window согласован (см. 06) — **нужно решение по дате**
- [x] Rollback-инструкция готова (см. 07) ✅

## Контакты-владельцы (на момент миграции)
- Бренд / контент: **TODO** (заполнить)
- Доступ к Tilda: **TODO**
- Доступ к nic.ru (DNS): **TODO**
- 1С Fitness API: **TODO**
- Telegram бот / CRM лидов: **TODO**

См. [access-required.md](access-required.md) — список открытых вопросов.
