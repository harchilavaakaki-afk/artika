import os, json, base64, urllib.request, ssl

API_KEY = "AIzaSyA1d0aECxfFoYhFT3kvF5uopY6_dgCaH0Q"
MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

BASE = os.path.dirname(__file__)
OUT = os.path.join(BASE, "generated-final")

NO_TEXT = " IMPORTANT: Do NOT add any text, letters, words, captions, titles, watermarks or typography of any kind. Image only, zero text."

tasks = [
    {
        "out": "card4_family_day.png",
        "prompt": "Professional warm photo inside an indoor padel court of a happy family playing padel together: mom, dad, a boy (around 10) and a girl (around 7), all holding padel rackets, smiling, sunny afternoon atmosphere, soft natural light through windows, blue padel court, glass walls, Russian family, casual sporty clothes, wholesome feel-good moment, shallow depth of field, photo-realistic. Square 1:1 aspect ratio." + NO_TEXT
    },
    {
        "out": "card5_cosmonautics_day.png",
        "prompt": "Creative poster: a padel racket floating in outer space among stars, planets and a nebula. Earth visible in the background. A tennis ball orbiting like a small planet. Deep cosmic blue and purple palette with golden highlights. Surreal cinematic space scene mixed with padel sport theme, celebrating Cosmonautics Day. Photo-realistic CGI style. Square 1:1 aspect ratio." + NO_TEXT
    }
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for t in tasks:
    print(f"Generating {t['out']}...")
    body = json.dumps({
        "contents": [{"parts": [{"text": t["prompt"]}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]}
    }).encode("utf-8")
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=240)
        data = json.loads(resp.read().decode("utf-8"))
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        saved = False
        for p in parts:
            if "inlineData" in p:
                out_path = os.path.join(OUT, t["out"])
                open(out_path, "wb").write(base64.b64decode(p["inlineData"]["data"]))
                print(f"  OK: {out_path}")
                saved = True
                break
        if not saved:
            print(f"  FAIL: {json.dumps(data)[:300]}")
    except Exception as e:
        print(f"  ERROR: {e}")
        try:
            print("  body:", e.read().decode()[:500])
        except Exception:
            pass
