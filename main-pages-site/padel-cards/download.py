import json, subprocess, os
d = json.load(open(r'C:\Users\harch\AppData\Local\Temp\yadisk.json', encoding='utf-8'))
items = d.get('_embedded', {}).get('items', [])
sample = items[::10][:15]
outdir = os.path.join(os.path.dirname(__file__), 'real-photos')
os.makedirs(outdir, exist_ok=True)
for it in sample:
    name = it['name']
    url = it['file']
    out = os.path.join(outdir, name)
    print(name)
    subprocess.run(['curl', '-sk', '--noproxy', '*', '-L', url, '-o', out], check=False)
print('done')
