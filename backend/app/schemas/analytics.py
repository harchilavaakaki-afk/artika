from decimal import Decimal

from pydantic import BaseModel


class OverviewResponse(BaseModel):
    total_spend: Decimal
    total_clicks: int
    total_impressions: int
    total_conversions: int
    avg_ctr: Decimal
    avg_cpc: Decimal
    avg_cpa: Decimal | None = None

    # Deltas vs previous period
    spend_delta: Decimal | None = None
    clicks_delta: Decimal | None = None
    conversions_delta: Decimal | None = None
    ctr_delta: Decimal | None = None


class SyncStatusResponse(BaseModel):
    last_sync: str | None = None
    campaigns: int = 0
    ad_groups: int = 0
    ads: int = 0
    keywords: int = 0
