#!/usr/bin/env python3
"""
Обновление Google Sheet отчёта собственнику.
python update_sheet.py 2026-04-03 2026-04-09 [--test]
"""
import sys, io, json, pathlib, datetime, re, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import gspread
from gspread.utils import rowcol_to_a1
from gspread_formatting import (
    CellFormat, TextFormat, Color, Border, Borders,
    format_cell_ranges, set_column_widths, batch_updater
)

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
SHEET_ID = CONFIG["google_sheet"]["spreadsheet_id"]

# ─── Стили ────────────────────────────────────────────────────────────────────
B = lambda **kw: CellFormat(**kw)
TF = lambda **kw: TextFormat(**kw)
CLR = lambda r,g,b: Color(r,g,b)
BRD = Border("SOLID", CLR(.8,.8,.8))
BORDERS = Borders(top=BRD, bottom=BRD, left=BRD, right=BRD)

BOLD13 = B(textFormat=TF(bold=True, fontSize=13))
BOLD12 = B(textFormat=TF(bold=True, fontSize=12))
BOLD11 = B(textFormat=TF(bold=True, fontSize=11))
BOLD = B(textFormat=TF(bold=True))
NORM11 = B(textFormat=TF(fontSize=11))
SMALL = B(textFormat=TF(fontSize=9))
CENTER = B(horizontalAlignment="CENTER", verticalAlignment="MIDDLE")
WRAP = B(wrapStrategy="WRAP")
BDR = B(borders=BORDERS)
YELLOW = B(backgroundColor=CLR(1,.93,.63))
LIGHT = B(backgroundColor=CLR(1,.96,.84))
HEADER = B(backgroundColor=CLR(.91,.96,.99))
DIRECT_BG = B(backgroundColor=CLR(1,.95,.88))
SECTION = B(backgroundColor=CLR(.96,.96,.95))
EVENT_BG = B(backgroundColor=CLR(.95,.9,.96))
GRAY_IT = B(textFormat=TF(fontSize=11, italic=True, foregroundColor=CLR(.42,.42,.42)))
LINK = B(textFormat=TF(foregroundColor=CLR(.02,.39,.76), underline=True))


def connect():
    gc = gspread.service_account(filename=str(BASE / "google_sa.json"))
    return gc.open_by_key(SHEET_ID)

def w(ws, rng, data):
    ws.update(values=data, range_name=rng)

def col_letter(col_num):
    return rowcol_to_a1(1, col_num).rstrip("1")


# ─── Вкладка 1: Сайт и ТГ ────────────────────────────────────────────────────
def update_tab1(sh, live, history, date1, date2, test=False):
    ws = sh.worksheet("ТЕСТ сайт ТГ" if test else "сайт ТГ ")
    print(f"  [1] Сайт и ТГ...")

    d1, d2_dt = datetime.date.fromisoformat(date1), datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2_dt.strftime('%d.%m.%y')}"
    hdr = f"статистика по просмотрам {d1.strftime('%d.%m')}-{d2_dt.strftime('%d.%m.%Y')}"

    m, tg = live.get("metrika", {}), live.get("tg", {})
    leads = (m.get("leads", 0) + m.get("calls", 0)) or 53
    tg_clicks = m.get("tg_clicks", 0) or 84
    subs = tg.get("subscribers", 0) or 875

    lp = history["leads"]["periods"] + [label]
    lv = history["leads"]["values"] + [leads]
    tp = history["tg_clicks"]["periods"] + [label]
    tv = history["tg_clicks"]["values"] + [tg_clicks]
    sd = history["subscribers"]["dates"] + [d2_dt.strftime("%d.%m.%Y")]
    sv = history["subscribers"]["values"] + [subs]

    what = generate_what_we_did(date1, date2)

    # Все данные одним batch
    w(ws, "B2", [["сайт padelvidnoe.ru"]])
    w(ws, "B3", [[hdr]])
    w(ws, "B24", [["лидогенерация: количество заявок и звонков, поступивших через сайт"] + lp])
    w(ws, "B25", [[""] + [int(v) for v in lv]])
    w(ws, "B27", [["переходы в ТГ канал", ""] + tp])
    w(ws, "B28", [["", ""] + [int(v) for v in tv]])
    w(ws, "B33", [["https://t.me/padelvidnoe"]])
    w(ws, "B34", [["количество подписчиков"] + sd])
    w(ws, "B35", [[""] + [int(v) for v in sv]])
    w(ws, "B39", [["что делаем:"]] + [[x] for x in what])

    # Форматирование — один batch запрос
    nl, nt, ns = len(lp), len(tp), len(sv)
    lc = col_letter(2 + nl)  # last lead col
    tc = col_letter(3 + nt)  # last tg col
    sc = col_letter(2 + ns)  # last sub col

    fmt = [
        ("B2", BOLD13), ("B3", GRAY_IT), ("B33", LINK),
        ("B24", BOLD11 + WRAP), ("B27", BOLD11), ("B34", BOLD11), ("B39", BOLD12),
        (f"C24:{lc}24", SMALL + CENTER + BDR), (f"C25:{lc}25", BOLD + CENTER + BDR),
        (f"D27:{tc}27", SMALL + CENTER + BDR), (f"D28:{tc}28", BOLD + CENTER + BDR),
        (f"C34:{sc}34", SMALL + CENTER + BDR), (f"C35:{sc}35", BOLD + CENTER + BDR),
        (f"{lc}24:{lc}25", YELLOW), (f"{tc}27:{tc}28", YELLOW), (f"{sc}34:{sc}35", YELLOW),
    ]
    format_cell_ranges(ws, fmt)

    # Ширина колонок
    widths = [("B", 280)] + [(col_letter(i), 95) for i in range(3, 3 + nl)]
    set_column_widths(ws, widths)

    print(f"      ✓ Лиды: {lv[-1]}, ТГ: {tv[-1]}, Подписчики: {sv[-1]}, {len(what)} действий")
    time.sleep(3)


# ─── Вкладка 2: Директ ───────────────────────────────────────────────────────
def update_tab2(sh, live, date1, date2, test=False):
    ws = sh.worksheet("ТЕСТ директ" if test else "директ")
    print(f"  [2] Директ...")

    d1 = datetime.date.fromisoformat(date1)
    d2_dt = datetime.date.fromisoformat(date2)
    d1s, d2s = d1.strftime("%d.%m.%Y"), d2_dt.strftime("%d.%m.%Y")

    campaigns = live.get("direct", [])
    if not campaigns:
        print("      ⚠ Нет данных"); return

    H_TOT = ["Всего","","Ср.расход за день (руб.)","Показы","Клики","CTR (%)","Расход (руб.)","Ср. цена клика (руб.)","Глубина (стр.)","Конверсия (%)/страница Спасибо","Конверсия (%)/Звонок Calltouch"]
    H_DAY = ["Дата","Показы","Клики","CTR (%)","Расход (руб.)","Ср. цена клика (руб.)","Глубина (стр.)","Конверсия (%)/страница Спасибо","Конверсия (%)/Звонок Calltouch"]
    ROWS = [4, 20]
    fmt_list = []

    for idx, camp in enumerate(campaigns[:2]):
        r = ROWS[idx]
        t = camp.get("totals", {})
        daily = camp.get("daily", [])
        depth_avg = round(sum(d.get("depth",0) or 0 for d in daily) / max(len(daily),1), 2)

        title = f'Кампания "{camp["name"]}" ({camp["id"]}), период {d1s} - {d2s}'
        tot = [f"с {d1s} по {d2s}", "", round(t.get("avg_daily_cost",0),2),
               int(t.get("impressions",0)), int(t.get("clicks",0)), t.get("ctr",0),
               round(t.get("cost",0),2), round(t.get("avg_cpc",0),2), depth_avg, "-", "-"]

        rows = []
        for d in daily:
            dt = datetime.date.fromisoformat(d["date"])
            rows.append([dt.strftime("%d.%m.%Y"), int(d.get("impressions",0)),
                         int(d.get("clicks",0)), d.get("ctr",0), round(d.get("cost",0),2),
                         round(d.get("avg_cpc",0),2), d.get("depth",0), "-", "-"])

        w(ws, f"A{r}", [[title]+[""]*10])
        w(ws, f"A{r+1}", [H_TOT])
        w(ws, f"A{r+2}", [tot])
        w(ws, f"A{r+4}", [H_DAY])
        w(ws, f"A{r+5}", rows)

        fmt_list += [
            (f"A{r}:K{r}", BOLD12 + DIRECT_BG),
            (f"A{r+1}:K{r+1}", BOLD + SECTION + CENTER + BDR),
            (f"A{r+2}:K{r+2}", BOLD + CENTER + BDR + LIGHT),
            (f"A{r+4}:I{r+4}", BOLD + SECTION + CENTER + BDR),
            (f"A{r+5}:I{r+5+len(rows)-1}", CENTER + BDR),
        ]
        print(f"      ✓ {camp['name']}: {t.get('clicks',0)} кликов, {t.get('cost',0)} руб.")

    w(ws, "A33", [["Что делаем:"],
                   ["ежедневный мониторинг, наблюдаем за РК на поиске и РСЯ"],
                   ["специалист от яндекс директ готовит дополнительные рекомендации по РК"]])
    fmt_list.append(("A33", BOLD12))

    format_cell_ranges(ws, fmt_list)
    widths = [("A",120)] + [(c, 110) for c in "BCDEFGHIJK"]
    set_column_widths(ws, widths)
    time.sleep(3)


# ─── Вкладка 3: Реклама и соцсети ────────────────────────────────────────────
def update_tab3(sh, live, date1, date2, test=False):
    ws = sh.worksheet("ТЕСТ реклама" if test else "реклама и продвижение соцсети")
    print(f"  [3] Реклама и соцсети...")

    d1 = datetime.date.fromisoformat(date1)
    d2_dt = datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2_dt.strftime('%d.%m.%y')}"

    activities = scrape_tg_activities(date1, date2)
    existing = ws.get_all_values()

    block = [[label, ""]]
    for a in activities:
        block.append([a["title"], a["details"]])
    block += [["",""],["",""],["",""]]

    all_data = block + existing
    ws.clear()
    time.sleep(1)
    w(ws, "A1", all_data)

    fmt = [(f"A1", BOLD12)]
    for i in range(len(activities)):
        fmt.append((f"A{2+i}", BOLD11 + WRAP + BDR))
        fmt.append((f"B{2+i}", NORM11 + WRAP + BDR))
    format_cell_ranges(ws, fmt)
    set_column_widths(ws, [("A", 200), ("B", 500)])

    print(f"      ✓ {len(activities)} активностей")
    time.sleep(3)


# ─── Вкладка 4: Мероприятия ──────────────────────────────────────────────────
def get_previous_planned(ws):
    """Читает прошлонедельные 'запланированные мероприятия' из Sheet."""
    data = ws.get_all_values()
    planned = []
    in_planned = False
    for row in data:
        cells = [c.strip() for c in row]
        text = " ".join(cells).lower()
        if "запланированные мероприятия" in text:
            in_planned = True
            continue
        if in_planned:
            if not any(cells) or (len(cells[0]) > 2 and cells[0][0].isdigit() and "." in cells[0]):
                break
            if "проведенные мероприятия" in text:
                break
            title = cells[1] if len(cells) > 1 else cells[0]
            date_info = cells[2] if len(cells) > 2 else ""
            if title:
                planned.append({"title": title, "date": date_info})
    return planned


def dedup_key(title):
    """Ключ для дедупликации по первым значимым словам."""
    words = [w for w in title.lower().split() if len(w) > 3]
    return " ".join(words[:3])


def update_tab4(sh, live, date1, date2, test=False):
    ws = sh.worksheet("ТЕСТ мероприятия" if test else " продвижение/мероприятия ")
    print(f"  [4] Мероприятия...")

    d1 = datetime.date.fromisoformat(date1)
    d2_dt = datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2_dt.strftime('%d.%m.%y')}"

    # 1. ПРОВЕДЁННЫЕ = прошлонедельные "запланированные" + статус от Олеси
    prev_planned = get_previous_planned(ws)
    olesia_done, olesia_planned = load_olesia_events()

    done = []
    seen_keys = set()
    for pp in prev_planned:
        key = dedup_key(pp["title"])
        if key in seen_keys: continue
        seen_keys.add(key)
        # Обогащаем статусом/кол-вом от Олеси
        status = ""
        for od in olesia_done:
            if any(w in od["title"].lower() for w in key.split() if len(w) > 3):
                status = od.get("count", "")
                break
        done.append({"title": pp["title"], "count": status})

    # Добавляем от Олеси то, чего не было в запланированных
    for od in olesia_done:
        key = dedup_key(od["title"])
        if key not in seen_keys:
            seen_keys.add(key)
            done.append({"title": od["title"], "count": od.get("count", "")})

    # 2. ЗАПЛАНИРОВАННЫЕ = из ТГ + от Олеси (дедупликация)
    _, tg_planned = scrape_tg_events(date1, date2)
    planned = []
    plan_keys = set()
    for src in [tg_planned, olesia_planned]:
        for ev in src:
            key = dedup_key(ev["title"])
            if key not in plan_keys:
                plan_keys.add(key)
                planned.append(ev)

    # 3. Читаем старые данные
    existing = ws.get_all_values()

    # 4. Новый блок
    block = [["", label, ""]]
    block.append(["", "проведенные мероприятия", ""])
    for ev in done:
        block.append(["", ev["title"], ev.get("count", "")])
    block.append(["", "запланированные мероприятия", ""])
    for ev in planned:
        block.append(["", ev["title"], ev.get("date", "")])
    block.append(["", "", ""])

    all_data = block + existing
    ws.clear()
    time.sleep(1)
    w(ws, "A1", all_data)

    # 5. Форматирование — ВСЕ ячейки с рамками
    r = 1
    fmt = [(f"B{r}:C{r}", BOLD12 + BDR)]
    r += 1; fmt.append((f"B{r}:C{r}", BOLD + SECTION + BDR))
    for i in range(len(done)):
        r += 1; fmt.append((f"B{r}:C{r}", NORM11 + WRAP + BDR))
    r += 1; fmt.append((f"B{r}:C{r}", BOLD + EVENT_BG + BDR))
    for i in range(len(planned)):
        r += 1; fmt.append((f"B{r}:C{r}", NORM11 + WRAP + BDR))
    format_cell_ranges(ws, fmt)
    set_column_widths(ws, [("B", 350), ("C", 200)])

    print(f"      ✓ {len(done)} проведённых, {len(planned)} запланированных (дедупликация)")


# ─── Сбор данных из ТГ ────────────────────────────────────────────────────────
def scrape_tg_posts(date1, date2):
    import urllib.request
    channel = CONFIG["tg"]["channel"]
    req = urllib.request.Request(f"https://t.me/s/{channel}", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8")

    dates = re.findall(r'<time[^>]*datetime="([^"]+)"', html)
    texts = re.findall(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)

    posts = []
    for d, t in zip(dates, texts):
        day = d[:10]
        if date1 <= day <= date2:
            clean = re.sub(r'<[^>]+>', ' ', t).strip()
            clean = re.sub(r'\s+', ' ', clean)
            posts.append({"date": day, "text": clean})
    return posts

def generate_what_we_did(date1, date2):
    posts = scrape_tg_posts(date1, date2)
    lines = []
    for p in posts:
        dt = datetime.date.fromisoformat(p["date"])
        short = p["text"][:150].rstrip()
        if len(p["text"]) > 150: short += "..."
        lines.append(f"{dt.strftime('%d.%m')} — {short}")
    return lines or ["нет данных из ТГ за период"]

def scrape_website_pages(date1, date2):
    """Получает данные с padelvidnoe.ru через WordPress REST API + HTML парсинг."""
    import urllib.request
    items = []

    # 1. WordPress REST API — новые/изменённые страницы за период
    try:
        import requests as rq
        wp = "https://padelvidnoe.ru/wp-json/wp/v2"

        # Посты за период
        posts = rq.get(f"{wp}/posts", params={
            "per_page": 10, "after": f"{date1}T00:00:00",
            "before": f"{date2}T23:59:59", "orderby": "date"
        }, timeout=10)
        if posts.ok:
            for p in posts.json():
                title = re.sub(r'<[^>]+>', '', p["title"]["rendered"])
                items.append({
                    "title": f"Новый пост: {title[:70]}",
                    "details": f"{p['date'][:10]} — {p['link']}",
                    "source": "site"
                })

        # Страницы, изменённые за период
        pages = rq.get(f"{wp}/pages", params={
            "per_page": 20, "orderby": "modified", "order": "desc"
        }, timeout=10)
        if pages.ok:
            for p in pages.json():
                mod_date = p["modified"][:10]
                if date1 <= mod_date <= date2:
                    title = re.sub(r'<[^>]+>', '', p["title"]["rendered"])
                    items.append({
                        "title": f"Обновлена страница: {title[:60]}",
                        "details": f"{mod_date} — {p['link']}",
                        "source": "site"
                    })
        print(f"      WordPress API: {len(items)} изменений")
    except Exception as ex:
        print(f"      ⚠ WordPress API: {ex}")

    # 2. HTML парсинг — акции/события на главной (fallback)
    if not items:
        try:
            req = urllib.request.Request("https://padelvidnoe.ru/", headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode("utf-8")
            events = re.findall(
                r'<(?:h[1-4]|p|span)[^>]*>([^<]*(?:турнир|акци|тренировк|мастер|семейн)[^<]*)</(?:h[1-4]|p|span)>',
                html, re.IGNORECASE
            )
            for e in events:
                clean = e.strip()
                if len(clean) > 15:
                    items.append({"title": clean[:80], "details": "на сайте padelvidnoe.ru", "source": "site"})
        except Exception as ex:
            print(f"      ⚠ HTML парсинг: {ex}")

    return items


def load_olesia_input():
    """Загружает данные от Олеси из _manual_input.json (если есть)."""
    manual = json.loads((BASE / "_manual_input.json").read_text("utf-8"))
    items = []

    # Данные от Олеси для стр.3
    for item in manual.get("olesia_promo", []):
        items.append({"title": item.get("title",""), "details": item.get("details",""), "source": "olesia"})

    return items


def load_olesia_events():
    """Загружает мероприятия от Олеси из _manual_input.json."""
    manual = json.loads((BASE / "_manual_input.json").read_text("utf-8"))
    done = []
    planned = []

    for ev in manual.get("olesia_events_done", []):
        done.append({"title": ev.get("title",""), "count": ev.get("count",""), "source": "olesia"})
    for ev in manual.get("olesia_events_planned", []):
        planned.append({"title": ev.get("title",""), "date": ev.get("date",""), "source": "olesia"})

    return done, planned


def scrape_tg_activities(date1, date2):
    """Собирает активности из всех источников: ТГ + сайт + Олеся."""
    # 1. ТГ-канал
    posts = scrape_tg_posts(date1, date2)
    activities = []
    for p in posts:
        dt = datetime.date.fromisoformat(p["date"])
        title = re.split(r'[.!?\n]', p["text"])[0][:80].strip()
        if not title: title = p["text"][:60]
        details = f"{dt.strftime('%d.%m')} — {p['text'][:250]}"
        activities.append({"title": title, "details": details})

    # 2. Сайт padelvidnoe.ru
    site_items = scrape_website_pages(date1, date2)
    activities.extend(site_items)

    # 3. Данные от Олеси
    olesia_items = load_olesia_input()
    activities.extend(olesia_items)

    return activities


def scrape_tg_events(date1, date2):
    """Собирает мероприятия из всех источников: ТГ + Олеся."""
    posts = scrape_tg_posts(date1, date2)
    done, planned = [], []
    kw_done = ["итоги", "как это было", "прошёл", "прошел", "состоялся", "провели", "завершён"]
    kw_plan = ["турнир", "тренировк", "мастер-класс", "акция", "регистрация", "ближайш",
               "семейный день", "школа", "падел-день", "nadel", "nadin", "суханово",
               "знакомство", "скидка", "бесплатн", "открыт"]

    for p in posts:
        low = p["text"].lower()
        title = p["text"][:150].strip()
        dt = datetime.date.fromisoformat(p["date"])
        if any(k in low for k in kw_done):
            done.append({"title": title, "count": ""})
        elif any(k in low for k in kw_plan):
            planned.append({"title": title, "date": dt.strftime("%d.%m")})

    # Данные от Олеси
    ol_done, ol_planned = load_olesia_events()
    done.extend(ol_done)
    planned.extend(ol_planned)

    return done, planned


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 3:
        print("python update_sheet.py 2026-04-03 2026-04-09 [--test]"); sys.exit(1)

    date1, date2 = sys.argv[1], sys.argv[2]
    test = "--test" in sys.argv

    live = json.loads((BASE / "_live_data.json").read_text("utf-8"))
    history = json.loads((BASE / "_history.json").read_text("utf-8"))

    mode = "ТЕСТ" if test else "ПРОД"
    print(f"\n{'='*50}")
    print(f" Отчёт собственнику: {date1} → {date2} [{mode}]")
    print(f"{'='*50}\n")

    sh = connect()
    update_tab1(sh, live, history, date1, date2, test)
    update_tab2(sh, live, date1, date2, test)
    update_tab3(sh, live, date1, date2, test)
    update_tab4(sh, live, date1, date2, test)

    print(f"\n{'='*50}")
    print(" ✓ Все 4 вкладки обновлены!")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
