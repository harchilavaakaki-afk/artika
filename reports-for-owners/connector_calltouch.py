#!/usr/bin/env python3
"""
Calltouch → _live_data.json (целевые лиды: звонки + заявки)
Использование: python connector_calltouch.py 2026-04-03 2026-04-09
"""
import sys, io, json, pathlib, requests, datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
LIVE = BASE / "_live_data.json"


def fetch(date1, date2):
    ct = CONFIG["calltouch"]
    site_id = ct["site_id"]
    api_key = ct["api_key"]

    d1 = datetime.date.fromisoformat(date1)
    d2 = datetime.date.fromisoformat(date2)
    cd1 = d1.strftime("%d/%m/%Y")
    cd2 = d2.strftime("%d/%m/%Y")
    rd1 = d1.strftime("%m/%d/%Y")
    rd2 = d2.strftime("%m/%d/%Y")

    # 1. Звонки — считаем целевые
    all_records = []
    page = 1
    while True:
        r = requests.get(
            f"https://api.calltouch.ru/calls-service/RestAPI/{site_id}/calls-diary/calls",
            params={"clientApiId": api_key, "dateFrom": cd1, "dateTo": cd2,
                    "page": page, "limit": 1000},
            timeout=30)
        r.raise_for_status()
        data = r.json()
        all_records.extend(data.get("records", []))
        if page >= data.get("pageTotal", 1):
            break
        page += 1

    total_calls = len(all_records)
    target_calls = sum(1 for c in all_records if c.get("targetCall"))

    # 2. Заявки
    r2 = requests.get(
        "https://api.calltouch.ru/calls-service/RestAPI/requests/",
        params={"clientApiId": api_key, "siteId": site_id,
                "dateFrom": rd1, "dateTo": rd2},
        timeout=30)
    r2.raise_for_status()
    reqs = r2.json() if isinstance(r2.json(), list) else []
    total_reqs = len(reqs)

    # Целевые заявки
    target_reqs = sum(1 for rq in reqs if rq.get("targetRequest"))

    # Целевые лиды = целевые звонки + целевые заявки
    leads = target_calls + target_reqs

    result = {
        "leads": leads,
        "target_calls": target_calls,
        "total_calls": total_calls,
        "requests": total_reqs,
    }

    # Сохраняем в _live_data.json
    live = {}
    if LIVE.exists():
        live = json.loads(LIVE.read_text("utf-8"))
    live.setdefault("period", {}).update({"date1": date1, "date2": date2})
    live["calltouch"] = result
    LIVE.write_text(json.dumps(live, ensure_ascii=False, indent=2), "utf-8")

    print(f"Calltouch: {leads} целевых лидов (звонки: {target_calls}/{total_calls}, заявки: {total_reqs})")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("python connector_calltouch.py YYYY-MM-DD YYYY-MM-DD")
        sys.exit(1)
    fetch(sys.argv[1], sys.argv[2])
