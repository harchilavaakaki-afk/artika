import json
import logging
import re
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.clients.claude_client import ClaudeClient
from app.config import settings
from app.db.session import get_db
from app.models.ad import Ad
from app.models.ad_group import AdGroup
from app.models.ai_insight import AiInsight
from app.models.campaign import Campaign
from app.models.daily_stats import DailyStats
from app.models.keyword import Keyword
from app.models.user import User
from app.services.prompts import performance_analysis, keyword_analysis, ad_variant_suggestions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-insights", tags=["AI-аналитика"])


def _extract_json_block(text: str) -> dict | None:
    """Extract JSON block from Claude's response."""
    match = re.search(r"```json\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None


@router.get("")
async def list_insights(
    campaign_id: int | None = None,
    insight_type: str | None = None,
    status: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(AiInsight).order_by(AiInsight.created_at.desc()).limit(limit)
    if campaign_id:
        query = query.where(AiInsight.campaign_id == campaign_id)
    if insight_type:
        query = query.where(AiInsight.insight_type == insight_type)
    if status:
        query = query.where(AiInsight.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{insight_id}")
async def get_insight(
    insight_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(AiInsight).where(AiInsight.id == insight_id))
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="Инсайт не найден")
    # Mark as viewed
    if insight.status == "NEW":
        insight.status = "VIEWED"
        await db.commit()
    return insight


@router.patch("/{insight_id}/status")
async def update_insight_status(
    insight_id: int,
    new_status: str = Query(..., pattern="^(VIEWED|APPLIED|DISMISSED)$"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(AiInsight).where(AiInsight.id == insight_id))
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="Инсайт не найден")
    insight.status = new_status
    await db.commit()
    return {"status": "ok"}


@router.post("/campaign/{campaign_id}/performance")
async def analyze_campaign_performance(
    campaign_id: int,
    days_back: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=400, detail="Anthropic API ключ не настроен")

    # Fetch campaign
    campaign = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Кампания не найдена")

    # Fetch stats
    date_from = date.today() - timedelta(days=days_back)
    stats = (await db.execute(
        select(DailyStats)
        .where(DailyStats.campaign_id == campaign_id, DailyStats.date >= date_from)
        .order_by(DailyStats.date)
    )).scalars().all()

    # Fetch keywords
    keywords = (await db.execute(
        select(Keyword)
        .join(AdGroup, Keyword.ad_group_id == AdGroup.id)
        .where(AdGroup.campaign_id == campaign_id)
    )).scalars().all()

    # Format data for Claude
    campaign_dict = {"name": campaign.name, "type": campaign.type, "state": campaign.state, "daily_budget": str(campaign.daily_budget)}
    stats_dicts = [{"date": str(s.date), "impressions": s.impressions, "clicks": s.clicks, "ctr": float(s.ctr), "cost": float(s.cost), "conversions": s.conversions} for s in stats]
    kw_dicts = [{"keyword": k.keyword, "bid": str(k.bid), "status": k.status, "serving_status": k.serving_status} for k in keywords]

    user_message = performance_analysis.format_data(campaign_dict, stats_dicts, kw_dicts)

    # Call Claude
    claude = ClaudeClient(settings.anthropic_api_key, settings.claude_model)
    try:
        response_text = await claude.analyze(performance_analysis.SYSTEM_PROMPT, user_message)
    finally:
        await claude.close()

    # Parse and store insight
    json_block = _extract_json_block(response_text)
    insight = AiInsight(
        campaign_id=campaign_id,
        insight_type="PERFORMANCE",
        title=f"Анализ эффективности: {campaign.name}",
        content=response_text,
        recommendations=json_block.get("recommendations") if json_block else None,
        metadata_={"days_back": days_back, "model": settings.claude_model},
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return insight


@router.post("/campaign/{campaign_id}/keywords")
async def analyze_campaign_keywords(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=400, detail="Anthropic API ключ не настроен")

    campaign = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Кампания не найдена")

    keywords = (await db.execute(
        select(Keyword)
        .join(AdGroup, Keyword.ad_group_id == AdGroup.id)
        .where(AdGroup.campaign_id == campaign_id)
    )).scalars().all()

    kw_data = [{"keyword": k.keyword, "bid": str(k.bid), "impressions": 0, "clicks": 0, "cost": 0, "conversions": 0} for k in keywords]

    user_message = keyword_analysis.format_data(kw_data)

    claude = ClaudeClient(settings.anthropic_api_key, settings.claude_model)
    try:
        response_text = await claude.analyze(keyword_analysis.SYSTEM_PROMPT, user_message)
    finally:
        await claude.close()

    json_block = _extract_json_block(response_text)
    insight = AiInsight(
        campaign_id=campaign_id,
        insight_type="KEYWORDS",
        title=f"Анализ ключевых слов: {campaign.name}",
        content=response_text,
        recommendations=json_block.get("recommendations") if json_block else None,
        metadata_={"model": settings.claude_model},
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return insight


@router.post("/ad-group/{ad_group_id}/ad-variants")
async def suggest_ad_variants(
    ad_group_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=400, detail="Anthropic API ключ не настроен")

    ad_group = (await db.execute(select(AdGroup).where(AdGroup.id == ad_group_id))).scalar_one_or_none()
    if not ad_group:
        raise HTTPException(status_code=404, detail="Группа объявлений не найдена")

    ads = (await db.execute(select(Ad).where(Ad.ad_group_id == ad_group_id))).scalars().all()
    keywords = (await db.execute(select(Keyword).where(Keyword.ad_group_id == ad_group_id))).scalars().all()

    ag_dict = {"name": ad_group.name}
    ads_dicts = [{"title": a.title, "title2": a.title2, "text": a.text, "href": a.href, "status": a.status} for a in ads]
    kw_list = [k.keyword for k in keywords]

    user_message = ad_variant_suggestions.format_data(ag_dict, ads_dicts, kw_list)

    claude = ClaudeClient(settings.anthropic_api_key, settings.claude_model)
    try:
        response_text = await claude.analyze(ad_variant_suggestions.SYSTEM_PROMPT, user_message)
    finally:
        await claude.close()

    json_block = _extract_json_block(response_text)
    insight = AiInsight(
        campaign_id=ad_group.campaign_id,
        insight_type="AD_VARIANTS",
        title=f"Варианты объявлений: {ad_group.name}",
        content=response_text,
        recommendations=json_block.get("recommendations") if json_block else None,
        metadata_={"ad_group_id": ad_group_id, "model": settings.claude_model},
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return insight
