# Инвентарь визуальных ассетов (на 2026-05-04)

Все файлы в `atktika-fitness/public/`. **Всего 36.3 MB / 133 файла.**

## Видео (4 файла, ~5 MB)

| Файл | Где используется | Назначение |
|---|---|---|
| `images/hero/hero-bg.mp4` | `src/components/sections/Hero.tsx` | Фон главной страницы (autoplay/loop/muted) |
| `videos/fitball.mp4` | `src/app/programs/[slug]/page.tsx` (slug=fitball) | Видео в hero карточки программы «Фитнес-мяч» |
| `videos/lady-style.mp4` | `src/app/programs/[slug]/page.tsx` (slug=lady-style) | Видео в hero карточки программы «Леди Стиль» |
| `videos/hero-girl.mp4` | резерв | Альтернатива hero-girl.png если понадобится |

⚠️ Все mp4 проходят через **exception в `.gitignore`** — корневой ignore блокирует `*.mp4`, но `!atktika-fitness/public/**/*.mp4` пропускает их в коммит.

## Hero (4 файла)

| Файл | Назначение |
|---|---|
| `images/hero/hero-bg.mp4` | основной фон (видео) |
| `images/hero/hero-girl.png` | прозрачный PNG девушки на десктопе и мобиле |
| `images/hero/hero-bg-2.jpg` | резервная картинка фона |
| `images/hero/hero-main.jpg` | OG-image для соц.сетей при шаринге |

## Программы (11 файлов)
`images/programs/<slug>.jpg` — фото каждой групповой программы:
yoga, hatha-yoga, stretching, pilates, fitness-mix, body-sculpt, cycling, lady-style, glutes, functional, interval, power-plus

## Тренеры (`images/trainers/<slug>.jpg`)
9 файлов — по одному фото на каждого: lazareva, flotskiy, gorbachev, chokaev, zharikova, sharikova, khlebnikova, sergeeva, larionova

## Залы (`images/facilities/<slug>.jpg`)
6 файлов: gym, small-hall, medium-hall, large-hall, cardio, cycling-hall

## Иконки (27 SVG в `icons/`)

**Бренд:**
- `icons/logo.svg`, `icons/logo-dark.svg` (тёмная версия), `icons/favicon.svg`

**UI:** `arrow-down`, `check`, `clock`, `close`, `location`, `menu`, `phone`, `star`, `telegram`

**Программы (для меток):** `back-health`, `body-sculpt`, `crossfit`, `cycling`, `dance`, `fitball`, `functional`, `glutes`, `interval`, `legs`, `martial-arts`, `mobility`, `pilates`, `stretching`, `yoga`

## Галерея (`images/gallery/`)
Внутренние фото клуба для секции `<Gallery />` на главной.

## SEO/PWA-иконки
- `og-image.png` 1200×630 — для OG/Twitter Cards (используется `metadata.openGraph.images`)
- `apple-touch-icon.png` — для добавления на главный экран iOS
- `favicon-32x32.png` — favicon

## Куда добавлять новые ассеты

| Тип | Куда класть | Какой формат |
|---|---|---|
| Фото программы | `public/images/programs/<slug>.jpg` | 1200×800 jpg, ≤300 KB |
| Фото тренера | `public/images/trainers/<slug>.jpg` | 800×1000 jpg, ≤200 KB |
| Фото зала | `public/images/facilities/<slug>.jpg` | 1600×900 jpg, ≤350 KB |
| Видео hero/программ | `public/videos/<name>.mp4` или `public/images/hero/` | h.264 mp4, 720p, ≤5 MB |
| OG-image | `public/og-image.png` | 1200×630 png |
| Иконка программы | `public/icons/programs/<slug>.svg` | inline-fill SVG, ≤2 KB |

После добавления нового mp4 — убедиться что путь покрыт exception `!atktika-fitness/public/**/*.mp4` в `.gitignore` (по умолчанию покрыт).

## Чего нет (можно докинуть для SEO)

- Реальные фото отзывов клиентов (для Schema.org `Review`/`AggregateRating`)
- Фото с занятий (для блога/программ — увеличит уникальность контента)
- Видео-обзор клуба (1 минута для главной, под YouTube/VK)
- Фото фасада здания (для Я.Бизнес карточки)
