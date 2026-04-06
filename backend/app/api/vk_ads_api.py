"""VK Ads (myTarget) management API."""
import asyncio
import json
import logging
from datetime import date, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

CAMPAIGNS_CACHE = Path(__file__).resolve().parent.parent.parent / "vk_campaigns_cache.json"
ASSIGNMENTS_FILE = Path(__file__).resolve().parent.parent.parent / "vk_campaign_assignments.json"

from app.auth.middleware import get_current_user
from app.clients.vk_ads import VKAdsClient, VKAdsCookieClient
from app.config import settings
from app.db.session import get_db
from app.models.api_credential import ApiCredential
from app.models.user import User
from app.security.encryption import decrypt, encrypt

router = APIRouter(prefix="/vk", tags=["VK Реклама"])
logger = logging.getLogger(__name__)


# ─── Credential helpers ────────────────────────────────────────────────────────

async def _get_cookie(db: AsyncSession) -> str | None:
    """Get session cookie: DB first, fallback to settings."""
    result = await db.execute(
        select(ApiCredential).where(ApiCredential.service == "VK_ADS_COOKIE", ApiCredential.is_active == True)
    )
    cred = result.scalar_one_or_none()
    if cred and cred.oauth_token:
        return decrypt(cred.oauth_token)
    return settings.vk_ads_cookie or None


async def _get_token(db: AsyncSession) -> str | None:
    """Get VK Bearer token: DB first, fallback to settings."""
    result = await db.execute(
        select(ApiCredential).where(ApiCredential.service == "VK_ADS", ApiCredential.is_active == True)
    )
    cred = result.scalar_one_or_none()
    if cred and cred.oauth_token:
        return decrypt(cred.oauth_token)
    return settings.vk_ads_access_token or None


async def _get_best_client(db: AsyncSession):
    """Return (client, auth_type). Cookie client preferred (real campaigns)."""
    cookie = await _get_cookie(db)
    if cookie:
        return VKAdsCookieClient(cookie, account_id=settings.vk_ads_account_id), "cookie"
    token = await _get_token(db)
    if token:
        return VKAdsClient(token), "bearer"
    return None, None


def _client(token: str) -> VKAdsClient:
    return VKAdsClient(token)


# ─── Status & account ─────────────────────────────────────────────────────────

@router.get("/status")
async def vk_status(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Check VK connection status and return account info."""
    # If we have a campaigns cache — consider always connected (cache mode)
    cache_ok = CAMPAIGNS_CACHE.exists()

    client, auth_type = await _get_best_client(db)
    if client:
        try:
            user_info = await asyncio.wait_for(client.get_user_info(), timeout=5.0)
            return {
                "connected": True,
                "auth_type": auth_type,
                "user": {
                    "id": user_info.get("id"),
                    "username": user_info.get("username"),
                    "currency": user_info.get("currency"),
                    "info_currency": user_info.get("info_currency"),
                    "status": user_info.get("status"),
                    "types": user_info.get("types", []),
                },
            }
        except Exception:
            pass
        finally:
            await client.close()

    # Fallback: cache exists → show as connected with stub user info
    if cache_ok:
        cache_data = json.loads(CAMPAIGNS_CACHE.read_text(encoding="utf-8"))
        count = cache_data.get("count", len(cache_data.get("items", [])))
        return {
            "connected": True,
            "auth_type": "cache",
            "user": {
                "id": 0,
                "username": f"кэш ({count} кампаний)",
                "status": "active",
                "types": [],
            },
        }

    return {"connected": False, "reason": "no_token"}


@router.post("/save-cookie")
async def save_vk_cookie(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Save browser session cookie string for cookie-based VK Ads access.

    Body: {"cookie": "<full Cookie header value from ads.vk.com DevTools>"}
    """
    cookie = body.get("cookie", "").strip()
    if not cookie:
        raise HTTPException(status_code=400, detail="cookie is required")

    enc_cookie = encrypt(cookie)
    result = await db.execute(select(ApiCredential).where(ApiCredential.service == "VK_ADS_COOKIE"))
    cred = result.scalar_one_or_none()
    if cred:
        cred.oauth_token = enc_cookie
        cred.is_active = True
    else:
        cred = ApiCredential(service="VK_ADS_COOKIE", oauth_token=enc_cookie, is_active=True)
        db.add(cred)
    await db.commit()

    # Also persist to .env for restarts
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        content = env_path.read_text(encoding="utf-8")
        lines = content.splitlines()
        if any(l.startswith("VK_ADS_COOKIE=") for l in lines):
            lines = [f"VK_ADS_COOKIE={cookie}" if l.startswith("VK_ADS_COOKIE=") else l for l in lines]
        else:
            lines.append(f"VK_ADS_COOKIE={cookie}")
        env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    settings.vk_ads_cookie = cookie

    return {"ok": True, "preview": cookie[:40] + "..."}


@router.post("/refresh-token")
async def refresh_vk_token(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Refresh VK token via client_credentials (app token, no campaigns)."""
    if not settings.vk_ads_client_id or not settings.vk_ads_client_secret:
        raise HTTPException(status_code=400, detail="VK_ADS_CLIENT_ID/SECRET не настроены")
    client = VKAdsClient("")
    try:
        token = await client.refresh_token_by_credentials(
            settings.vk_ads_client_id, settings.vk_ads_client_secret
        )
        if not token:
            raise HTTPException(status_code=502, detail="Токен не получен")
        # Save
        from app.api.vk_oauth import _save_token_to_env, _save_token_to_db
        _save_token_to_env(token)
        await _save_token_to_db(token, db)
        return {"ok": True, "token_preview": token[:20] + "..."}
    finally:
        await client.close()


# ─── Campaigns ────────────────────────────────────────────────────────────────

@router.post("/trigger-refresh")
async def trigger_vk_refresh(_user: User = Depends(get_current_user)):
    """Manually trigger a VK campaign cache refresh (runs in background)."""
    from app.scheduler.scheduler import refresh_vk_campaigns
    import asyncio
    asyncio.create_task(refresh_vk_campaigns())
    return {"ok": True, "message": "VK campaign refresh triggered"}


@router.post("/import-campaigns")
async def import_campaigns(
    body: dict,
    _user: User = Depends(get_current_user),
):
    """Accept campaign list pushed from browser JS on ads.vk.com.
    Body: {"items": [...], "count": N}
    """
    items = body.get("items", [])
    if not isinstance(items, list):
        raise HTTPException(status_code=400, detail="items must be a list")
    data = {"items": items, "count": len(items), "source": "browser_push"}
    CAMPAIGNS_CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("VK campaigns cache updated: %d campaigns", len(items))
    return {"ok": True, "count": len(items)}


@router.get("/campaign-assignments")
async def get_campaign_assignments(_user: User = Depends(get_current_user)):
    """Return dict of {campaign_id: project_id} assignments."""
    if ASSIGNMENTS_FILE.exists():
        return json.loads(ASSIGNMENTS_FILE.read_text(encoding="utf-8"))
    return {}


@router.post("/campaign-assignments")
async def save_campaign_assignments(body: dict, _user: User = Depends(get_current_user)):
    """Save {campaign_id: project_id | null} assignments. Merges with existing."""
    existing: dict = {}
    if ASSIGNMENTS_FILE.exists():
        existing = json.loads(ASSIGNMENTS_FILE.read_text(encoding="utf-8"))
    for k, v in body.items():
        if v is None:
            existing.pop(str(k), None)
        else:
            existing[str(k)] = v
    ASSIGNMENTS_FILE.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "count": len(existing)}


@router.get("/campaigns")
async def list_campaigns(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    # 1. Try live cookie/bearer client
    client, auth_type = await _get_best_client(db)
    if client:
        try:
            campaigns = await client.get_campaigns(status=status)
            if campaigns:
                return {"items": campaigns, "count": len(campaigns), "auth_type": auth_type}
        except Exception as e:
            logger.warning("Live VK client failed: %s", e)
        finally:
            await client.close()

    # 2. Fallback: browser-pushed cache
    if CAMPAIGNS_CACHE.exists():
        data = json.loads(CAMPAIGNS_CACHE.read_text(encoding="utf-8"))
        items = data.get("items", [])
        # Merge project assignments
        assignments: dict = {}
        if ASSIGNMENTS_FILE.exists():
            assignments = json.loads(ASSIGNMENTS_FILE.read_text(encoding="utf-8"))
        for item in items:
            item["project_id"] = assignments.get(str(item["id"]))
        if status:
            items = [c for c in items if c.get("status") == status]
        return {"items": items, "count": len(items), "auth_type": "cache"}

    raise HTTPException(status_code=401, detail="VK не подключён. Откройте /auth/vk/start")


class CampaignCreate(BaseModel):
    name: str
    budget_limit: str = "0"
    budget_limit_day: str = "0"
    start_date: str | None = None
    end_date: str | None = None
    mixing: str = "fastest"


@router.post("/campaigns")
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        result = await client.create_campaign({
            "name": body.name,
            "budget_limit": body.budget_limit,
            "budget_limit_day": body.budget_limit_day,
            "start_date": body.start_date,
            "end_date": body.end_date,
            "mixing": body.mixing,
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


class CampaignUpdate(BaseModel):
    status: str | None = None
    name: str | None = None
    budget_limit: str | None = None
    budget_limit_day: str | None = None


@router.patch("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: int,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        params = {k: v for k, v in body.model_dump().items() if v is not None}
        result = await client.update_campaign(campaign_id, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        result = await client.delete_campaign(campaign_id)
        return {"ok": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


# ─── Ad groups ────────────────────────────────────────────────────────────────

@router.get("/campaigns/{campaign_id}/adgroups")
async def list_adgroups(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        groups = await client.get_adgroups(campaign_id=campaign_id)
        return {"items": groups, "count": len(groups)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


class AdGroupUpdate(BaseModel):
    status: str | None = None
    name: str | None = None


@router.patch("/adgroups/{adgroup_id}")
async def update_adgroup(
    adgroup_id: int,
    body: AdGroupUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        params = {k: v for k, v in body.model_dump().items() if v is not None}
        result = await client.update_adgroup(adgroup_id, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


# ─── Banners (ads) ────────────────────────────────────────────────────────────

@router.get("/campaigns/{campaign_id}/banners")
async def list_banners(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        banners = await client.get_banners(campaign_id=campaign_id)
        return {"items": banners, "count": len(banners)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


class BannerUpdate(BaseModel):
    status: str | None = None


@router.patch("/banners/{banner_id}")
async def update_banner(
    banner_id: int,
    body: BannerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    token = await _get_token(db)
    if not token:
        raise HTTPException(status_code=401, detail="VK не подключён")
    client = _client(token)
    try:
        params = {k: v for k, v in body.model_dump().items() if v is not None}
        result = await client.update_banner(banner_id, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


# ─── Statistics ───────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(
    date_from: str = Query(default_factory=lambda: (date.today() - timedelta(days=30)).isoformat()),
    date_to: str = Query(default_factory=lambda: date.today().isoformat()),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get campaign statistics for date range."""
    client, _ = await _get_best_client(db)
    if not client:
        raise HTTPException(status_code=401, detail="VK не подключён")
    try:
        items = await client.get_campaign_stats(
            date_from=date.fromisoformat(date_from),
            date_to=date.fromisoformat(date_to),
        )
        return {"items": items, "date_from": date_from, "date_to": date_to}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()
