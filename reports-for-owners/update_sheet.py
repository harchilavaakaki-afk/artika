#!/usr/bin/env python3
"""
Обновление Google Sheet — отчёт собственнику.

  python update_sheet.py 2026-04-03 2026-04-09 --test --tab 1
  python update_sheet.py 2026-04-03 2026-04-09 --test          # все
  python update_sheet.py 2026-04-03 2026-04-09                  # ПРОД

⚠️ НЕ МЕНЯТЬ ЭТОТ ФАЙЛ БЕЗ ЯВНОГО ЗАПРОСА.
"""
import sys, io, json, pathlib, datetime, re, time, argparse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import gspread
from gspread.utils import rowcol_to_a1
from gspread_formatting import (
    CellFormat, TextFormat, Color,
    format_cell_ranges, set_column_widths,
)

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
SHEET_ID = CONFIG["google_sheet"]["spreadsheet_id"]

TABS = {
    1: {"prod": "сайт ТГ ",                    "test": "ТЕСТ сайт ТГ"},
    2: {"prod": "директ",                       "test": "ТЕСТ директ"},
    3: {"prod": "реклама и продвижение соцсети", "test": "ТЕСТ реклама"},
    4: {"prod": " продвижение/мероприятия ",     "test": "ТЕСТ мероприятия"},
}

# ─── Styles (borders via raw Sheets API, NOT gspread_formatting) ──────────────
TF  = lambda **kw: TextFormat(**kw)
CLR = lambda r, g, b: Color(r, g, b)

BOLD13     = CellFormat(textFormat=TF(bold=True, fontSize=13))
BOLD12     = CellFormat(textFormat=TF(bold=True, fontSize=12))
BOLD11     = CellFormat(textFormat=TF(bold=True, fontSize=11))
BOLD       = CellFormat(textFormat=TF(bold=True))
NORM11     = CellFormat(textFormat=TF(fontSize=11))
SMALL      = CellFormat(textFormat=TF(fontSize=9))
CENTER     = CellFormat(horizontalAlignment="CENTER", verticalAlignment="MIDDLE")
WRAP       = CellFormat(wrapStrategy="WRAP")
YELLOW     = CellFormat(backgroundColor=CLR(1, .93, .63))
LIGHT_BG   = CellFormat(backgroundColor=CLR(1, .96, .84))
DIRECT_BG  = CellFormat(backgroundColor=CLR(1, .95, .88))
SECTION_BG = CellFormat(backgroundColor=CLR(.96, .96, .95))
EVENT_BG   = CellFormat(backgroundColor=CLR(.95, .9, .96))
GRAY_IT    = CellFormat(textFormat=TF(fontSize=11, italic=True,
                                      foregroundColor=CLR(.42, .42, .42)))
LINK_FMT   = CellFormat(textFormat=TF(foregroundColor=CLR(.02, .39, .76),
                                      underline=True))


# ─── Helpers ──────────────────────────────────────────────────────────────────
def connect():
    gc = gspread.service_account(filename=str(BASE / "google_sa.json"))
    return gc.open_by_key(SHEET_ID)


def col_letter(n):
    return rowcol_to_a1(1, n).rstrip("1")


def w(ws, rng, data):
    ws.update(values=data, range_name=rng)


def apply_borders(sh, ws, ranges):
    """Рамки через raw Sheets API.  ranges: [(row1, row2, col1, col2), ...] — 1-indexed."""
    if not ranges:
        return
    border = {"style": "SOLID",
              "colorStyle": {"rgbColor": {"red": 0.6, "green": 0.6, "blue": 0.6}}}
    requests = []
    for row1, row2, col1, col2 in ranges:
        requests.append({
            "updateBorders": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": row1 - 1, "endRowIndex": row2,
                    "startColumnIndex": col1 - 1, "endColumnIndex": col2,
                },
                "top": border, "bottom": border,
                "left": border, "right": border,
                "innerHorizontal": border, "innerVertical": border,
            }
        })
    sh.batch_update({"requests": requests})


def find_data_ranges(all_data, check_cols, col1, col2, require_all=False):
    """Группирует смежные непустые строки в диапазоны для рамок.
    check_cols:  0-indexed колонки для проверки данных.
    col1, col2:  1-indexed диапазон колонок для рамок.
    require_all: True = ВСЕ check_cols непустые; False = любая.
    """
    ranges, start = [], None
    for i, row in enumerate(all_data, start=1):
        cells = [str(row[c]).strip() if c < len(row) else "" for c in check_cols]
        has_data = all(cells) if require_all else any(cells)
        if has_data:
            if start is None:
                start = i
        else:
            if start is not None:
                ranges.append((start, i - 1, col1, col2))
                start = None
    if start is not None:
        ranges.append((start, len(all_data), col1, col2))
    return ranges


# ─── Data loading ─────────────────────────────────────────────────────────────
def load_live():
    return json.loads((BASE / "_live_data.json").read_text("utf-8"))

def load_history():
    return json.loads((BASE / "_history.json").read_text("utf-8"))

def load_manual():
    return json.loads((BASE / "_manual_input.json").read_text("utf-8"))


def sync_history(date1, date2):
    """Дописывает текущую неделю из _live_data.json в _history.json (если ещё нет)."""
    h = load_history()
    live = load_live()
    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2.strftime('%d.%m.%y')}"

    # Проверяем — уже есть?
    if label in h["leads"]["periods"]:
        return

    # Лиды из Calltouch
    ct = live.get("calltouch", {})
    leads = ct.get("leads", 0)

    # ТГ клики из Метрики
    m = live.get("metrika", {})
    tg_clicks = m.get("tg_clicks", 0)

    # Подписчики из ТГ коннектора
    tg = live.get("tg", {})
    subs = tg.get("subscribers", 0)

    if not leads and not tg_clicks and not subs:
        print("  ⚠ _live_data.json пустой — запусти build_week.sh сначала")
        return

    h["leads"]["periods"].append(label)
    h["leads"]["values"].append(leads)
    h["tg_clicks"]["periods"].append(label)
    h["tg_clicks"]["values"].append(tg_clicks)
    h["subscribers"]["dates"].append(d2.strftime("%d.%m.%Y"))
    h["subscribers"]["values"].append(subs)

    (BASE / "_history.json").write_text(
        json.dumps(h, ensure_ascii=False, indent=2), "utf-8")
    print(f"  ✓ История обновлена: лиды={leads}, ТГ={tg_clicks}, подписчики={subs}")


# ─── TG / WP scraping (логика коннекторов — не менять) ────────────────────────
def scrape_tg_posts(date1, date2):
    import urllib.request
    channel = CONFIG["tg"]["channel"]
    req = urllib.request.Request(
        f"https://t.me/s/{channel}", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8")
    dates = re.findall(r'<time[^>]*datetime="([^"]+)"', html)
    texts = re.findall(
        r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
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
        if len(p["text"]) > 150:
            short += "..."
        lines.append(f"{dt.strftime('%d.%m')} — {short}")
    return lines or ["нет данных из ТГ за период"]


def scrape_website_pages(date1, date2):
    items = []
    try:
        import requests as rq
        wp = "https://padelvidnoe.ru/wp-json/wp/v2"
        resp = rq.get(f"{wp}/posts", params={
            "per_page": 10, "after": f"{date1}T00:00:00",
            "before": f"{date2}T23:59:59", "orderby": "date"
        }, timeout=10)
        if resp.ok:
            for p in resp.json():
                title = re.sub(r'<[^>]+>', '', p["title"]["rendered"])
                items.append({"title": f"Новый пост: {title[:70]}",
                              "details": f"{p['date'][:10]} — {p['link']}"})
        resp = rq.get(f"{wp}/pages", params={
            "per_page": 20, "orderby": "modified", "order": "desc"
        }, timeout=10)
        if resp.ok:
            for p in resp.json():
                mod = p["modified"][:10]
                if date1 <= mod <= date2:
                    title = re.sub(r'<[^>]+>', '', p["title"]["rendered"])
                    items.append({"title": f"Обновлена: {title[:60]}",
                                  "details": f"{mod} — {p['link']}"})
    except Exception as ex:
        print(f"      ⚠ WordPress API: {ex}")
    return items


def collect_tab3_activities(date1, date2):
    posts = scrape_tg_posts(date1, date2)
    activities = []
    for p in posts:
        dt = datetime.date.fromisoformat(p["date"])
        title = re.split(r'[.!?\n]', p["text"])[0][:80].strip() or p["text"][:60]
        activities.append({"title": title, "details": f"{dt.strftime('%d.%m')} — {p['text'][:250]}"})
    activities.extend(scrape_website_pages(date1, date2))
    for item in load_manual().get("olesia_promo", []):
        activities.append({"title": item.get("title", ""), "details": item.get("details", "")})
    return activities


# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1: Сайт и ТГ
# ═══════════════════════════════════════════════════════════════════════════════
def update_tab1(sh, date1, date2, test=False):
    tab = TABS[1]["test" if test else "prod"]
    ws = sh.worksheet(tab)
    print(f"  [1] {tab}...")

    # Синхронизация: _live_data.json → _history.json (текущая неделя)
    sync_history(date1, date2)

    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    hdr = f"статистика по просмотрам {d1.strftime('%d.%m')}-{d2.strftime('%d.%m.%Y')}"

    h = load_history()
    lp, lv = h["leads"]["periods"], h["leads"]["values"]
    tp, tv = h["tg_clicks"]["periods"], h["tg_clicks"]["values"]
    sd, sv = h["subscribers"]["dates"], h["subscribers"]["values"]
    nl, nt, ns = len(lp), len(tp), len(sd)

    what = generate_what_we_did(date1, date2)

    # ─── Data ───
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

    # ─── Format ───
    lc = col_letter(2 + nl)
    tc = col_letter(3 + nt)
    sc = col_letter(2 + ns)

    fmt = [
        ("B2", BOLD13), ("B3", GRAY_IT), ("B33", LINK_FMT),
        ("B24", BOLD11 + WRAP), ("B27", BOLD11), ("B34", BOLD11), ("B39", BOLD12),
        (f"C24:{lc}24", SMALL + CENTER), (f"C25:{lc}25", BOLD + CENTER),
        (f"D27:{tc}27", SMALL + CENTER), (f"D28:{tc}28", BOLD + CENTER),
        (f"C34:{sc}34", SMALL + CENTER), (f"C35:{sc}35", BOLD + CENTER),
        (f"{lc}24:{lc}25", YELLOW),
        (f"{tc}27:{tc}28", YELLOW),
        (f"{sc}34:{sc}35", YELLOW),
    ]
    format_cell_ranges(ws, fmt)
    set_column_widths(ws, [("B", 280)] + [(col_letter(i), 95) for i in range(3, 3 + nl)])

    # ─── Borders (raw API) ───
    apply_borders(sh, ws, [
        (24, 25, 3, 2 + nl),   # лиды: C-last, строки 24-25
        (27, 28, 4, 3 + nt),   # ТГ клики: D-last, строки 27-28
        (34, 35, 3, 2 + ns),   # подписчики: C-last, строки 34-35
    ])

    print(f"      ✓ Лиды: {lv[-1]}, ТГ: {tv[-1]}, Подписчики: {sv[-1]}, {len(what)} действий")
    time.sleep(2)


# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: Директ
# ═══════════════════════════════════════════════════════════════════════════════
def update_tab2(sh, date1, date2, test=False):
    tab = TABS[2]["test" if test else "prod"]
    ws = sh.worksheet(tab)
    print(f"  [2] {tab}...")

    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    d1s, d2s = d1.strftime("%d.%m.%Y"), d2.strftime("%d.%m.%Y")

    campaigns = load_live().get("direct", [])
    if not campaigns:
        print("      ⚠ Нет данных директа"); return

    H_TOT = ["Всего", "", "Ср.расход за день (руб.)", "Показы", "Клики", "CTR (%)",
             "Расход (руб.)", "Ср. цена клика (руб.)", "Глубина (стр.)",
             "Конверсия (%)/страница Спасибо", "Конверсия (%)/Звонок Calltouch"]
    H_DAY = ["Дата", "Показы", "Клики", "CTR (%)", "Расход (руб.)",
             "Ср. цена клика (руб.)", "Глубина (стр.)",
             "Конверсия (%)/страница Спасибо", "Конверсия (%)/Звонок Calltouch"]

    START_ROWS = [4, 20]
    fmt_list, brd = [], []

    for idx, camp in enumerate(campaigns[:2]):
        r = START_ROWS[idx]
        t = camp.get("totals", {})
        daily = camp.get("daily", [])
        nd = len(daily)
        depth_avg = round(
            sum(d.get("depth", 0) or 0 for d in daily) / max(nd, 1), 2)

        title = f'Кампания "{camp["name"]}" ({camp["id"]}), период {d1s} - {d2s}'
        tot = [f"с {d1s} по {d2s}", "",
               round(t.get("avg_daily_cost", 0), 2),
               int(t.get("impressions", 0)), int(t.get("clicks", 0)),
               t.get("ctr", 0), round(t.get("cost", 0), 2),
               round(t.get("avg_cpc", 0), 2), depth_avg, "-", "-"]

        rows = []
        for d in daily:
            dt = datetime.date.fromisoformat(d["date"])
            rows.append([
                dt.strftime("%d.%m.%Y"), int(d.get("impressions", 0)),
                int(d.get("clicks", 0)), d.get("ctr", 0),
                round(d.get("cost", 0), 2), round(d.get("avg_cpc", 0), 2),
                d.get("depth", 0), "-", "-"])

        w(ws, f"A{r}", [[title] + [""] * 10])
        w(ws, f"A{r+1}", [H_TOT])
        w(ws, f"A{r+2}", [tot])
        w(ws, f"A{r+4}", [H_DAY])
        if rows:
            w(ws, f"A{r+5}", rows)

        fmt_list += [
            (f"A{r}:K{r}", BOLD12 + DIRECT_BG),
            (f"A{r+1}:K{r+1}", BOLD + SECTION_BG + CENTER),
            (f"A{r+2}:K{r+2}", BOLD + CENTER + LIGHT_BG),
            (f"A{r+4}:I{r+4}", BOLD + SECTION_BG + CENTER),
        ]
        if nd:
            fmt_list.append((f"A{r+5}:I{r+4+nd}", CENTER))

        brd += [(r, r, 1, 11), (r + 1, r + 2, 1, 11)]
        if nd:
            brd.append((r + 4, r + 4 + nd, 1, 9))

        print(f"      ✓ {camp['name']}: {t.get('clicks', 0)} кликов, {t.get('cost', 0)} руб.")

    w(ws, "A33", [
        ["Что делаем:"],
        ["ежедневный мониторинг, наблюдаем за РК на поиске и РСЯ"],
        ["специалист от яндекс директ готовит дополнительные рекомендации по РК"],
    ])
    fmt_list.append(("A33", BOLD12))

    format_cell_ranges(ws, fmt_list)
    set_column_widths(ws, [("A", 120)] + [(c, 110) for c in "BCDEFGHIJK"])
    apply_borders(sh, ws, brd)
    time.sleep(2)


# ═══════════════════════════════════════════════════════════════════════════════
# TAB 3: Реклама и продвижение соцсети (накопительная — новый блок сверху)
# ═══════════════════════════════════════════════════════════════════════════════
def update_tab3(sh, date1, date2, test=False):
    tab = TABS[3]["test" if test else "prod"]
    ws = sh.worksheet(tab)
    print(f"  [3] {tab}...")

    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2.strftime('%d.%m.%y')}"

    activities = collect_tab3_activities(date1, date2)
    existing = ws.get_all_values()

    # Новый блок сверху + старые данные
    block = [[label, ""]]
    for a in activities:
        block.append([a["title"], a["details"]])
    block.append(["", ""])   # разделитель
    all_data = block + existing

    ws.clear()
    time.sleep(1)
    w(ws, "A1", all_data)

    # Формат ВСЕХ строк (новые + старые)
    fmt = []
    for i, row in enumerate(all_data, start=1):
        a = str(row[0]).strip() if len(row) > 0 else ""
        b = str(row[1]).strip() if len(row) > 1 else ""
        if not a and not b:
            continue
        if a and not b:
            # Заголовок периода (A заполнена, B пуста)
            fmt.append((f"A{i}", BOLD12))
        else:
            # Активность (название + описание)
            fmt.append((f"A{i}", BOLD11 + WRAP))
            fmt.append((f"B{i}", NORM11 + WRAP))
    format_cell_ranges(ws, fmt)
    set_column_widths(ws, [("A", 200), ("B", 500)])

    # Рамки на строки активностей (где заполнены И A, И B)
    brd = find_data_ranges(all_data, [0, 1], 1, 2, require_all=True)
    apply_borders(sh, ws, brd)

    print(f"      ✓ {len(activities)} активностей")
    time.sleep(2)


# ═══════════════════════════════════════════════════════════════════════════════
# TAB 4: Мероприятия (накопительная — новый блок сверху)
# ═══════════════════════════════════════════════════════════════════════════════
def update_tab4(sh, date1, date2, test=False):
    tab = TABS[4]["test" if test else "prod"]
    ws = sh.worksheet(tab)
    print(f"  [4] {tab}...")

    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    label = f"{d1.strftime('%d')}-{d2.strftime('%d.%m.%y')}"

    manual = load_manual()
    done = manual.get("olesia_events_done", [])
    planned = manual.get("olesia_events_planned", [])
    existing = ws.get_all_values()

    # Новый блок
    block = [["", label, ""]]
    block.append(["", "проведенные мероприятия", ""])
    for ev in done:
        block.append(["", ev.get("title", ""), ev.get("count", "")])
    block.append(["", "запланированные мероприятия", ""])
    for ev in planned:
        block.append(["", ev.get("title", ""), ev.get("date", "")])
    block.append(["", "", ""])   # разделитель
    all_data = block + existing

    ws.clear()
    time.sleep(1)
    w(ws, "A1", all_data)

    # Формат ВСЕХ строк
    fmt = []
    for i, row in enumerate(all_data, start=1):
        b = str(row[1]).strip() if len(row) > 1 else ""
        if not b:
            continue
        if b == "проведенные мероприятия":
            fmt.append((f"B{i}:C{i}", BOLD))
        elif b == "запланированные мероприятия":
            fmt.append((f"B{i}:C{i}", BOLD))
        elif re.match(r'\d{1,2}[\.-]\d', b) and len(b) < 20:
            fmt.append((f"B{i}:C{i}", BOLD12))
        else:
            fmt.append((f"B{i}:C{i}", NORM11 + WRAP))
    format_cell_ranges(ws, fmt)
    set_column_widths(ws, [("B", 350), ("C", 200)])

    # Рамки на ВСЕ непустые строки (B или C)
    brd = find_data_ranges(all_data, [1, 2], 2, 3, require_all=False)
    apply_borders(sh, ws, brd)

    print(f"      ✓ {len(done)} проведённых, {len(planned)} запланированных")
    time.sleep(2)


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    p = argparse.ArgumentParser(description="Отчёт собственнику → Google Sheets")
    p.add_argument("date1", help="YYYY-MM-DD начало")
    p.add_argument("date2", help="YYYY-MM-DD конец")
    p.add_argument("--test", action="store_true", help="Тестовые вкладки")
    p.add_argument("--tab", type=int, choices=[1, 2, 3, 4],
                   help="Только одна вкладка")
    args = p.parse_args()

    manual = load_manual()
    if not (manual.get("olesia_events_done")
            or manual.get("olesia_events_planned")
            or manual.get("olesia_promo")):
        print("❌ _manual_input.json пустой! Заполни данные от Олеси.")
        sys.exit(1)

    mode = "ТЕСТ" if args.test else "ПРОД"
    tab_info = f"вкладка {args.tab}" if args.tab else "все"
    print(f"\n{'='*50}")
    print(f" Отчёт: {args.date1} → {args.date2} [{mode}] {tab_info}")
    print(f"{'='*50}\n")

    sh = connect()
    runners = {
        1: lambda: update_tab1(sh, args.date1, args.date2, args.test),
        2: lambda: update_tab2(sh, args.date1, args.date2, args.test),
        3: lambda: update_tab3(sh, args.date1, args.date2, args.test),
        4: lambda: update_tab4(sh, args.date1, args.date2, args.test),
    }

    for t in ([args.tab] if args.tab else [1, 2, 3, 4]):
        runners[t]()

    print(f"\n{'='*50}")
    print(f" ✓ Готово! [{mode}]")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
