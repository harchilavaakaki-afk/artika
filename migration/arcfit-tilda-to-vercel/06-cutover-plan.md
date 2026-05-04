# 06 — Cutover Plan (день миграции)

## Когда делать

**Лучше всего:** будний день, **утро** (09:00-11:00). Вторник-Четверг.
- Низкая нагрузка пользователей
- Если что-то пойдёт не так — есть полный рабочий день для починки
- Не пятница (если откатывать в выходные — некому)
- Не накануне праздников

**Хуже всего:** вечер пятницы, выходные, ночь.

## Окно: 2-4 часа

- 30 мин — pre-cutover чек
- 5-15 мин — DNS-переключение
- 15-60 мин — наблюдение за DNS-распространением
- 30-60 мин — функциональная проверка (формы, расписание, аналитика)
- 30 мин — буфер на исправления

## T-минус 7 дней

- [ ] Все код-задачи закрыты (контент 1:1 с Tilda — см. 03)
- [ ] Все env vars залиты в Vercel (см. 02)
- [ ] arcfit-next.vercel.app выглядит и работает корректно (визуальный тест)
- [ ] Лид-форма отработана: тестовая заявка → пришла куда нужно
- [ ] Sitemap.xml корректный
- [ ] Все 301-редиректы прописаны в next.config.ts (см. 05)
- [ ] Согласовано окно миграции с владельцем

## T-минус 24 часа

- [ ] Снизить TTL DNS-записей до **300 сек** (5 минут) в nic.ru — для быстрого переключения
- [ ] Сделать BACKUP текущей DNS-зоны (скриншот всех записей или экспорт)
- [ ] В Tilda — НЕ публиковать никаких изменений
- [ ] Проверить что 1С Fitness (если используется) рабочий — расписание актуально
- [ ] Уведомить контакт-центр / администраторов клуба о возможной короткой недоступности

## T-час: pre-cutover чек (за 30 мин)

```bash
# 1. Vercel deploy — последний commit на main READY?
source ~/.claude/secrets/vercel.env
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID_ARCFIT_NEXT&teamId=$VERCEL_TEAM_ID&limit=1" \
  | python -c "import sys,json; d=json.load(sys.stdin); [print(x['uid'],x['state']) for x in d['deployments']]"

# 2. arcfit-next.vercel.app возвращает 200 на главных страницах
for path in / /schedule /pricing /trainers /contacts /privacy /sitemap.xml /robots.txt; do
  echo -n "$path: "
  curl -sI "https://arcfit-next.vercel.app$path" | head -1
done

# 3. Yandex.Metrika встроен (искать ym(95693874)
curl -s https://arcfit-next.vercel.app/ | grep -oE 'ym\([0-9]+|NEXT_PUBLIC_YM' | head -3

# 4. Лид-форма тест (можно через curl, тестовая запись)
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"TEST_BEFORE_CUTOVER","phone":"+79990000000"}' \
  https://arcfit-next.vercel.app/api/lead
# должно прийти OK + увидеть в назначенном TG/CRM
```

✅ Только если все 4 чека зелёные — продолжать.

## T-0: переключение

### Шаг 1 — Добавить домен в Vercel
```bash
source ~/.claude/secrets/vercel.env
curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/domains?teamId=$VERCEL_TEAM_ID" \
  -d '{"name":"arcfit.ru"}' | python -m json.tool

curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/domains?teamId=$VERCEL_TEAM_ID" \
  -d '{"name":"www.arcfit.ru","redirect":"arcfit.ru"}' | python -m json.tool
```

Vercel вернёт инструкции по верификации (TXT-запись `_vercel`).

### Шаг 2 — Записать TXT для верификации в nic.ru
- Тип: TXT
- Имя: `_vercel`
- Значение: (из ответа Vercel)
- TTL: 60

### Шаг 3 — Подождать верификацию
```bash
# повторять каждые 30 сек, пока verified=true
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/domains/arcfit.ru?teamId=$VERCEL_TEAM_ID" \
  | python -c "import sys,json; d=json.load(sys.stdin); print('verified:', d.get('verified'))"
```

### Шаг 4 — Заменить A-record apex в nic.ru
- Тип: A
- Имя: `arcfit.ru` (или `@`)
- Значение: `185.215.4.30` → **`76.76.21.21`**
- TTL: 300

### Шаг 5 — CNAME для www
- Тип: CNAME
- Имя: `www`
- Значение: `cname.vercel-dns.com.`
- TTL: 300

### Шаг 6 — Сохранить, выйти из nic.ru

## T+5 минут: первая проверка

```bash
# DNS должен резолвить на Vercel
nslookup arcfit.ru                           # 76.76.21.21 ?
dig arcfit.ru +short                         # 76.76.21.21 ?
dig +trace arcfit.ru | tail -10

# HTTPS должен открыть Vercel-страницу
curl -sI https://arcfit.ru/ | head -5
# server: Vercel
# x-vercel-id: ...

# Контент должен быть Next.js
curl -s https://arcfit.ru/ | grep -oE '(Next.js|tilda)' | head
# ожидаем "Next.js" или ничего; "tilda" — НЕТ

# Метрика на странице
curl -s https://arcfit.ru/ | grep -oE 'ym\([0-9]+'
```

Если DNS ещё не докатился — подождать ещё 5-10 мин (зависит от провайдера и кеша).

## T+15 минут: функциональная проверка

Открыть в Chrome:
- [ ] https://arcfit.ru/ — главная грузится, hero виден, видео фон работает
- [ ] /schedule — расписание текущей недели
- [ ] /pricing — цены отображаются
- [ ] /trainers — список тренеров
- [ ] /trainers/<slug> — карточка тренера
- [ ] /facilities — залы
- [ ] /contacts — карта Я.Карт грузится, телефоны кликабельны
- [ ] /privacy — текст ПД
- [ ] Footer — реквизиты ООО АктивСпорт
- [ ] Лид-форма — заполнить тест, проверить что заявка пришла в TG/CRM

Mobile (открыть на телефоне или DevTools):
- [ ] Hero не обрезает заголовок
- [ ] Кнопки кликабельные (≥44×44 px)
- [ ] Меню работает
- [ ] Карта не съезжает

## T+30 минут: проверка трекинга

- [ ] Я.Метрика 95693874 → Реальное время → должны идти хиты с domain=arcfit.ru
- [ ] В URL → видны страницы /, /schedule и т.д.
- [ ] Нет ошибок JS в консоли (F12 → Console)
- [ ] Webvisor пишет (5 мин подождать → проверить в Я.Метрика → Карты → Вебвизор)

## T+1 час: SEO-сигналы

- [ ] https://arcfit.ru/sitemap.xml — открывается, содержит все страницы
- [ ] https://arcfit.ru/robots.txt — открывается, не блокирует индексацию
- [ ] В Я.Вебмастер → arcfit.ru → пересканировать главную → нет ошибок
- [ ] OG-теги: открыть https://www.opengraph.xyz/url/https%3A%2F%2Farcfit.ru — должны рендериться

## T+24 часа: первый пост-мортем

См. [08-post-migration.md](08-post-migration.md).

## Кому сообщить о завершении

- [ ] Владелец / руководитель проекта
- [ ] Контакт-центр / администраторы (что заявки теперь идут через новую систему — проверить что они продолжают приходить)
- [ ] SMM / маркетолог (новые URL для UTM)
- [ ] Команда разработки (`reference_arcfit_site.md` — обновить, отметить что arcfit.ru теперь Next.js)

## Если что-то идёт не так

См. [07-rollback-plan.md](07-rollback-plan.md).
