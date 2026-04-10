import os, base64, json, urllib.request, ssl

USER = "admin"
PWD = "Ji6m 6Lps 6pjV 2M9W KIg1 bSwa"
BASE = "https://padelvidnoe.ru"

BASE_DIR = os.path.dirname(__file__)
SRC = os.path.join(BASE_DIR, "generated-final")

# Order matches new slot mapping: 1=family, 2=cosmonautics, 3=rainbow
files = [
    ("card4_family_day.png", "semejnyj-den-11apr.png", "image/png"),
    ("card5_cosmonautics_day.png", "den-kosmonavtiki-12apr.png", "image/png"),
    ("card1_rainbow_padel.jpeg", "rejnbou-padel-11apr.jpg", "image/jpeg"),
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

auth = base64.b64encode(f"{USER}:{PWD}".encode()).decode()

results = []
for local, remote, mime in files:
    path = os.path.join(SRC, local)
    with open(path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(
        f"{BASE}/wp-json/wp/v2/media",
        data=data,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Disposition": f'attachment; filename="{remote}"',
            "Content-Type": mime,
        },
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=240)
        j = json.loads(resp.read().decode())
        print(f"OK {remote}: id={j['id']} url={j['source_url']}")
        results.append({"local": local, "id": j["id"], "url": j["source_url"]})
    except Exception as e:
        print(f"ERR {remote}: {e}")
        try:
            print("  ", e.read().decode()[:500])
        except Exception:
            pass

with open(os.path.join(BASE_DIR, "uploaded.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("saved uploaded.json")
