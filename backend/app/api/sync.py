import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.vk_ads import VKAdsClient
from app.clients.yandex_direct import YandexDirectClient
from app.clients.yandex_metrika import YandexMetrikaClient
from app.clients.yandex_webmaster import YandexWebmasterClient
from app.config import settings
from app.db.session import get_db, async_session
from app.models.user import User
from app.services.sync_service import SyncService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["Синхронизация"])

# Store last sync result for status checks
_last_sync_result: dict | None = None
_sync_running = False


async def _run_sync_background(days_back: int):
    """Run sync in background — not tied to request lifecycle."""
    global _last_sync_result, _sync_running
    _sync_running = True

    direct_client = YandexDirectClient(settings.yandex_oauth_token)
    metrika_client = YandexMetrikaClient(settings.yandex_oauth_token) if settings.yandex_metrika_counter_id else None
    webmaster_client = None
    webmaster_user_id = None

    if settings.yandex_webmaster_host_id:
        webmaster_client = YandexWebmasterClient(settings.yandex_oauth_token)
        try:
            webmaster_user_id = await webmaster_client.get_user_id()
        except Exception as e:
            logger.warning("Failed to get Webmaster user ID: %s", e)
            webmaster_client = None

    vk_client = VKAdsClient(settings.vk_ads_access_token) if settings.vk_ads_access_token else None

    try:
        async with async_session() as db:
            sync_service = SyncService(
                db=db,
                direct_client=direct_client,
                metrika_client=metrika_client,
                webmaster_client=webmaster_client,
                vk_client=vk_client,
                metrika_counter_id=settings.yandex_metrika_counter_id or None,
                webmaster_user_id=webmaster_user_id,
                webmaster_host_id=settings.yandex_webmaster_host_id or None,
            )
            report = await sync_service.sync_all(days_back=days_back)
            _last_sync_result = {"status": "ok", "report": report}
            logger.info("Background sync complete: %s", report)
    except Exception as e:
        logger.exception("Background sync failed")
        _last_sync_result = {"status": "error", "error": str(e)}
    finally:
        _sync_running = False
        await direct_client.close()
        if metrika_client:
            await metrika_client.close()
        if webmaster_client:
            await webmaster_client.close()
        if vk_client:
            await vk_client.close()


@router.post("/trigger")
async def trigger_sync(
    days_back: int = 7,
    _user: User = Depends(get_current_user),
):
    """Trigger sync in background — returns immediately."""
    global _sync_running
    if not settings.yandex_oauth_token:
        raise HTTPException(status_code=400, detail="Yandex OAuth токен не настроен.")

    if _sync_running:
        return {"status": "already_running", "message": "Синхронизация уже запущена"}

    asyncio.create_task(_run_sync_background(days_back))
    return {"status": "started", "message": "Синхронизация запущена в фоне"}


@router.get("/status")
async def sync_status(
    _user: User = Depends(get_current_user),
):
    """Check last sync result."""
    return {
        "running": _sync_running,
        "last_result": _last_sync_result,
    }
