import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.vk_ads import VKAdsClient
from app.clients.yandex_direct import YandexDirectClient
from app.clients.yandex_metrika import YandexMetrikaClient
from app.clients.yandex_webmaster import YandexWebmasterClient
from app.config import settings
from app.db.session import get_db, async_session
from app.models.project import Project
from app.models.user import User
from app.services.sync_service import SyncService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["Синхронизация"])

# Store last sync result for status checks
_last_sync_result: dict | None = None
_sync_running = False


def _token_for_ref(ref: str) -> str:
    """Resolve project token ref to actual OAuth token."""
    if ref == "padel":
        return settings.yandex_oauth_token_padel
    return settings.yandex_oauth_token


async def _sync_project(project: Project, days_back: int) -> dict:
    """Sync single project with its own OAuth token (per-account safe)."""
    token = _token_for_ref(project.yandex_token_ref)
    if not token:
        return {"project": project.name, "skipped": f"no token for ref={project.yandex_token_ref}"}

    direct = YandexDirectClient(token)
    metrika = YandexMetrikaClient(token) if project.metrika_counter_id else None
    webmaster = YandexWebmasterClient(token) if project.webmaster_host_id else None
    webmaster_user_id = None
    if webmaster:
        try:
            webmaster_user_id = await webmaster.get_user_id()
        except Exception as e:
            logger.warning("Webmaster user_id failed for %s: %s", project.name, e)
            await webmaster.close()
            webmaster = None

    report: dict = {"project": project.name, "ref": project.yandex_token_ref}
    try:
        async with async_session() as db:
            svc = SyncService(
                db=db,
                direct_client=direct,
                metrika_client=metrika,
                webmaster_client=webmaster,
                webmaster_user_id=webmaster_user_id,
                webmaster_host_id=project.webmaster_host_id,
            )
            try:
                report["direct"] = await svc.sync_direct_for_project(project, days_back=days_back)
            except Exception as e:
                logger.exception("Direct failed for %s", project.name)
                report["direct_error"] = str(e)
            if metrika:
                try:
                    report["metrika"] = await svc.sync_metrika_for_project(project, days_back=days_back)
                except Exception as e:
                    logger.exception("Metrika failed for %s", project.name)
                    report["metrika_error"] = str(e)
            if webmaster and webmaster_user_id:
                try:
                    report["webmaster"] = await svc.sync_webmaster_queries(days_back=30)
                except Exception as e:
                    logger.exception("Webmaster failed for %s", project.name)
                    report["webmaster_error"] = str(e)
    finally:
        await direct.close()
        if metrika:
            await metrika.close()
        if webmaster:
            await webmaster.close()
    return report


async def _run_sync_background(days_back: int):
    """Run sync in background for every active project with its own token."""
    global _last_sync_result, _sync_running
    _sync_running = True
    overall: dict = {"projects": []}
    try:
        async with async_session() as db:
            projects = (await db.execute(
                select(Project).where(Project.is_active == True)  # noqa: E712
            )).scalars().all()

        for project in projects:
            try:
                rep = await _sync_project(project, days_back)
            except Exception as e:
                logger.exception("Sync failed for project %s", project.name)
                rep = {"project": project.name, "error": str(e)}
            overall["projects"].append(rep)

        # VK (global — один аккаунт)
        if settings.vk_ads_access_token:
            vk_client = VKAdsClient(settings.vk_ads_access_token)
            try:
                async with async_session() as db:
                    svc = SyncService(db=db, vk_client=vk_client)
                    overall["vk"] = {
                        "campaigns": await svc.sync_vk_campaigns(),
                        "banners": await svc.sync_vk_banners(),
                        "stats": await svc.sync_vk_stats(days_back),
                    }
            except Exception as e:
                logger.exception("VK sync failed")
                overall["vk_error"] = str(e)
            finally:
                await vk_client.close()

        _last_sync_result = {"status": "ok", "report": overall}
        logger.info("Background sync complete: %s", overall)
    except Exception as e:
        logger.exception("Background sync failed")
        _last_sync_result = {"status": "error", "error": str(e)}
    finally:
        _sync_running = False


@router.post("/trigger")
async def trigger_sync(
    days_back: int = 30,
    _user: User = Depends(get_current_user),
):
    """Trigger sync in background — returns immediately.

    Итерирует по всем активным проектам и использует токен из project.yandex_token_ref.
    """
    global _sync_running
    if not (settings.yandex_oauth_token or settings.yandex_oauth_token_padel):
        raise HTTPException(status_code=400, detail="Нет ни одного Yandex OAuth токена.")

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
