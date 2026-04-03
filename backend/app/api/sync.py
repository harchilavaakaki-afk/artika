import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.vk_ads import VKAdsClient
from app.clients.yandex_direct import YandexDirectClient
from app.clients.yandex_metrika import YandexMetrikaClient
from app.clients.yandex_webmaster import YandexWebmasterClient
from app.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services.sync_service import SyncService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["Синхронизация"])


@router.post("/trigger")
async def trigger_sync(
    days_back: int = 7,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Manually trigger a full data sync."""
    if not settings.yandex_oauth_token:
        raise HTTPException(status_code=400, detail="Yandex OAuth токен не настроен. Укажите его в настройках.")

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
        return {"status": "ok", "report": report}
    except Exception as e:
        logger.exception("Sync failed")
        raise HTTPException(status_code=500, detail=f"Ошибка синхронизации: {e}")
    finally:
        await direct_client.close()
        if metrika_client:
            await metrika_client.close()
        if webmaster_client:
            await webmaster_client.close()
        if vk_client:
            await vk_client.close()
