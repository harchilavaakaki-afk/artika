import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.yandex_metrika import YandexMetrikaClient
from app.config import settings
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/metrika", tags=["Метрика"])


@router.get("/traffic")
async def get_metrika_traffic(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    _user: User = Depends(get_current_user),
):
    """Get traffic stats directly from Metrika API."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}

    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}

    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_traffic_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
            dimensions="ym:s:datePeriodday",
            metrics="ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth",
        )
        rows = []
        for row in data.get("data", []):
            date_val = row["dimensions"][0]["name"]
            metrics = row["metrics"]
            rows.append({
                "date": date_val.split(" - ")[0] if " - " in date_val else date_val,
                "visits": int(metrics[0]) if metrics[0] else 0,
                "users": int(metrics[1]) if metrics[1] else 0,
                "bounce_rate": round(metrics[2], 1) if metrics[2] else 0,
                "page_depth": round(metrics[3], 1) if metrics[3] else 0,
            })
        return {"counter_id": cid, "rows": rows}
    finally:
        await client.close()


@router.get("/sources")
async def get_metrika_sources(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    _user: User = Depends(get_current_user),
):
    """Get traffic by source from Metrika API."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}

    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}

    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_source_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
        )
        rows = []
        for row in data.get("data", []):
            source = row["dimensions"][0]["name"]
            metrics = row["metrics"]
            rows.append({
                "source": source,
                "visits": int(metrics[0]) if metrics[0] else 0,
                "users": int(metrics[1]) if metrics[1] else 0,
                "bounce_rate": round(metrics[2], 1) if metrics[2] else 0,
            })
        return {"counter_id": cid, "rows": rows}
    finally:
        await client.close()


@router.get("/pages")
async def get_metrika_pages(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    limit: int = Query(20, ge=1, le=100),
    _user: User = Depends(get_current_user),
):
    """Get top pages by visits."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}
    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}
    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_traffic_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
            dimensions="ym:pv:URLPathFull",
            metrics="ym:pv:pageviews,ym:s:visits,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
            group="all",
            limit=limit,
        )
        rows = []
        for row in data.get("data", []):
            url = row["dimensions"][0]["name"] if row["dimensions"] else "/"
            m = row["metrics"]
            rows.append({
                "url": url,
                "pageviews": int(m[0]) if m[0] else 0,
                "visits": int(m[1]) if m[1] else 0,
                "bounce_rate": round(m[2], 1) if m[2] else 0,
                "avg_duration": round(m[3]) if m[3] else 0,
            })
        rows.sort(key=lambda x: x["visits"], reverse=True)
        return {"counter_id": cid, "rows": rows[:limit]}
    finally:
        await client.close()


@router.get("/devices")
async def get_metrika_devices(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    _user: User = Depends(get_current_user),
):
    """Get visits by device type."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}
    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}
    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_traffic_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
            dimensions="ym:s:deviceCategory",
            metrics="ym:s:visits,ym:s:users,ym:s:bounceRate",
            group="all",
            limit=10,
        )
        rows = []
        for row in data.get("data", []):
            device = row["dimensions"][0]["name"] if row["dimensions"] else "unknown"
            m = row["metrics"]
            rows.append({
                "device": device,
                "visits": int(m[0]) if m[0] else 0,
                "users": int(m[1]) if m[1] else 0,
                "bounce_rate": round(m[2], 1) if m[2] else 0,
            })
        return {"counter_id": cid, "rows": rows}
    finally:
        await client.close()


@router.get("/geo")
async def get_metrika_geo(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    limit: int = Query(15, ge=1, le=50),
    _user: User = Depends(get_current_user),
):
    """Get visits by city."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}
    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}
    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_traffic_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
            dimensions="ym:s:regionCity",
            metrics="ym:s:visits,ym:s:users,ym:s:bounceRate",
            group="all",
            limit=limit,
        )
        rows = []
        for row in data.get("data", []):
            city = row["dimensions"][0]["name"] if row["dimensions"] else "Неизвестно"
            m = row["metrics"]
            rows.append({
                "city": city,
                "visits": int(m[0]) if m[0] else 0,
                "users": int(m[1]) if m[1] else 0,
                "bounce_rate": round(m[2], 1) if m[2] else 0,
            })
        return {"counter_id": cid, "rows": rows}
    finally:
        await client.close()


@router.get("/goals-list")
async def get_metrika_goals(
    counter_id: int | None = None,
    _user: User = Depends(get_current_user),
):
    """Get list of goals for a counter."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}
    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}
    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        goals = await client.get_goals(cid)
        return {"counter_id": cid, "goals": goals}
    finally:
        await client.close()


@router.get("/summary")
async def get_metrika_summary(
    counter_id: int | None = None,
    date_from: str = Query("2026-03-01"),
    date_to: str = Query("2026-03-30"),
    _user: User = Depends(get_current_user),
):
    """Get summary metrics from Metrika."""
    if not settings.yandex_oauth_token:
        return {"error": "Токен не настроен"}

    cid = counter_id or settings.yandex_metrika_counter_id
    if not cid:
        return {"error": "Counter ID не указан"}

    client = YandexMetrikaClient(settings.yandex_oauth_token)
    try:
        data = await client.get_traffic_stats(
            counter_id=cid,
            date1=date_from,
            date2=date_to,
            dimensions="",
            metrics="ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds",
            group="all",
        )
        if data.get("data"):
            m = data["data"][0]["metrics"]
            return {
                "counter_id": cid,
                "visits": int(m[0]) if m[0] else 0,
                "users": int(m[1]) if m[1] else 0,
                "bounce_rate": round(m[2], 1) if m[2] else 0,
                "page_depth": round(m[3], 1) if m[3] else 0,
                "avg_duration": round(m[4]) if m[4] else 0,
            }
        return {"counter_id": cid, "visits": 0, "users": 0}
    finally:
        await client.close()
