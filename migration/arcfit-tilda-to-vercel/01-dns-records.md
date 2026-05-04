# 01 — DNS-записи (nic.ru)

## Где менять
1. https://www.nic.ru/manager/
2. Логин: **TODO** (запросить у владельца домена)
3. Сервисы → arcfit.ru → DNS-серверы и управление зоной

## Шаг 1 — за 24 часа до миграции: понизить TTL

Зайти в редактор зоны и для всех существующих записей `arcfit.ru` и `www.arcfit.ru` сменить TTL → `300` (5 минут). Это нужно чтобы пользователи быстро получили новые IP после переключения.

После снижения подождать минимум `<старый-TTL>` (обычно 1-24 часа) — за это время кеши провайдеров обновятся.

## Шаг 2 — добавить TXT для верификации Vercel

Vercel перед добавлением домена потребует подтверждения владения через TXT-запись. Точное значение получим при добавлении домена в Vercel API:

```bash
source ~/.claude/secrets/vercel.env
curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID_ARCFIT_NEXT/domains?teamId=$VERCEL_TEAM_ID" \
  -d '{"name":"arcfit.ru"}'
```

Ответ содержит `verification` массив — там будут TXT-записи которые нужно добавить в зону.

Ожидаемый формат:
```
Тип: TXT
Имя: _vercel
Значение: vc-domain-verify=arcfit.ru,xxxxxxxxx
TTL: 60
```

## Шаг 3 — день переключения: A-record и CNAME

### Перед изменением — БЭКАП
В nic.ru скачать текущую зону или сделать скриншот всех записей. Сохранить рядом как `dns-backup-2026-05-XX.txt`.

### Заменить на Vercel

| Тип | Имя | Старое значение | Новое значение | TTL |
|---|---|---|---|---|
| A | `arcfit.ru` (apex, `@`) | `185.215.4.30` (Tilda) | `76.76.21.21` (Vercel) | 300 |
| CNAME | `www` | (старое значение) | `cname.vercel-dns.com.` | 300 |

> nic.ru обычно поддерживает «ANAME»/«ALIAS» для apex — если опция есть, использовать её на `cname.vercel-dns.com.` вместо A. Это надёжнее (Vercel может менять IP).

### НЕ трогать
- MX-записи (почта @arcfit.ru)
- SPF (TXT с `v=spf1 ...`)
- DKIM (TXT с `v=DKIM1 ...`)
- DMARC (TXT с `v=DMARC1 ...`)
- Любые другие сервисные записи (Я.Вебмастер `yandex-verification`, Google `google-site-verification`)

## Шаг 4 — проверка через 5-15 минут

```bash
# DNS должен резолвить на Vercel
nslookup arcfit.ru                            # ожидается 76.76.21.21
nslookup www.arcfit.ru                        # ожидается CNAME → cname.vercel-dns.com
dig arcfit.ru +short                          # 76.76.21.21
dig +trace arcfit.ru                          # цепочка от корневых до nic.ru

# HTTPS должен открыть Vercel
curl -sI https://arcfit.ru/ | head -5         # должно быть 200 OK
curl -sI https://www.arcfit.ru/ | head -5     # 308 редирект на apex (или наоборот, по настройке)
```

## Если используется DNS-провайдер не nic.ru

Если зона делегирована на Cloudflare/другой DNS — менять там, и ВЫКЛЮЧИТЬ proxy (orange cloud → grey cloud) перед изменениями. Vercel требует прямой DNS без proxy.

## Финальные значения зоны после миграции

```
arcfit.ru.        300  IN  A      76.76.21.21
www.arcfit.ru.    300  IN  CNAME  cname.vercel-dns.com.
_vercel.arcfit.ru. 60  IN  TXT    "vc-domain-verify=arcfit.ru,xxxxxxxxx"
arcfit.ru.        ...  IN  MX     ... (не трогаем)
arcfit.ru.        ...  IN  TXT    "v=spf1 ..." (не трогаем)
default._domainkey.arcfit.ru. IN TXT "v=DKIM1 ..." (не трогаем)
_dmarc.arcfit.ru. ...  IN  TXT    "v=DMARC1 ..." (не трогаем)
```

После того как Vercel проверит верификацию (~ 1-5 мин) — TXT `_vercel` можно удалить.
