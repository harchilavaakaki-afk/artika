#!/usr/bin/env python3
"""
Яндекс Метрика → _live_data.json
Использование: python connector_metrika.py 2026-04-10 2026-04-16
"""
import sys, json, pathlib, requests, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
LIVE = BASE / "_live_data.json"
API = "https://api-metrika.yandex.net/stat/v1/data"

def get(token, counter_id, params):
    r = requests.get(API, headers={"Authorization": f"OAuth {token}"}, params={
        "ids": counter_id, **params
    }, timeout=30)
    r.raise_for_status()
    return r.json()

def fetch(date1, date2):
    token = CONFIG["metrika"]["oauth_token"]
    cid   = CONFIG["metrika"]["counter_id"]
    if not token:
        print("ERROR: metrika.oauth_token не заполнен в _config.json")
        sys.exit(1)

    common = {"date1": date1, "date2": date2, "filters": "ym:s:isRobot=='No'"}

    # 1. Источники трафика
    src = get(token, cid, {
        **common,
        "dimensions": "ym:s:lastTrafficSource",
        "metrics":    "ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds",
        "sort":       "-ym:s:visits",
        "limit":      20,
    })
    totals = src.get("totals", [0, 0])
    total_visits = int(totals[0]) if totals else 0
    total_users  = int(totals[1]) if len(totals) > 1 else 0

    # Форматируем источники
    SOURCE_NAMES = {
        "ad": "Реклама", "direct": "Прямые заходы", "organic": "Поисковые системы",
        "referral": "Переходы по ссылкам", "internal": "Внутренние переходы",
        "social": "Социальные сети", "messenger": "Мессенджеры",
    }
    sources_out = []
    for row in src.get("data", []):
        src_id = row["dimensions"][0]["id"]
        m = row["metrics"]
        sources_out.append({
            "id": src_id,
            "name": SOURCE_NAMES.get(src_id, src_id),
            "visits": int(m[0]), "users": int(m[1]),
            "bounce": round(m[2], 2), "depth": round(m[3], 2), "duration": int(m[4])
        })

    # 2. Переходы в ТГ (из метрики — по реферреру t.me)
    tg_clicks = 0
    try:
        tg = get(token, cid, {
            **common,
            "dimensions": "ym:s:referer",
            "metrics":    "ym:s:visits",
            "filters":    "ym:s:referer=~'t.me'",
            "limit":      1,
        })
        tg_clicks = int(tg.get("totals", [0])[0])
    except Exception as e:
        print(f"  ТГ-переходы: ошибка ({e}), ставим 0")

    # 3. Цели (заявки + звонки) — если goal_ids заполнены
    leads = 0
    calls = 0
    gids = CONFIG["metrika"].get("goal_ids", {})
    for key, gid in [("leads", gids.get("leads")), ("calls", gids.get("calls"))]:
        if not gid:
            continue
        try:
            g = get(token, cid, {
                **common,
                "metrics": f"ym:s:goal{gid}reaches",
            })
            val = int(g.get("totals", [0])[0])
            if key == "leads": leads = val
            else: calls = val
        except Exception as e:
            print(f"  Цель {key} ({gid}): ошибка ({e})")

    result = {
        "visits": total_visits, "users": total_users,
        "sources": sources_out,
        "tg_clicks": tg_clicks,
        "leads": leads, "calls": calls
    }

    # Сохраняем в _live_data.json
    live = {}
    if LIVE.exists():
        live = json.loads(LIVE.read_text("utf-8"))
    live.setdefault("period", {}).update({"date1": date1, "date2": date2})
    live["metrika"] = result
    LIVE.write_text(json.dumps(live, ensure_ascii=False, indent=2), "utf-8")

    print(f"✓ Метрика: {total_visits} визитов, {total_users} пользователей")
    src_list = ', '.join(f"{s['name']} {s['visits']}" for s in sources_out)
    print(f"  Источники: {src_list}")
    print(f"  ТГ-переходы: {tg_clicks}")
    if leads or calls:
        print(f"  Заявки: {leads}, Звонки: {calls}")
    else:
        print("  Заявки/звонки: заполни goal_ids в _config.json или введи вручную в _manual_input.json")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Использование: python connector_metrika.py 2026-04-10 2026-04-16")
        sys.exit(1)
    fetch(sys.argv[1], sys.argv[2])
