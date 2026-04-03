from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class CampaignResponse(BaseModel):
    id: int
    yandex_id: int | None = None
    name: str
    type: str | None = None
    status: str | None = None
    state: str | None = None
    daily_budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None
    strategy_type: str | None = None
    synced_at: datetime | None = None
    project_id: int | None = None
    platform: str | None = None

    model_config = {"from_attributes": True}


class CampaignListResponse(BaseModel):
    campaigns: list[CampaignResponse]
    total: int


class DailyStatsResponse(BaseModel):
    id: int
    campaign_id: int
    date: date
    impressions: int
    clicks: int
    cost: Decimal
    conversions: int
    revenue: Decimal
    ctr: Decimal
    avg_cpc: Decimal
    avg_position: Decimal | None = None
    bounce_rate: Decimal | None = None

    model_config = {"from_attributes": True}
