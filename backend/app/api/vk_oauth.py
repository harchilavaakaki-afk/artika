import logging
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.models.api_credential import ApiCredential
from app.security.encryption import encrypt

router = APIRouter(tags=["VK OAuth"])
logger = logging.getLogger(__name__)

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

# VK ID OAuth (new ads.vk.com platform)
VK_OAUTH_URL = "https://oauth.vk.com/authorize"
VK_TOKEN_URL = "https://oauth.vk.com/access_token"
VK_REDIRECT_URI = "http://localhost:8000/auth/vk/callback"

# myTarget OAuth (legacy fallback)
MT_TOKEN_URL = "https://target.my.com/api/v2/oauth2/token.json"
MT_REDIRECT_URI = "http://localhost:8000/auth/vk/callback"


def _save_token_to_env(token: str) -> None:
    env_path = ENV_FILE
    if not env_path.exists():
        return
    content = env_path.read_text(encoding="utf-8")
    if "VK_ADS_ACCESS_TOKEN=" in content:
        lines = [
            f"VK_ADS_ACCESS_TOKEN={token}" if l.startswith("VK_ADS_ACCESS_TOKEN=") else l
            for l in content.splitlines()
        ]
        env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    else:
        env_path.write_text(content.rstrip() + f"\nVK_ADS_ACCESS_TOKEN={token}\n", encoding="utf-8")
    settings.vk_ads_access_token = token


async def _save_token_to_db(token: str, db: AsyncSession) -> None:
    enc = encrypt(token)
    result = await db.execute(select(ApiCredential).where(ApiCredential.service == "VK_ADS"))
    cred = result.scalar_one_or_none()
    if cred:
        cred.oauth_token = enc
        cred.is_active = True
    else:
        cred = ApiCredential(service="VK_ADS", oauth_token=enc, is_active=True)
        db.add(cred)
    await db.commit()


# ─── VK ID OAuth (new platform) ───────────────────────────────────────────────

@router.get("/auth/vk/start", include_in_schema=False)
async def vk_start():
    """Show instructions page with VK implicit OAuth link."""
    return HTMLResponse(_instructions_page())


@router.get("/auth/vk/callback", response_class=HTMLResponse, include_in_schema=False)
async def vk_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """OAuth callback for VK ID (code flow)."""
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error:
        return HTMLResponse(_result_page(False, f"Ошибка: {error}"))

    if not code:
        # Implicit flow — token comes in URL hash, handled by JS
        return HTMLResponse(_implicit_page())

    if not settings.vk_app_id or not settings.vk_ads_client_secret:
        return HTMLResponse(_result_page(False, "VK_APP_ID или VK_ADS_CLIENT_SECRET не настроены"))

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(VK_TOKEN_URL, params={
                "client_id": settings.vk_app_id,
                "client_secret": settings.vk_ads_client_secret,
                "redirect_uri": VK_REDIRECT_URI,
                "code": code,
            })
            resp.raise_for_status()
            data = resp.json()

        token = data.get("access_token")
        if not token:
            return HTMLResponse(_result_page(False, f"Токен не получен: {data}"))

        _save_token_to_env(token)
        await _save_token_to_db(token, db)
        logger.info("VK ID user token saved")
        return HTMLResponse(_result_page(True, "Токен VK сохранён! Вернитесь в Artika."))

    except Exception as e:
        logger.exception("VK ID OAuth failed")
        return HTMLResponse(_result_page(False, str(e)))


@router.post("/auth/vk/save-token")
async def save_vk_token(body: dict, db: AsyncSession = Depends(get_db)):
    """Manually save a VK token."""
    token = body.get("token", "").strip()
    if not token:
        return JSONResponse({"ok": False, "error": "empty token"}, status_code=400)
    _save_token_to_env(token)
    await _save_token_to_db(token, db)
    return {"ok": True}


# ─── HTML pages ────────────────────────────────────────────────────────────────

def _instructions_page() -> str:
    """Instructions for connecting VK Ads via browser session cookies."""
    return """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>VK Реклама — Подключение</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0D1117;color:#C9D1D9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#161B22;border:1px solid #30363D;border-radius:16px;padding:32px;max-width:600px;width:100%}
h2{color:#e2e8f0;font-size:20px;margin-bottom:8px}
.sub{color:#8B949E;font-size:14px;margin-bottom:24px}
.step{display:flex;gap:12px;margin-bottom:20px;align-items:flex-start}
.num{background:#388BFD;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;margin-top:2px}
.step-content{flex:1}
.step-title{color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:4px}
.step-text{color:#8B949E;font-size:13px;line-height:1.5}
.link{color:#388BFD;text-decoration:none}
.link:hover{text-decoration:underline}
code{background:#0D1117;border:1px solid #30363D;padding:2px 8px;border-radius:6px;font-size:12px;color:#79c0ff;word-break:break-all;display:inline}
kbd{background:#21262d;border:1px solid #30363D;border-bottom-width:2px;border-radius:4px;padding:1px 6px;font-size:12px;color:#e2e8f0;font-family:inherit}
.cookie-form{margin-top:24px;border-top:1px solid #30363D;padding-top:24px}
.cookie-form label{color:#8B949E;font-size:12px;display:block;margin-bottom:6px}
textarea{width:100%;background:#0D1117;border:1px solid #30363D;border-radius:8px;padding:10px 12px;color:#e2e8f0;font-size:12px;outline:none;font-family:monospace;resize:vertical;min-height:80px}
textarea:focus{border-color:#388BFD}
.btn{display:block;width:100%;margin-top:12px;padding:10px;background:#388BFD;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
.btn:hover{background:#1f6feb}
.btn:disabled{background:#30363D;color:#8B949E;cursor:not-allowed}
#msg{margin-top:12px;font-size:13px;padding:10px;border-radius:8px;display:none}
.ok{background:#3fb95020;color:#3fb950;border:1px solid #3fb95040}
.err{background:#f8514920;color:#f85149;border:1px solid #f8514940}
.warn{background:#d29922 20;color:#d29922;border:1px solid #d2992240;margin-top:16px;border-radius:8px;padding:10px 14px;font-size:12px}
img.sc{max-width:100%;border-radius:8px;border:1px solid #30363D;margin-top:8px}
.tabs{display:flex;gap:8px;margin-bottom:20px}
.tab{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #30363D;color:#8B949E;background:transparent;transition:all .2s}
.tab.active{background:#388BFD;color:white;border-color:#388BFD}
.panel{display:none}.panel.active{display:block}
</style>
</head>
<body>
<div class="card">
  <h2>🔗 Подключение VK Рекламы</h2>
  <p class="sub">Используем сессионные куки браузера — это работает с вашим реальным аккаунтом (34 кампании).</p>

  <div class="tabs">
    <button class="tab active" onclick="showTab('cookie')">Cookie (рекомендуется)</button>
    <button class="tab" onclick="showTab('token')">Bearer токен</button>
  </div>

  <!-- COOKIE TAB -->
  <div id="panel-cookie" class="panel active">
    <div class="step">
      <div class="num">1</div>
      <div class="step-content">
        <div class="step-title">Откройте ads.vk.com в Chrome</div>
        <div class="step-text">Убедитесь, что вы вошли в свой рекламный кабинет (должны видеть кампании).</div>
      </div>
    </div>

    <div class="step">
      <div class="num">2</div>
      <div class="step-content">
        <div class="step-title">Откройте DevTools → Network</div>
        <div class="step-text">Нажмите <kbd>F12</kbd> → вкладка <b>Network</b>. Обновите страницу (<kbd>F5</kbd>).
          В фильтре введите <code>proxy/mt</code> — появятся сетевые запросы.</div>
      </div>
    </div>

    <div class="step">
      <div class="num">3</div>
      <div class="step-content">
        <div class="step-title">Скопируйте Cookie header</div>
        <div class="step-text">Кликните на любой запрос → вкладка <b>Headers</b> → раздел <b>Request Headers</b> →
          найдите строку <code>cookie:</code> → кликните правой кнопкой → «Copy value».<br><br>
          <b>Альтернатива через консоль</b> — вставьте в Console на ads.vk.com:<br>
          <code>copy(document.cookie)</code><br>
          Значение скопируется в буфер обмена.</div>
      </div>
    </div>

    <div class="step">
      <div class="num">4</div>
      <div class="step-content">
        <div class="step-title">Вставьте Cookie ниже и сохраните</div>
        <div class="step-text">Строка выглядит примерно так: <code>vkads_session=...; csrftoken=...; ...</code></div>
      </div>
    </div>

    <div class="cookie-form">
      <label for="cookie-input">Cookie строка из заголовка запроса</label>
      <textarea id="cookie-input" placeholder="vkads_session=abc123...; csrftoken=xyz...; ..."></textarea>
      <button class="btn" id="save-cookie-btn" onclick="saveCookie()">Сохранить Cookie</button>
      <div id="cookie-msg"></div>
    </div>

    <div class="warn">⚠️ Куки обновляются при каждом входе. Если кампании перестанут загружаться — повторите шаги 1–4.</div>
  </div>

  <!-- TOKEN TAB -->
  <div id="panel-token" class="panel">
    <div class="step">
      <div class="num">1</div>
      <div class="step-content">
        <div class="step-title">Bearer токен (ограниченный доступ)</div>
        <div class="step-text">Этот токен от client_credentials — даёт доступ только к техническому аккаунту приложения,
        а не вашему рекламному кабинету. Используйте Cookie-метод для реальных кампаний.</div>
      </div>
    </div>
    <div class="cookie-form">
      <label for="token-input">Bearer токен VK Ads</label>
      <textarea id="token-input" placeholder="vk1.a.xxx..." style="min-height:60px"></textarea>
      <button class="btn" id="save-token-btn" onclick="saveToken()">Сохранить токен</button>
      <div id="token-msg"></div>
    </div>
  </div>
</div>

<script>
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  event.target.classList.add('active');
}

async function saveCookie() {
  const cookie = document.getElementById('cookie-input').value.trim();
  const btn = document.getElementById('save-cookie-btn');
  if (!cookie) { showMsg('cookie-msg', 'Вставьте Cookie строку', false); return; }
  btn.disabled = true; btn.textContent = 'Сохранение...';
  try {
    const r = await fetch('/api/v1/vk/save-cookie', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({cookie})
    });
    const d = await r.json();
    if (d.ok) {
      showMsg('cookie-msg', '✅ Cookie сохранены! Кампании появятся в Artika.', true);
      btn.textContent = 'Сохранено!';
    } else {
      showMsg('cookie-msg', '❌ ' + (d.detail || 'Ошибка'), false);
      btn.disabled = false; btn.textContent = 'Сохранить Cookie';
    }
  } catch(e) {
    showMsg('cookie-msg', '❌ ' + e.message, false);
    btn.disabled = false; btn.textContent = 'Сохранить Cookie';
  }
}

async function saveToken() {
  const token = document.getElementById('token-input').value.trim();
  const btn = document.getElementById('save-token-btn');
  if (!token) { showMsg('token-msg', 'Введите токен', false); return; }
  btn.disabled = true; btn.textContent = 'Сохранение...';
  try {
    const r = await fetch('/auth/vk/save-token', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({token})
    });
    const d = await r.json();
    if (d.ok) {
      showMsg('token-msg', '✅ Токен сохранён!', true);
      btn.textContent = 'Сохранено!';
    } else {
      showMsg('token-msg', '❌ ' + (d.error || 'Ошибка'), false);
      btn.disabled = false; btn.textContent = 'Сохранить токен';
    }
  } catch(e) {
    showMsg('token-msg', '❌ ' + e.message, false);
    btn.disabled = false; btn.textContent = 'Сохранить токен';
  }
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text; el.style.display = 'block';
  el.className = ok ? 'ok' : 'err';
}

// Auto-import campaigns from URL hash (set by browser JS on ads.vk.com)
(async function() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const campsB64 = params.get('camps');
  if (!campsB64) return;
  try {
    const json = atob(campsB64);
    const data = JSON.parse(json);
    const items = data.items || data;
    // Login and import
    const loginR = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'admin@artika.ru', password:'admin123'})
    });
    const loginD = await loginR.json();
    const jwt = loginD.access_token;
    if (!jwt) { alert('Ошибка входа в Artika'); return; }
    const impR = await fetch('/api/v1/vk/import-campaigns', {
      method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': 'Bearer ' + jwt},
      body: JSON.stringify({items})
    });
    const impD = await impR.json();
    if (impD.ok) {
      document.body.innerHTML = '<div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0D1117;color:#C9D1D9"><div style="text-align:center"><div style="font-size:64px;color:#3fb950">✓</div><h2>VK Реклама подключена!</h2><p style="color:#8B949E;margin-top:8px">Импортировано кампаний: <b style="color:#e2e8f0">' + impD.count + '</b></p><p style="color:#8B949E;margin-top:4px">Вернитесь в Artika — данные появятся.</p></div></div>';
    } else {
      alert('Ошибка импорта: ' + JSON.stringify(impD));
    }
  } catch(e) {
    console.error('Auto-import failed:', e);
  }
})();
</script>
</body></html>"""


def _result_page(ok: bool, message: str) -> str:
    icon = "✓" if ok else "✗"
    color = "#3FB950" if ok else "#F85149"
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>VK OAuth</title>
<style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0D1117;color:#C9D1D9;}}
.box{{background:#161B22;border:1px solid #30363D;border-radius:12px;padding:32px;max-width:500px;width:90%;text-align:center;}}
.icon{{color:{color};font-size:64px;margin-bottom:16px;}}</style>
</head><body><div class="box">
<div class="icon">{icon}</div>
<h2>{"Успех" if ok else "Ошибка"}</h2>
<p>{message}</p>
{"<p style='margin-top:12px;color:#8B949E;font-size:13px'>Можно закрыть эту страницу.</p>" if ok else ""}
</div></body></html>"""


def _implicit_page() -> str:
    """Handle implicit flow token from URL hash."""
    return """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>VK Token</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0D1117;color:#C9D1D9;}
.box{background:#161B22;border:1px solid #30363D;border-radius:12px;padding:32px;max-width:600px;width:90%;text-align:center;}</style>
</head><body><div class="box" id="box">
<div>⏳</div><h2 id="title">Обработка...</h2><p id="msg"></p>
</div><script>
const hash = window.location.hash.substring(1);
const params = Object.fromEntries(new URLSearchParams(hash));
const token = params.access_token;
if (token) {
  fetch('/auth/vk/save-token', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})})
    .then(r => r.json()).then(() => {
      document.getElementById('title').textContent = '✓ Токен сохранён!';
      document.getElementById('msg').textContent = 'Вернитесь в Artika — кампании появятся.';
    });
} else {
  document.getElementById('title').textContent = 'Токен не найден';
  document.getElementById('msg').textContent = 'Попробуйте ещё раз';
}
</script></body></html>"""
