import logging

from fastapi import APIRouter, Depends, Query

from app.auth.middleware import get_current_user
from app.clients.calltouch import CalltouchClient
from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calltouch", tags=["Calltouch"])


def _client() -> CalltouchClient:
    return CalltouchClient(settings.calltouch_site_id, settings.calltouch_api_key)


@router.get("/leads")
async def get_calltouch_leads(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Leads summary: target calls + requests."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}
    client = _client()
    try:
        return await client.get_leads_summary(date_from, date_to)
    finally:
        await client.close()


@router.get("/daily")
async def get_calltouch_daily(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Daily breakdown of calls, requests, leads."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}
    client = _client()
    try:
        return await client.get_daily_breakdown(date_from, date_to)
    finally:
        await client.close()


@router.get("/journal")
async def get_calltouch_journal(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Detailed call journal with all fields."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}
    client = _client()
    try:
        return await client.get_calls_journal(date_from, date_to)
    finally:
        await client.close()


@router.get("/sources")
async def get_calltouch_sources(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Calls grouped by traffic source."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}
    client = _client()
    try:
        return await client.get_source_breakdown(date_from, date_to)
    finally:
        await client.close()


@router.get("/requests")
async def get_calltouch_requests(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    _user: User = Depends(get_current_user),
):
    """Form requests list."""
    if not settings.calltouch_api_key:
        return {"error": "Calltouch API key не настроен"}
    client = _client()
    try:
        from datetime import date as dt
        d1 = dt.fromisoformat(date_from)
        d2 = dt.fromisoformat(date_to)
        return await client.get_requests(d1.strftime("%m/%d/%Y"), d2.strftime("%m/%d/%Y"))
    finally:
        await client.close()
