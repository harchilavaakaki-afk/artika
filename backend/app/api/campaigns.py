from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.db.session import get_db
from app.models.ad import Ad
from app.models.ad_group import AdGroup
from app.models.campaign import Campaign
from app.models.daily_stats import DailyStats
from app.models.keyword import Keyword
from app.models.user import User
from app.schemas.campaign import CampaignListResponse, CampaignResponse, DailyStatsResponse

router = APIRouter(prefix="/campaigns", tags=["Кампании"])
ad_groups_router = APIRouter(prefix="/ad-groups", tags=["Группы объявлений"])
ads_router = APIRouter(prefix="/ads", tags=["Объявления"])


class CampaignCreate(BaseModel):
    name: str
    project_id: int | None = None
    daily_budget: float | None = None
    platform: str = "yandex_direct"
    status: str = "DRAFT"


class CampaignPatch(BaseModel):
    status: str | None = None
    daily_budget: float | None = None
    name: str | None = None


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    status: str | None = None,
    state: str | None = None,
    project_id: int | None = None,
    platform: str | None = None,
    sort_by: str = "name",
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Campaign)
    if project_id:
        query = query.where(Campaign.project_id == project_id)
    if platform:
        query = query.where(Campaign.platform == platform)
    if status:
        query = query.where(Campaign.status == status)
    if state:
        query = query.where(Campaign.state == state)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Sort
    sort_col = getattr(Campaign, sort_by, Campaign.name)
    query = query.order_by(sort_col).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    campaigns = result.scalars().all()
    return CampaignListResponse(campaigns=campaigns, total=total)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Кампания не найдена")
    return campaign


@router.get("/{campaign_id}/stats", response_model=list[DailyStatsResponse])
async def get_campaign_stats(
    campaign_id: int,
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    date_to: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = (
        select(DailyStats)
        .where(
            DailyStats.campaign_id == campaign_id,
            DailyStats.date >= date_from,
            DailyStats.date <= date_to,
        )
        .order_by(DailyStats.date)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{campaign_id}/ad-groups")
async def get_campaign_ad_groups(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AdGroup).where(AdGroup.campaign_id == campaign_id)
    )
    return result.scalars().all()


@router.post("")
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    campaign = Campaign(
        name=body.name,
        project_id=body.project_id,
        daily_budget=body.daily_budget,
        platform=body.platform,
        status=body.status,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.patch("/{campaign_id}")
async def patch_campaign(
    campaign_id: int,
    body: CampaignPatch,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Кампания не найдена")
    if body.status is not None:
        campaign.status = body.status
    if body.daily_budget is not None:
        campaign.daily_budget = body.daily_budget
    if body.name is not None:
        campaign.name = body.name
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/keywords")
async def get_campaign_keywords(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = (
        select(Keyword)
        .join(AdGroup, Keyword.ad_group_id == AdGroup.id)
        .where(AdGroup.campaign_id == campaign_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


# ─── Standalone ad-groups router ──────────────────────────────────────────────

@ad_groups_router.get("")
async def list_ad_groups(
    campaign_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(AdGroup)
    if campaign_id:
        query = query.where(AdGroup.campaign_id == campaign_id)
    result = await db.execute(query)
    return result.scalars().all()


# ─── Standalone ads router ─────────────────────────────────────────────────────

@ads_router.get("")
async def list_ads(
    ad_group_id: int | None = None,
    campaign_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Ad)
    if ad_group_id:
        query = query.where(Ad.ad_group_id == ad_group_id)
    elif campaign_id:
        query = query.join(AdGroup).where(AdGroup.campaign_id == campaign_id)
    result = await db.execute(query)
    return result.scalars().all()
