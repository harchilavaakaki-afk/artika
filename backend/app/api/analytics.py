from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign
from app.models.daily_stats import DailyStats
from app.models.ad_group import AdGroup
from app.models.ad import Ad
from app.models.keyword import Keyword
from app.models.user import User
from app.schemas.analytics import OverviewResponse, SyncStatusResponse

router = APIRouter(prefix="/analytics", tags=["Аналитика"])


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    # Current period
    query = select(
        func.coalesce(func.sum(DailyStats.cost), 0).label("total_spend"),
        func.coalesce(func.sum(DailyStats.clicks), 0).label("total_clicks"),
        func.coalesce(func.sum(DailyStats.impressions), 0).label("total_impressions"),
        func.coalesce(func.sum(DailyStats.conversions), 0).label("total_conversions"),
    ).where(DailyStats.date >= date_from, DailyStats.date <= date_to)

    result = (await db.execute(query)).one()

    total_spend = result.total_spend or Decimal(0)
    total_clicks = result.total_clicks or 0
    total_impressions = result.total_impressions or 0
    total_conversions = result.total_conversions or 0

    avg_ctr = (Decimal(total_clicks) / Decimal(total_impressions) * 100) if total_impressions else Decimal(0)
    avg_cpc = (total_spend / Decimal(total_clicks)) if total_clicks else Decimal(0)
    avg_cpa = (total_spend / Decimal(total_conversions)) if total_conversions else None

    # Previous period delta
    period_days = (date_to - date_from).days
    prev_from = date_from - timedelta(days=period_days)
    prev_to = date_from - timedelta(days=1)

    prev_query = select(
        func.coalesce(func.sum(DailyStats.cost), 0),
        func.coalesce(func.sum(DailyStats.clicks), 0),
        func.coalesce(func.sum(DailyStats.conversions), 0),
        func.coalesce(func.sum(DailyStats.impressions), 0),
    ).where(DailyStats.date >= prev_from, DailyStats.date <= prev_to)

    prev = (await db.execute(prev_query)).one()
    prev_spend = prev[0] or Decimal(0)
    prev_clicks = prev[1] or 0
    prev_conversions = prev[2] or 0
    prev_impressions = prev[3] or 0
    prev_ctr = (Decimal(prev_clicks) / Decimal(prev_impressions) * 100) if prev_impressions else Decimal(0)

    def delta_pct(current, previous):
        if not previous:
            return None
        return round((Decimal(str(current)) - Decimal(str(previous))) / Decimal(str(previous)) * 100, 2)

    return OverviewResponse(
        total_spend=total_spend,
        total_clicks=total_clicks,
        total_impressions=total_impressions,
        total_conversions=total_conversions,
        avg_ctr=round(avg_ctr, 2),
        avg_cpc=round(avg_cpc, 2),
        avg_cpa=round(avg_cpa, 2) if avg_cpa else None,
        spend_delta=delta_pct(total_spend, prev_spend),
        clicks_delta=delta_pct(total_clicks, prev_clicks),
        conversions_delta=delta_pct(total_conversions, prev_conversions),
        ctr_delta=delta_pct(avg_ctr, prev_ctr),
    )


@router.get("/sync-status", response_model=SyncStatusResponse)
async def get_sync_status(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    campaigns = (await db.execute(select(func.count(Campaign.id)))).scalar() or 0
    ad_groups = (await db.execute(select(func.count(AdGroup.id)))).scalar() or 0
    ads = (await db.execute(select(func.count(Ad.id)))).scalar() or 0
    keywords = (await db.execute(select(func.count(Keyword.id)))).scalar() or 0

    last_sync_result = await db.execute(
        select(func.max(Campaign.synced_at))
    )
    last_sync = last_sync_result.scalar()

    return SyncStatusResponse(
        last_sync=last_sync.isoformat() if last_sync else None,
        campaigns=campaigns,
        ad_groups=ad_groups,
        ads=ads,
        keywords=keywords,
    )
