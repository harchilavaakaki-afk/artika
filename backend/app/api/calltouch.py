import logging

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.clients.calltouch import CalltouchClient
from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calltouch", tags=["Calltouch"])


@router.get("/leads")
async def get_calltouch_leads(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Get leads summary: target calls + requests."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}

    client = CalltouchClient(settings.calltouch_site_id, settings.calltouch_api_key)
    try:
        return await client.get_leads_summary(date_from, date_to)
    finally:
        await client.close()


@router.get("/calls")
async def get_calltouch_calls(
    date_from: str = Query(..., description="DD/MM/YYYY"),
    date_to: str = Query(..., description="DD/MM/YYYY"),
    _user: User = Depends(get_current_user),
):
    """Get raw calls diary."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}

    client = CalltouchClient(settings.calltouch_site_id, settings.calltouch_api_key)
    try:
        data = await client.get_calls(date_from, date_to)
        data.pop("records", None)
        return data
    finally:
        await client.close()
