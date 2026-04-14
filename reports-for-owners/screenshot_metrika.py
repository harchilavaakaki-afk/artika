#!/usr/bin/env python3
"""
Скриншот Метрики (источники трафика) → PNG → GitHub → Google Sheet.

  python screenshot_metrika.py                  # прод
  python screenshot_metrika.py --test           # тестовая вкладка

Генерирует HTML из _live_data.json, рендерит через Playwright,
загружает PNG на GitHub, вставляет =IMAGE() в ячейку B4.

⚠️ НЕ МЕНЯТЬ БЕЗ ЯВНОГО ЗАПРОСА.
"""
import sys, io, json, pathlib, datetime, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
SHEET_ID = CONFIG["google_sheet"]["spreadsheet_id"]


# ─── HTML генерация (стиль Яндекс Метрики) ───────────────────────────────────
def generate_metrika_html(live_data):
    m = live_data.get("metrika", {})
    period = live_data.get("period", {})
    d1, d2 = period.get("date1", ""), period.get("date2", "")
    sources = m.get("sources", [])
    total_visits = m.get("visits", 0)
    total_users = m.get("users", 0)

    colors = {
        "ad": "#f9c24d", "direct": "#e14b8c", "organic": "#3dbf61",
        "referral": "#66bfc9", "internal": "#ffb33f", "social": "#b06ad4",
        "messenger": "#a37ee0",
    }
    names_ru = {
        "ad": "Переходы по рекламе", "direct": "Прямые заходы",
        "organic": "Переходы из поисковых систем",
        "referral": "Переходы по ссылкам на сайтах",
        "internal": "Внутренние переходы",
        "social": "Переходы из социальных сетей",
        "messenger": "Переходы из мессенджеров",
    }

    def fmt_time(secs):
        if secs < 60:
            return f"{int(secs)} с"
        mi, s = divmod(int(secs), 60)
        return f"{mi} м {s:02d} с"

    def fmt_pct(val):
        return f"{val:.2f}%".replace(".", ",")

    def fmt_num(val):
        return f"{int(val):,}".replace(",", " ")

    # Итого
    total_bounce = sum(s["bounce"] * s["visits"] for s in sources) / max(total_visits, 1)
    total_depth = sum(s["depth"] * s["visits"] for s in sources) / max(total_visits, 1)
    total_duration = sum(s["duration"] * s["visits"] for s in sources) / max(total_visits, 1)

    rows_html = f"""<tr class="total">
        <td class="label"><span class="dot" style="background:#8a70ff"></span> Итого и средние</td>
        <td class="num">{fmt_num(total_visits)}<span class="pct">100,00%</span></td>
        <td class="num">{fmt_num(total_users)}<span class="pct">100,00%</span></td>
        <td class="num">{fmt_pct(total_bounce)}</td>
        <td class="num">{total_depth:.2f}</td>
        <td class="num">{fmt_time(total_duration)}</td>
    </tr>"""

    for s in sources:
        pct_v = s["visits"] / max(total_visits, 1) * 100
        pct_u = s["users"] / max(total_users, 1) * 100
        color = colors.get(s["id"], "#999")
        name = names_ru.get(s["id"], s["name"])
        rows_html += f"""<tr>
            <td class="label"><span class="dot" style="background:{color}"></span> {name}</td>
            <td class="num">{fmt_num(s['visits'])}<span class="pct">{pct_v:.2f}%</span></td>
            <td class="num">{fmt_num(s['users'])}<span class="pct">{pct_u:.2f}%</span></td>
            <td class="num">{fmt_pct(s['bounce'])}</td>
            <td class="num">{s['depth']:.2f}</td>
            <td class="num">{fmt_time(s['duration'])}</td>
        </tr>"""

    d1f = datetime.date.fromisoformat(d1).strftime("%d.%m.%Y") if d1 else ""
    d2f = datetime.date.fromisoformat(d2).strftime("%d.%m.%Y") if d2 else ""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body {{ font-family: "YS Text","Helvetica Neue",Arial,sans-serif; font-size: 13px;
       background: #fff; margin: 0; padding: 16px; color: #21201f; }}
.header {{ font-size: 11px; color: #7f7d7a; margin-bottom: 8px; }}
.header span {{ color: #21201f; font-weight: 500; }}
table {{ width: 100%; border-collapse: collapse; }}
th {{ text-align: right; padding: 10px 14px; font-weight: 400; color: #7f7d7a;
     font-size: 13px; border-bottom: 1px solid #eceaea; }}
th:first-child {{ text-align: left; padding-left: 12px; }}
td {{ padding: 10px 14px; border-bottom: 1px solid #eceaea; vertical-align: middle; }}
td.label {{ display: flex; align-items: center; gap: 8px; font-size: 13px; }}
.dot {{ width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
.pct {{ display: block; color: #7f7d7a; font-size: 11px; margin-top: 1px; }}
tr.total td {{ background: #fbfbfa; font-weight: 500; }}
</style></head>
<body>
<div class="header">
    <span>Источники трафика</span> &middot; Источник трафика (детально)
    &nbsp;&nbsp; Период: {d1f}&ndash;{d2f}
</div>
<table>
<thead><tr>
    <th style="text-align:left">Источник</th>
    <th>Визиты</th><th>Посетители</th><th>Отказы</th>
    <th>Глубина просмотра</th><th>Время на сайте</th>
</tr></thead>
<tbody>{rows_html}</tbody>
</table>
</body></html>"""


# ─── Playwright → PNG ─────────────────────────────────────────────────────────
def render_to_png(html_content, output_path):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 800, "height": 600})
        page.set_content(html_content)
        page.wait_for_timeout(500)
        height = page.evaluate("document.body.scrollHeight")
        page.set_viewport_size({"width": 800, "height": height + 40})
        page.screenshot(path=str(output_path), full_page=True)
        browser.close()
    print(f"  PNG: {output_path.name} ({output_path.stat().st_size // 1024} KB)")


# ─── GitHub upload ────────────────────────────────────────────────────────────
def upload_to_github(png_path):
    import urllib.request, urllib.error, base64, json as _json
    token = os.environ.get("GITHUB_TOKEN", "")
    repo = "harchilavaakaki-afk/artika"
    gh_path = f"reports-screenshots/{png_path.name}"
    api_url = f"https://api.github.com/repos/{repo}/contents/{gh_path}"

    content_b64 = base64.b64encode(png_path.read_bytes()).decode()

    sha = None
    try:
        req = urllib.request.Request(api_url,
            headers={"Authorization": f"token {token}", "User-Agent": "artika-bot"})
        with urllib.request.urlopen(req) as resp:
            sha = _json.loads(resp.read())["sha"]
    except urllib.error.HTTPError:
        pass

    payload = {"message": f"screenshot {png_path.name}", "content": content_b64}
    if sha:
        payload["sha"] = sha

    data = _json.dumps(payload).encode()
    req = urllib.request.Request(api_url, data=data, method="PUT",
        headers={"Authorization": f"token {token}",
                 "Content-Type": "application/json",
                 "User-Agent": "artika-bot"})
    with urllib.request.urlopen(req) as resp:
        result = _json.loads(resp.read())

    raw_url = result["content"]["download_url"]
    print(f"  GitHub: {raw_url}")
    return raw_url


# ─── Вставка в Google Sheet ──────────────────────────────────────────────────
def insert_into_sheet(image_url, test=False):
    import gspread
    gc = gspread.service_account(filename=str(BASE / "google_sa.json"))
    sh = gc.open_by_key(SHEET_ID)
    tab = "ТЕСТ сайт ТГ" if test else "сайт ТГ "
    ws = sh.worksheet(tab)

    # 1. =IMAGE() формула в B4
    ws.update(values=[[f'=IMAGE("{image_url}", 1)']],
              range_name="B4",
              value_input_option="USER_ENTERED")

    # 2. Высота строк 4-22 для отображения картинки
    requests = []
    # Строка 4 — основная (высокая, 300px)
    requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": ws.id, "dimension": "ROWS",
                      "startIndex": 3, "endIndex": 4},
            "properties": {"pixelSize": 300},
            "fields": "pixelSize",
        }
    })
    # Строки 5-22 — скрыть (высота 2px), чтобы не занимали место
    requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": ws.id, "dimension": "ROWS",
                      "startIndex": 4, "endIndex": 22},
            "properties": {"pixelSize": 2},
            "fields": "pixelSize",
        }
    })
    sh.batch_update({"requests": requests})
    print(f"  =IMAGE() в B4, строки настроены")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    test = "--test" in sys.argv
    live = json.loads((BASE / "_live_data.json").read_text("utf-8"))

    print("Скриншот Метрики...")

    # 1. HTML
    html = generate_metrika_html(live)
    html_path = BASE / "_metrika_screenshot.html"
    html_path.write_text(html, "utf-8")

    # 2. PNG
    png_path = BASE / "_metrika_screenshot.png"
    render_to_png(html, png_path)

    # 3. GitHub
    try:
        url = upload_to_github(png_path)
    except Exception as e:
        print(f"  GitHub FAIL: {e}")
        print(f"  Файл: {png_path}")
        return

    # 4. Google Sheet
    try:
        insert_into_sheet(url, test)
    except Exception as e:
        print(f"  Sheet FAIL: {e}")
        print(f"  URL для ручной вставки: {url}")
        return

    mode = "ТЕСТ" if test else "ПРОД"
    print(f"OK [{mode}] {url}")


if __name__ == "__main__":
    main()
