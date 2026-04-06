with open('index.html', 'rb') as f:
    data = f.read()

old = b'    .hero-content { position: relative; z-index: 2; max-width: var(--site); margin: 0 auto; padding: 20px 24px 48px; }'
new = b'    .hero-content { position: relative; z-index: 2; width: 100%; max-width: var(--site); margin: 0 auto; padding: 20px 24px 48px; }'

if old in data:
    data = data.replace(old, new, 1)
    with open('index.html', 'wb') as f:
        f.write(data)
    print("OK: added width:100% to hero-content")
else:
    print("MISS — pattern not found")
