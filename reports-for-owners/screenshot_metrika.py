#!/usr/bin/env python3
"""
Генерирует скриншот таблицы источников трафика в стиле Яндекс Метрики.
Данные берёт из _live_data.json (реальные из API).
Сохраняет PNG → загружает в Google Drive → возвращает URL.

python screenshot_metrika.py
"""
import sys, io, json, pathlib, datetime
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent

def generate_metrika_html(live_data):
    """Генерирует HTML таблицы источников в стиле Яндекс Метрики."""
    m = live_data.get("metrika", {})
    period = live_data.get("period", {})
    d1 = period.get("date1", "")
    d2 = period.get("date2", "")
    sources = m.get("sources", [])
    total_visits = m.get("visits", 0)
    total_users = m.get("users", 0)

    # Цвета иконок источников (как в Метрике)
    colors = {
        "ad": "#f9c24d", "direct": "#e14b8c", "organic": "#3dbf61",
        "referral": "#66bfc9", "internal": "#ffb33f", "social": "#b06ad4",
        "messenger": "#a37ee0"
    }
    names_ru = {
        "ad": "Переходы по рекламе", "direct": "Прямые заходы",
        "organic": "Переходы из поисковых систем", "referral": "Переходы по ссылкам на сайтах",
        "internal": "Внутренние переходы", "social": "Переходы из социальных сетей",
        "messenger": "Переходы из мессенджеров"
    }

    def fmt_time(secs):
        if secs < 60: return f"{int(secs)} с"
        m, s = divmod(int(secs), 60)
        return f"{m} м {s:02d} с"

    def fmt_pct(val):
        return f"{val:.2f}%".replace(".", ",")

    def fmt_num(val):
        return f"{int(val):,}".replace(",", " ")

    rows_html = ""
    # Итого
    total_bounce = sum(s["bounce"] * s["visits"] for s in sources) / max(total_visits, 1)
    total_depth = sum(s["depth"] * s["visits"] for s in sources) / max(total_visits, 1)
    total_duration = sum(s["duration"] * s["visits"] for s in sources) / max(total_visits, 1)

    rows_html += f"""<tr class="total">
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

    d1_fmt = datetime.date.fromisoformat(d1).strftime("%d.%m.%Y") if d1 else ""
    d2_fmt = datetime.date.fromisoformat(d2).strftime("%d.%m.%Y") if d2 else ""

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body {{ font-family: "YS Text","Helvetica Neue",Arial,sans-serif; font-size: 13px; background: #fff; margin: 0; padding: 16px; color: #21201f; }}
.header {{ font-size: 11px; color: #7f7d7a; margin-bottom: 8px; }}
.header span {{ color: #21201f; font-weight: 500; }}
table {{ width: 100%; border-collapse: collapse; }}
th {{ text-align: right; padding: 10px 14px; font-weight: 400; color: #7f7d7a; font-size: 13px; border-bottom: 1px solid #eceaea; }}
th:first-child {{ text-align: left; padding-left: 12px; }}
td {{ padding: 10px 14px; border-bottom: 1px solid #eceaea; vertical-align: middle; }}
td.label {{ display: flex; align-items: center; gap: 8px; font-size: 13px; }}
.dot {{ width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }}
td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
.pct {{ display: block; color: #7f7d7a; font-size: 11px; margin-top: 1px; }}
tr.total td {{ background: #fbfbfa; font-weight: 500; }}
tr:hover td {{ background: #f8f7f6; }}
</style></head>
<body>
<div class="header">
    <span>Источники трафика</span> · Источник трафика (детально) · Тип площадки &nbsp;&nbsp;
    Период: {d1_fmt}–{d2_fmt}
</div>
<table>
<thead><tr>
    <th style="text-align:left">Источник</th>
    <th>Визиты ↓</th><th>Посетители</th><th>Отказы</th>
    <th>Глубина просмотра</th><th>Время на сайте</th>
</tr></thead>
<tbody>{rows_html}</tbody>
</table>
</body></html>"""
    return html


def render_to_png(html_content, output_path):
    """Рендерит HTML в PNG через Playwright."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 800, "height": 600})
        page.set_content(html_content)
        page.wait_for_timeout(500)
        # Автоподгон высоты
        height = page.evaluate("document.body.scrollHeight")
        page.set_viewport_size({"width": 800, "height": height + 40})
        page.screenshot(path=str(output_path), full_page=True)
        browser.close()
    print(f"  PNG: {output_path} ({output_path.stat().st_size // 1024} KB)")


def upload_to_drive(png_path):
    """Загружает PNG в Google Drive через сервисный аккаунт, возвращает public URL."""
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    creds = Credentials.from_service_account_file(
        str(BASE / "google_sa.json"),
        scopes=["https://www.googleapis.com/auth/drive.file"]
    )
    service = build("drive", "v3", credentials=creds)

    media = MediaFileUpload(str(png_path), mimetype="image/png")
    file_meta = {"name": png_path.name, "mimeType": "image/png"}
    uploaded = service.files().create(body=file_meta, media_body=media, fields="id,webViewLink").execute()
    file_id = uploaded["id"]

    # Сделать публичным
    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"}
    ).execute()

    url = f"https://drive.google.com/uc?id={file_id}"
    print(f"  Drive URL: {url}")
    return url


def insert_image_formula(sheet_id, tab_name, cell, image_url):
    """Вставляет =IMAGE() формулу в ячейку Google Sheet."""
    import gspread
    gc = gspread.service_account(filename=str(BASE / "google_sa.json"))
    sh = gc.open_by_key(sheet_id)
    ws = sh.worksheet(tab_name)
    ws.update(values=[[f'=IMAGE("{image_url}", 1)']],
              range_name=cell,
              value_input_option="USER_ENTERED")
    print(f"  =IMAGE() в {cell}")


def main():
    live = json.loads((BASE / "_live_data.json").read_text("utf-8"))
    config = json.loads((BASE / "_config.json").read_text("utf-8"))

    print("Генерация скриншота Метрики...")
    html = generate_metrika_html(live)

    # Сохраняем HTML (для отладки)
    html_path = BASE / "_metrika_screenshot.html"
    html_path.write_text(html, "utf-8")

    # Рендерим в PNG
    png_path = BASE / "_metrika_screenshot.png"
    render_to_png(html, png_path)

    # Загружаем в Drive
    try:
        url = upload_to_drive(png_path)
    except Exception as e:
        print(f"  ⚠ Drive upload failed: {e}")
        print(f"  Используй локальный файл: {png_path}")
        return str(png_path)

    # Вставляем в Google Sheet
    test = "--test" in sys.argv
    tab = "ТЕСТ сайт ТГ" if test else "сайт ТГ "
    insert_image_formula(config["google_sheet"]["spreadsheet_id"], tab, "B4", url)

    print("✓ Скриншот Метрики вставлен!")
    return url


if __name__ == "__main__":
    main()
