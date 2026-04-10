#!/usr/bin/env python3
"""
Телеграм-канал → _live_data.json
Парсит t.me/s/{channel} без API-ключей.
Использование: python connector_tg.py
"""
import json, pathlib, re, sys, io
import urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
LIVE = BASE / "_live_data.json"

def fetch():
    channel = CONFIG["tg"]["channel"]
    url = f"https://t.me/s/{channel}"

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
    except urllib.error.URLError as e:
        print(f"ERROR: не удалось загрузить {url}: {e}")
        sys.exit(1)

    # Подписчики: ищем паттерн вида "875 subscribers" или "875 подписчиков"
    subscribers = None
    patterns = [
        r'(\d[\d\s]*)\s*(?:subscribers|подписчик)',
        r'"tgme_page_extra"[^>]*>\s*([\d\s]+)\s*(?:subscribers|подписчик)',
        r'subscribers">([\d\s]+)<',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            raw = m.group(1).replace("\u00a0", "").replace(" ", "").strip()
            try:
                subscribers = int(raw)
                break
            except ValueError:
                pass

    # Количество постов за страницу (приблизительно — не за неделю)
    posts_count = len(re.findall(r'tgme_widget_message_wrap', html))

    if subscribers is None:
        print("WARN: не удалось распарсить количество подписчиков")
        print("      Открой https://t.me/s/" + channel + " и посмотри вручную")
        subscribers = 0

    # Считаем прирост по сравнению с предыдущим значением
    live = {}
    if LIVE.exists():
        live = json.loads(LIVE.read_text("utf-8"))

    prev_subscribers = None
    history = json.loads((BASE / "_history.json").read_text("utf-8"))
    if history["subscribers"]["values"]:
        prev_subscribers = history["subscribers"]["values"][-1]

    growth = None
    if prev_subscribers is not None and subscribers > 0:
        growth = subscribers - prev_subscribers

    result = {
        "subscribers": subscribers,
        "subscribers_prev": prev_subscribers,
        "growth": growth,
        "posts_on_page": posts_count,
        "channel_url": f"https://t.me/{channel}",
    }

    live["tg"] = result
    LIVE.write_text(json.dumps(live, ensure_ascii=False, indent=2), "utf-8")

    print(f"✓ ТГ: {subscribers} подписчиков", end="")
    if growth is not None:
        sign = "+" if growth >= 0 else ""
        print(f" ({sign}{growth} за неделю)")
    else:
        print()

if __name__ == "__main__":
    fetch()
