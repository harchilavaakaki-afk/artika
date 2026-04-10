import os, json, base64, urllib.request, ssl, subprocess

API_KEY = "AIzaSyA1d0aECxfFoYhFT3kvF5uopY6_dgCaH0Q"
MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

BASE = os.path.dirname(__file__)
SRC = os.path.join(BASE, "prolink-photo")
OUT = os.path.join(BASE, "generated-final")
os.makedirs(OUT, exist_ok=True)

NO_TEXT = " IMPORTANT: Do NOT add any text, letters, words, captions, titles, watermarks or typography of any kind to the image. Image only, zero text."

tasks = [
    {
        "src": "S08A8187.jpg",
        "out": "card1_rainbow_padel.png",
        "prompt": "Enhance this real padel tournament group photo: keep the same people, same padel center interior with blue walls, same balloons. Add vibrant colorful confetti effects (pink, yellow, cyan, orange, purple rainbow hues), soft rainbow light reflections on walls. Brighter festive atmosphere. Photo-realistic. Square 1:1 aspect ratio." + NO_TEXT
    },
    {
        "src": "S08A7970.jpg",
        "out": "card2_friday_americano.png",
        "prompt": "Enhance this real padel action photo: keep the same player in mid-swing smash, same indoor court. Add dramatic blue and cyan LED night lighting, atmospheric evening vibe, darker moody teal palette with rim lights on the player. Photo-realistic energetic night match feel. Square 1:1 aspect ratio." + NO_TEXT
    },
    {
        "src": "S08A8155.jpg",
        "out": "card3_seven_six_cup.png",
        "prompt": "Enhance this real trophy award photo: keep the same winner holding golden trophy, same Padel Center branded backdrop. Add dramatic stadium spotlight on the trophy, make the gold gleam brightly, subtle bokeh lights in the background. Photo-realistic prestigious tournament moment. Square 1:1 aspect ratio." + NO_TEXT
    }
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for t in tasks:
    src_path = os.path.join(SRC, t["src"])
    print(f"Generating {t['out']} from {t['src']}...")
    with open(src_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("ascii")
    body = json.dumps({
        "contents": [{
            "parts": [
                {"text": t["prompt"]},
                {"inlineData": {"mimeType": "image/jpeg", "data": img_b64}}
            ]
        }],
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
            print(f"  FAIL: no image in response. Text: {json.dumps(data)[:300]}")
    except Exception as e:
        print(f"  ERROR: {e}")
        try:
            print("  body:", e.read().decode()[:500])
        except Exception:
            pass
