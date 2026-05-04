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
| [00-current-state.md](00-current-state.md) | Снимок «как есть» — DNS, IP, интеграции на Tilda, что в коде Next.js |
| [01-dns-records.md](01-dns-records.md) | Точные DNS-записи для nic.ru: что заменить, что оставить |
| [02-vercel-env-vars.md](02-vercel-env-vars.md) | Список env vars для Vercel, где взять каждую |
| [03-content-checklist.md](03-content-checklist.md) | Что перенести с Tilda: тренеры, цены, фото, тексты |
| [04-integrations.md](04-integrations.md) | Метрика, формы, 1С Fitness, Calltouch, Telegram бот |
| [05-seo-redirects.md](05-seo-redirects.md) | Canonical, robots.txt, sitemap.xml, 301-редиректы |
| [06-cutover-plan.md](06-cutover-plan.md) | Пошаговый план переключения в день миграции |
| [07-rollback-plan.md](07-rollback-plan.md) | Что делать если что-то сломалось |
| [08-post-migration.md](08-post-migration.md) | Чек-лист первых 24 часов и первой недели после |
| [access-required.md](access-required.md) | Что нужно от пользователя (доступы, решения) |

## Принцип переключения
DNS A-record apex `arcfit.ru` меняется с Tilda IP `185.215.4.30` на Vercel IP `76.76.21.21` (или ALIAS на `cname.vercel-dns.com`). TTL 300 сек → новый сайт виден через ~5 мин у большинства пользователей, до 1 часа у всех.

## Готовность чек
- [ ] Все env vars залиты в Vercel (см. 02)
- [ ] Контент 1:1 с Tilda (см. 03)
- [ ] Формы работают и заявки приходят (см. 04)
- [ ] Метрика стреляет на staging (см. 04)
- [ ] DNS-записи подготовлены, TTL понижен до 300 (см. 01)
- [ ] Cutover-window согласован (см. 06)
- [ ] Rollback-инструкция распечатана (см. 07)

## Контакты-владельцы (на момент миграции)
- Бренд / контент: **TODO** (заполнить)
- Доступ к Tilda: **TODO**
- Доступ к nic.ru (DNS): **TODO**
- 1С Fitness API: **TODO**
- Telegram бот / CRM лидов: **TODO**

См. [access-required.md](access-required.md) — список открытых вопросов.
