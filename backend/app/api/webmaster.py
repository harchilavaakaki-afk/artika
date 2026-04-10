import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.yandex_webmaster import YandexWebmasterClient
from app.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.webmaster_query import WebmasterQuery

router = APIRouter(prefix="/webmaster", tags=["Вебмастер"])
logger = logging.getLogger(__name__)


# host_ids that belong to the padel (artikavidnoe) account
_PADEL_HOSTS = {"https:padelvidnoe.ru:443"}


def _get_client(host_id: str | None = None) -> YandexWebmasterClient:
    """Get webmaster client, picking the right token based on host_id."""
    if host_id and host_id in _PADEL_HOSTS and settings.yandex_oauth_token_padel:
        return YandexWebmasterClient(settings.yandex_oauth_token_padel)
    if not settings.yandex_oauth_token:
        raise HTTPException(status_code=400, detail="Яндекс OAuth токен не настроен")
    return YandexWebmasterClient(settings.yandex_oauth_token)


async def _get_user_id(client: YandexWebmasterClient) -> int:
    try:
        return await client.get_user_id()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка Webmaster API: {e}")


# ─── Search queries (from DB) ─────────────────────────────────────────────────

@router.get("/queries")
async def get_webmaster_queries(
    project_id: int | None = None,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(WebmasterQuery).order_by(WebmasterQuery.clicks.desc()).limit(limit)
    if project_id:
        query = query.where(WebmasterQuery.project_id == project_id)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "query_text": r.query_text,
            "date": str(r.date),
            "impressions": r.impressions,
            "clicks": r.clicks,
            "ctr": float(r.ctr),
            "position": float(r.position),
            "device_type": r.device_type,
        }
        for r in rows
    ]


# ─── Live API endpoints ───────────────────────────────────────────────────────

async def _fetch_hosts_from_client(client: YandexWebmasterClient) -> list[dict]:
    """Fetch hosts with details from a single webmaster client."""
    user_id = await client.get_user_id()
    hosts = await client.get_hosts(user_id)
    result = []
    for h in hosts:
        host_id = h.get("host_id", "")
        try:
            info = await client.get_host_info(user_id, host_id)
            summary = await client.get_indexing_stats(user_id, host_id)
            result.append({
                "host_id": host_id,
                "unicode_host_url": h.get("unicode_host_url", host_id),
                "verified": h.get("verified", False),
                "iks": info.get("site_quality_score", {}).get("value"),
                "pages_count": summary.get("SEARCHABLE_PAGES_COUNT"),
                "in_search_count": summary.get("IN_SEARCH_PAGES_COUNT"),
                "errors_count": summary.get("ERRORS_COUNT", 0),
            })
        except Exception as e:
            logger.warning("Failed to get info for host %s: %s", host_id, e)
            result.append({
                "host_id": host_id,
                "unicode_host_url": h.get("unicode_host_url", host_id),
                "verified": h.get("verified", False),
            })
    return result


@router.get("/hosts")
async def get_hosts(_user: User = Depends(get_current_user)):
    """List all verified hosts from all connected accounts."""
    result = []
    seen = set()

    for token in [settings.yandex_oauth_token, settings.yandex_oauth_token_padel]:
        if not token:
            continue
        client = YandexWebmasterClient(token)
        try:
            hosts = await _fetch_hosts_from_client(client)
            for h in hosts:
                if h["host_id"] not in seen:
                    seen.add(h["host_id"])
                    result.append(h)
        except Exception as e:
            logger.warning("Failed to fetch hosts for token: %s", e)
        finally:
            await client.close()

    if not result and not settings.yandex_oauth_token:
        raise HTTPException(status_code=400, detail="Яндекс OAuth токен не настроен")

    return result


@router.get("/hosts/{host_id}/diagnostics")
async def get_diagnostics(
    host_id: str,
    _user: User = Depends(get_current_user),
):
    """Get site diagnostics and errors."""
    client = _get_client(host_id)
    try:
        user_id = await _get_user_id(client)
        return await client.get_diagnostics(user_id, host_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


@router.get("/hosts/{host_id}/summary")
async def get_host_summary(
    host_id: str,
    _user: User = Depends(get_current_user),
):
    """Get indexing summary for a host."""
    client = _get_client(host_id)
    try:
        user_id = await _get_user_id(client)
        summary = await client.get_indexing_stats(user_id, host_id)
        info = await client.get_host_info(user_id, host_id)
        return {**summary, "iks": info.get("site_quality_score", {}).get("value")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


@router.get("/hosts/{host_id}/sitemaps")
async def get_sitemaps(
    host_id: str,
    _user: User = Depends(get_current_user),
):
    """Get submitted sitemaps for a host."""
    client = _get_client(host_id)
    try:
        user_id = await _get_user_id(client)
        return await client.get_sitemaps(user_id, host_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


class RecrawlRequest(BaseModel):
    host_id: str
    url: str


@router.post("/recrawl")
async def submit_recrawl(
    body: RecrawlRequest,
    _user: User = Depends(get_current_user),
):
    """Submit a URL for recrawling by Yandex."""
    client = _get_client(body.host_id)
    try:
        user_id = await _get_user_id(client)
        quota = await client.get_recrawl_quota(user_id, body.host_id)
        daily_quota = quota.get("daily_quota", 0)
        used_quota = quota.get("quota_used_today", 0)
        if daily_quota > 0 and used_quota >= daily_quota:
            raise HTTPException(
                status_code=429,
                detail=f"Квота переобхода исчерпана: {used_quota}/{daily_quota} сегодня"
            )
        result = await client.add_recrawl_url(user_id, body.host_id, body.url)
        return {"ok": True, "result": result, "quota_remaining": daily_quota - used_quota - 1}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()


class SitemapRequest(BaseModel):
    host_id: str
    sitemap_url: str


@router.post("/sitemaps")
async def add_sitemap(
    body: SitemapRequest,
    _user: User = Depends(get_current_user),
):
    """Submit a sitemap URL."""
    client = _get_client(body.host_id)
    try:
        user_id = await _get_user_id(client)
        result = await client.add_sitemap(user_id, body.host_id, body.sitemap_url)
        return {"ok": True, "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        await client.close()
