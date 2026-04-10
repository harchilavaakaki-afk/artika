#!/usr/bin/env python3
"""
Яндекс Директ API v5 → _live_data.json
Агентский доступ: artikavidnoe → sportvsegda-direct
Использование: python connector_direct.py 2026-04-10 2026-04-16
"""
import sys, json, pathlib, requests, time, io, csv
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
LIVE = BASE / "_live_data.json"
REPORTS_URL = "https://api.direct.yandex.com/json/v5/reports"

FIELDS = [
    "Date", "Impressions", "Clicks", "Ctr",
    "Cost", "AvgCpc", "AvgPageviews"
]

def fetch_campaign_report(token, client_login, campaign_id, campaign_name, date1, date2):
    """Запрашивает отчёт по одной кампании. Возвращает список строк (по дням)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Client-Login": client_login,
        "Accept-Language": "ru",
        "processingMode": "auto",
        "returnMoneyInMicros": "false",
        "skipReportHeader": "true",
        "skipColumnHeader": "false",
        "skipReportSummary": "true",
    }
    body = {
        "params": {
            "SelectionCriteria": {
                "DateFrom": date1,
                "DateTo": date2,
                "Filter": [
                    {"Field": "CampaignId", "Operator": "EQUALS", "Values": [str(campaign_id)]}
                ]
            },
            "FieldNames": FIELDS,
            "ReportName": f"WeeklyReport_{campaign_id}_{date1}",
            "ReportType": "CAMPAIGN_PERFORMANCE_REPORT",
            "DateRangeType": "CUSTOM_DATE",
            "Format": "TSV",
            "IncludeVAT": "NO",
            "IncludeDiscount": "YES"
        }
    }

    # Polling loop (API может вернуть 201/202 если отчёт не готов)
    for attempt in range(10):
        r = requests.post(REPORTS_URL, headers=headers, json=body, timeout=60)
        if r.status_code == 200:
            break
        elif r.status_code in (201, 202):
            wait = int(r.headers.get("retryIn", "10"))
            print(f"  Отчёт готовится, ждём {wait}с...")
            time.sleep(wait)
        else:
            print(f"  ОШИБКА {r.status_code}: {r.text[:300]}")
            return None, None
    else:
        print("  Таймаут ожидания отчёта")
        return None, None

    # Парсим TSV
    rows = []
    total_row = None
    reader = csv.DictReader(io.StringIO(r.text), delimiter="\t")
    for row in reader:
        if row.get("Date") == "Total":
            total_row = row
        else:
            rows.append(row)

    return rows, total_row

def fmt(val):
    """Форматирует числовое значение из API."""
    if val in (None, "--", ""):
        return None
    try:
        return round(float(val), 2)
    except ValueError:
        return val

def fetch(date1, date2):
    token = CONFIG["direct"]["oauth_token"]
    client_login = CONFIG["direct"]["client_login"]
    if not token:
        print("ERROR: direct.oauth_token не заполнен в _config.json")
        sys.exit(1)

    campaigns = CONFIG["direct"]["campaigns"]
    result = []

    for camp in campaigns:
        cid, name = camp["id"], camp["name"]
        print(f"  Загружаю кампанию '{name}' ({cid})...")
        rows, total = fetch_campaign_report(token, client_login, cid, name, date1, date2)
        if rows is None:
            print(f"  Не удалось получить данные для {name}")
            continue

        # Форматируем строки
        daily = []
        for r in rows:
            daily.append({
                "date": r.get("Date"),
                "impressions": fmt(r.get("Impressions")),
                "clicks": fmt(r.get("Clicks")),
                "ctr": fmt(r.get("Ctr")),
                "cost": fmt(r.get("Cost")),
                "avg_cpc": fmt(r.get("AvgCpc")),
                "depth": fmt(r.get("AvgPageviews")),
            })

        # Итоги
        # Считаем итоги из daily
        totals = {}
        if daily:
            totals = {
                "impressions": sum(d["impressions"] or 0 for d in daily),
                "clicks": sum(d["clicks"] or 0 for d in daily),
                "cost": round(sum(d["cost"] or 0 for d in daily), 2),
            }
            if totals["impressions"]:
                totals["ctr"] = round(totals["clicks"] / totals["impressions"] * 100, 2)
            if totals["clicks"]:
                totals["avg_cpc"] = round(totals["cost"] / totals["clicks"], 2)
                totals["avg_daily_cost"] = round(totals["cost"] / len(daily), 2)

        result.append({"id": cid, "name": name, "daily": daily, "totals": totals})
        print(f"  ✓ {name}: {len(daily)} дней, итого {totals.get('clicks',0)} кликов, {totals.get('cost',0)} руб.")

    # Сохраняем
    live = {}
    if LIVE.exists():
        live = json.loads(LIVE.read_text("utf-8"))
    live.setdefault("period", {}).update({"date1": date1, "date2": date2})
    live["direct"] = result
    LIVE.write_text(json.dumps(live, ensure_ascii=False, indent=2), "utf-8")
    print(f"✓ Директ: {len(result)} кампаний сохранено в _live_data.json")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Использование: python connector_direct.py 2026-04-10 2026-04-16")
        sys.exit(1)
    fetch(sys.argv[1], sys.argv[2])
