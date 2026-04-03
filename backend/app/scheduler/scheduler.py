import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def sync_all_data():
    """Scheduled job: sync all data from Yandex APIs."""
    from app.clients.yandex_direct import YandexDirectClient
    from app.clients.yandex_metrika import YandexMetrikaClient
    from app.clients.yandex_webmaster import YandexWebmasterClient
    from app.db.session import async_session
    from app.services.sync_service import SyncService

    if not settings.yandex_oauth_token:
        logger.warning("Skipping scheduled sync: no Yandex OAuth token configured")
        return

    logger.info("Starting scheduled sync...")
    async with async_session() as db:
        direct = YandexDirectClient(settings.yandex_oauth_token)
        metrika = YandexMetrikaClient(settings.yandex_oauth_token) if settings.yandex_metrika_counter_id else None
        webmaster = None
        webmaster_uid = None

        if settings.yandex_webmaster_host_id:
            webmaster = YandexWebmasterClient(settings.yandex_oauth_token)
            try:
                webmaster_uid = await webmaster.get_user_id()
            except Exception:
                webmaster = None

        try:
            sync = SyncService(
                db=db,
                direct_client=direct,
                metrika_client=metrika,
                webmaster_client=webmaster,
                metrika_counter_id=settings.yandex_metrika_counter_id or None,
                webmaster_user_id=webmaster_uid,
                webmaster_host_id=settings.yandex_webmaster_host_id or None,
            )
            report = await sync.sync_all()
            logger.info("Scheduled sync complete: %s", report)
        except Exception:
            logger.exception("Scheduled sync failed")
        finally:
            await direct.close()
            if metrika:
                await metrika.close()
            if webmaster:
                await webmaster.close()


async def refresh_vk_campaigns():
    """Refresh VK campaign cache using stored session cookie (runs every 6 hours)."""
    import json
    from app.clients.vk_ads import VKAdsCookieClient
    from app.api.vk_ads_api import CAMPAIGNS_CACHE

    # Get cookie from settings or DB
    cookie = settings.vk_ads_cookie or ""
    if not cookie:
        from app.db.session import async_session
        from sqlalchemy import select
        from app.models.api_credential import ApiCredential
        async with async_session() as db:
            result = await db.execute(
                select(ApiCredential).where(
                    ApiCredential.service == "VK_ADS_COOKIE",
                    ApiCredential.is_active == True,
                )
            )
            cred = result.scalar_one_or_none()
            if cred and cred.oauth_token:
                cookie = cred.oauth_token

    if not cookie:
        logger.info("VK campaign refresh skipped: no cookie stored")
        return

    logger.info("Refreshing VK campaign cache...")
    client = VKAdsCookieClient(cookie, account_id=settings.vk_ads_account_id)
    try:
        campaigns = await client.get_campaigns()
        data = {"items": campaigns, "count": len(campaigns), "source": "scheduler"}
        CAMPAIGNS_CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info("VK campaign cache refreshed: %d campaigns", len(campaigns))
    except Exception:
        logger.exception("VK campaign refresh failed")
    finally:
        await client.close()


async def refresh_vk_token():
    """Refresh VK Ads access token every 23 hours using client credentials.

    Updates settings in memory (immediate effect) and optionally persists
    to Render env vars via API if RENDER_API_KEY + RENDER_SERVICE_ID are set.
    """
    if not settings.vk_ads_client_id or not settings.vk_ads_client_secret:
        logger.info("VK token refresh skipped: no client_id/client_secret")
        return

    import httpx
    import os

    logger.info("Refreshing VK Ads token...")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://target.my.com/api/v2/oauth2/token.json",
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.vk_ads_client_id,
                    "client_secret": settings.vk_ads_client_secret,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            new_token = data.get("access_token")
            if not new_token:
                logger.error("VK token refresh: no access_token in response: %s", data)
                return

            # 1. Update settings in memory (current process, immediate effect)
            settings.vk_ads_access_token = new_token
            logger.info("VK Ads token updated in memory")

            # 2. Persist to Render env var (survives restarts)
            render_api_key = os.environ.get("RENDER_API_KEY", "")
            render_service_id = os.environ.get("RENDER_SERVICE_ID", "")
            if render_api_key and render_service_id:
                try:
                    r = await client.put(
                        f"https://api.render.com/v1/services/{render_service_id}/env-vars",
                        headers={"Authorization": f"Bearer {render_api_key}", "Content-Type": "application/json"},
                        json=[{"key": "VK_ADS_ACCESS_TOKEN", "value": new_token}],
                    )
                    if r.status_code in (200, 201):
                        logger.info("VK token persisted to Render env vars")
                    else:
                        logger.warning("Render env update failed: %s %s", r.status_code, r.text[:200])
                except Exception as e:
                    logger.warning("Could not update Render env var: %s", e)

            # 3. Update local .env as fallback
            try:
                from pathlib import Path
                env_path = Path(__file__).resolve().parent.parent.parent / ".env"
                if env_path.exists():
                    content = env_path.read_text(encoding="utf-8")
                    lines = [
                        f"VK_ADS_ACCESS_TOKEN={new_token}" if l.startswith("VK_ADS_ACCESS_TOKEN=") else l
                        for l in content.splitlines()
                    ]
                    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            except Exception:
                pass

            logger.info("VK Ads token refresh complete")
    except Exception:
        logger.exception("Failed to refresh VK Ads token")


def start_scheduler():
    """Register jobs and start the scheduler."""
    from apscheduler.triggers.date import DateTrigger
    from datetime import datetime, timedelta

    scheduler.add_job(
        sync_all_data,
        trigger=IntervalTrigger(minutes=settings.sync_interval_minutes),
        id="sync_all_data",
        replace_existing=True,
    )
    scheduler.add_job(
        refresh_vk_token,
        trigger=IntervalTrigger(hours=23),
        id="refresh_vk_token",
        replace_existing=True,
    )
    # Run VK token refresh immediately on startup (token may be expired)
    scheduler.add_job(
        refresh_vk_token,
        trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=5)),
        id="refresh_vk_token_startup",
        replace_existing=True,
    )
    scheduler.add_job(
        refresh_vk_campaigns,
        trigger=IntervalTrigger(hours=6),
        id="refresh_vk_campaigns",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started. Sync interval: %d minutes", settings.sync_interval_minutes)


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
