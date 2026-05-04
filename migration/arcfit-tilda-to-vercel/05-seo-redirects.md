# 05 — SEO, canonical, robots, sitemap, 301-редиректы

## 5.1 Canonical
Уже настроено в Next.js:
- `src/lib/constants.ts`: `SITE.url = "https://arcfit.ru"`
- `src/app/page.tsx`: `metadata.alternates.canonical = SITE.url`
- На каждой странице (`/schedule`, `/pricing`, `/trainers/[slug]` и т.д.) — `canonical: \`${SITE.url}/<path>\``

✅ Никаких изменений не нужно.

## 5.2 robots.txt
Next.js генерирует автоматически через `src/app/robots.ts` (если файл есть) или статически. Проверить:

```bash
curl https://arcfit-next.vercel.app/robots.txt
```

Должен содержать:
```
User-agent: *
Allow: /
Sitemap: https://arcfit.ru/sitemap.xml
```

После миграции на arcfit.ru — то же содержимое, но рендерится с прод-домена.

## 5.3 sitemap.xml
Генерируется через `src/app/sitemap.ts`. Проверить что включает все страницы:
- `/`
- `/schedule`
- `/pricing`
- `/contacts`
- `/privacy`
- `/programs` + все `/programs/[slug]`
- `/trainers` + все `/trainers/[slug]`
- `/facilities` + все `/facilities/[slug]`
- `/blog` + все `/blog/[slug]`

```bash
curl https://arcfit-next.vercel.app/sitemap.xml | head -30
```

После миграции добавить в Yandex.Webmaster и Google Search Console.

## 5.4 301-редиректы со старых Tilda-URL

Если URL-структура Tilda и Next.js ОТЛИЧАЕТСЯ — нужны 301-редиректы, иначе старые ссылки из Я.Карт/2ГИС/соцсетей/чужих сайтов получат 404.

### Шаг 1: собрать список Tilda-URL
```bash
# через Tilda API + список страниц
curl -s "https://api.tildacdn.info/v1/getpageslist/?publickey=z4hz8yjayrase170rndg&secretkey=e99c7db3f3c7d61442a2&projectid=8067531" \
  | python -m json.tool | grep filename
```

Также проверить в Я.Вебмастер → Индексирование → Страницы в поиске — какие URL индексировались.

### Шаг 2: построить таблицу старый → новый

| Старый URL (Tilda) | Новый URL (Next.js) | Тип |
|---|---|---|
| `/` | `/` | 200 |
| `/services` | `/programs` | 301 |
| `/team` | `/trainers` | 301 |
| `/halls` | `/facilities` | 301 |
| `/raspisanie` | `/schedule` | 301 |
| `/tseny` | `/pricing` | 301 |
| `/kontakty` | `/contacts` | 301 |
| `/politika-konfidencialnosti` | `/privacy` | 301 |
| (другие) | … | … |

**TODO**: заполнить после фактического анализа Tilda.

### Шаг 3: добавить в `next.config.ts`

```ts
const nextConfig: NextConfig = {
  // ... существующие настройки

  async redirects() {
    return [
      { source: '/services', destination: '/programs', permanent: true },
      { source: '/team', destination: '/trainers', permanent: true },
      { source: '/halls', destination: '/facilities', permanent: true },
      { source: '/raspisanie', destination: '/schedule', permanent: true },
      { source: '/tseny', destination: '/pricing', permanent: true },
      { source: '/kontakty', destination: '/contacts', permanent: true },
      { source: '/politika-konfidencialnosti', destination: '/privacy', permanent: true },
      // www → apex
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.arcfit.ru' }],
        destination: 'https://arcfit.ru/:path*',
        permanent: true,
      },
    ];
  },
};
```

### Шаг 4: проверка после деплоя
```bash
for url in /services /team /halls /raspisanie /tseny /kontakty; do
  echo "$url:"
  curl -sI "https://arcfit.ru$url" | grep -E "HTTP|location"
  echo
done
```
Каждый должен вернуть 308 (Next.js permanent redirect = 308) с правильным `location:`.

## 5.5 www → apex
В Vercel Domains автоматически предлагает редирект `www.arcfit.ru → arcfit.ru` или наоборот. Выбираем `apex` (без www) как канонический. Это:
- В Vercel → Domains добавить `www.arcfit.ru` с типом `Redirect to arcfit.ru`
- Или через API: `POST /v10/projects/<id>/domains` с `redirect: "arcfit.ru"`

## 5.6 HTTPS
Vercel автоматически:
- Выпускает TLS-сертификат через Let's Encrypt
- Принудительно редиректит HTTP → HTTPS
- Поддерживает HSTS

Проверка:
```bash
curl -sI http://arcfit.ru/ | grep -E "HTTP|location"
# должно быть 308 → https://arcfit.ru/
```

## 5.7 Schema.org / JSON-LD
На главной — `SportsActivityLocation` уже встроен. Проверить через:
- https://search.google.com/test/rich-results — вставить URL после миграции
- https://webmaster.yandex.ru/tools/microtest/

Дополнительно можно добавить:
- `Organization` (юрлицо ООО АктивСпорт)
- `BreadcrumbList` (на subroutes /trainers/[slug] и т.д.)
- `Article` (на /blog/[slug])
- `Event` (на конкретные занятия в расписании, если хочется)

## 5.8 Open Graph + Twitter Cards
В `metadata.openGraph` уже есть. Twitter cards аналогично:
```ts
metadata.twitter = {
  card: 'summary_large_image',
  title: ...,
  description: ...,
  images: [`${SITE.url}/og-image.jpg`],
};
```
Проверка: https://www.opengraph.xyz/url/https%3A%2F%2Farcfit.ru/

## 5.9 Поведение поисковиков после миграции

**Первые 24-72 часа:**
- Робот Яндекса заметит изменение IP/headers (`server: vercel` вместо Tilda)
- Робот переиндексирует главную и важные страницы
- В Я.Метрике источник «Поиск» может временно просесть

**Первая неделя:**
- Sitemap.xml считывается, новые страницы индексируются
- Старые Tilda-URL возвращают 301 → переходят на новые URL в индексе
- Robots проверяется заново

**1-2 месяца:**
- Полная стабилизация позиций
- Все 301-редиректы передали ссылочный вес
- Я.Метрика показывает ровную картину

**Что мониторить:**
- Я.Вебмастер → Индексирование → Ошибки → не должно быть резкого роста 4xx/5xx
- Я.Метрика → Источники → Поисковые системы → не должно быть просадки больше 30%
- Если просадка — проверить `next.config.ts` redirects, robots.txt, sitemap

## 5.10 Не делать на старте
- ❌ Менять структуру URL вне списка миграции 301
- ❌ Удалять страницы из Tilda до того как 301-цепочка проверена в Я.Вебмастере
- ❌ Полностью менять контент главной (заголовки/H1) одновременно с миграцией движка — это два изменения сразу, поисковикам сложнее
- ❌ Использовать `meta robots noindex` где-то по ошибке
