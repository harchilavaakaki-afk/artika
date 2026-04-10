import os, json, base64, sys, urllib.request, ssl

API_KEY = "AIzaSyA1d0aECxfFoYhFT3kvF5uopY6_dgCaH0Q"
MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

prompts = {
    "rainbow_padel.png": "Professional photo of a padel court at golden hour with vibrant rainbow colored light reflections on glass walls. Multiple colorful padel rackets (neon pink, yellow, cyan, orange) arranged on the blue court surface. Dynamic festive atmosphere. Cinematic lighting, shallow depth of field, ultra sharp. Horizontal 16:9 aspect ratio.",
    "friday_americano.png": "Professional photo of an indoor padel court at night, dramatic moody lighting with blue and cyan LED lights. A player mid-swing silhouette against bright court lights, glass walls reflecting the scene. Energetic Friday night vibe. Cinematic dark blue teal palette. Horizontal 16:9 aspect ratio.",
    "seven_six_cup.png": "Professional photo of a shiny gold padel trophy cup in the foreground on the blue padel court, out-of-focus players in the background during a tournament match. Bright professional stadium lighting, trophy gleaming. Premium prestigious tournament atmosphere. Cinematic sharp focus on trophy. Horizontal 16:9 aspect ratio."
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for fname, prompt in prompts.items():
    print(f"→ {fname}")
    body = json.dumps({
        "contents": [{"parts":[{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]}
    }).encode('utf-8')
    req = urllib.request.Request(URL, data=body, headers={"Content-Type":"application/json"})
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=120)
        data = json.loads(resp.read().decode('utf-8'))
        parts = data.get('candidates',[{}])[0].get('content',{}).get('parts',[])
        saved = False
        for p in parts:
            if 'inlineData' in p:
                img_b64 = p['inlineData']['data']
                open(fname,'wb').write(base64.b64decode(img_b64))
                print(f"  ✓ saved {fname}")
                saved = True
                break
        if not saved:
            print("  ✗ no image in response:", json.dumps(data)[:500])
    except Exception as e:
        print("  ✗ error:", e)
        try:
            print("  body:", e.read().decode()[:500])
        except: pass
