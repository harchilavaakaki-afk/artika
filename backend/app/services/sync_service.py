import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.vk_ads import VKAdsClient
from app.clients.yandex_direct import YandexDirectClient
from app.clients.yandex_metrika import YandexMetrikaClient
from app.clients.yandex_webmaster import YandexWebmasterClient
from app.models.ad import Ad
from app.models.ad_group import AdGroup
from app.models.campaign import Campaign
from app.models.conversion import Conversion
from app.models.daily_stats import DailyStats
from app.models.goal import Goal
from app.models.keyword import Keyword
from app.models.project import Project
from app.models.search_query import SearchQuery
from app.models.webmaster_query import WebmasterQuery

logger = logging.getLogger(__name__)


async def _upsert_by_field(db: AsyncSession, model, lookup_field: str, lookup_value, values: dict):
    """Generic upsert: find by lookup field, update or insert."""
    query = select(model).where(getattr(model, lookup_field) == lookup_value)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    if existing:
        for k, v in values.items():
            if k != lookup_field:
                setattr(existing, k, v)
    else:
        obj = model(**values)
        db.add(obj)


async def _upsert_composite(db: AsyncSession, model, filters: dict, values: dict):
    """Upsert with composite key lookup."""
    query = select(model)
    for field, val in filters.items():
        query = query.where(getattr(model, field) == val)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    if existing:
        for k, v in values.items():
            if k not in filters:
                setattr(existing, k, v)
    else:
        obj = model(**{**filters, **values})
        db.add(obj)


class SyncService:
    def __init__(
        self,
        db: AsyncSession,
        direct_client: YandexDirectClient | None = None,
        metrika_client: YandexMetrikaClient | None = None,
        webmaster_client: YandexWebmasterClient | None = None,
        vk_client: VKAdsClient | None = None,
        metrika_counter_id: int | None = None,
        webmaster_user_id: int | None = None,
        webmaster_host_id: str | None = None,
    ):
        self.db = db
        self.direct = direct_client
        self.metrika = metrika_client
        self.webmaster = webmaster_client
        self.vk = vk_client
        self.metrika_counter_id = metrika_counter_id
        self.webmaster_user_id = webmaster_user_id
        self.webmaster_host_id = webmaster_host_id

    async def sync_all(self, days_back: int = 7) -> dict:
        """Run full sync pipeline. Returns count of records synced per entity."""
        report = {}
        errors = []

        if self.direct:
            try:
                report["campaigns"] = await self.sync_campaigns()
                report["ad_groups"] = await self.sync_ad_groups()
                report["ads"] = await self.sync_ads()
                report["keywords"] = await self.sync_keywords()
                report["daily_stats"] = await self.sync_daily_stats(days_back)
                report["search_queries"] = await self.sync_search_queries(days_back)
                logger.info("Direct sync complete: %s", report)
            except Exception as e:
                logger.warning("Direct sync failed: %s", e)
                errors.append(f"Direct: {e}")

        if self.metrika and self.metrika_counter_id:
            try:
                report["goals"] = await self.sync_goals()
                report["conversions"] = await self.sync_conversions(days_back)
                logger.info("Metrika sync complete: goals=%s, conversions=%s",
                            report.get("goals"), report.get("conversions"))
            except Exception as e:
                logger.warning("Metrika sync failed: %s", e)
                errors.append(f"Metrika: {e}")

        if self.webmaster and self.webmaster_user_id and self.webmaster_host_id:
            try:
                report["webmaster_queries"] = await self.sync_webmaster_queries(days_back=30)
                logger.info("Webmaster sync complete: queries=%s", report.get("webmaster_queries"))
            except Exception as e:
                logger.warning("Webmaster sync failed: %s", e)
                errors.append(f"Webmaster: {e}")

        if self.vk:
            try:
                report["vk_campaigns"] = await self.sync_vk_campaigns()
                report["vk_banners"] = await self.sync_vk_banners()
                report["vk_stats"] = await self.sync_vk_stats(days_back)
                logger.info("VK sync complete: campaigns=%s, banners=%s",
                            report.get("vk_campaigns"), report.get("vk_banners"))
            except Exception as e:
                logger.warning("VK sync failed: %s", e)
                errors.append(f"VK: {e}")

        report["synced_at"] = datetime.now(timezone.utc).isoformat()
        if errors:
            report["errors"] = errors
        return report

    # --- Yandex Direct ---

    async def sync_campaigns(self) -> int:
        now = datetime.now(timezone.utc)
        campaigns = await self.direct.get_campaigns()
        count = 0
        for c in campaigns:
            daily_budget = None
            if "DailyBudget" in c:
                daily_budget = int(c["DailyBudget"].get("Amount", 0)) / 1_000_000

            strategy_type = None
            strategy_params = None
            if "TextCampaign" in c and "BiddingStrategy" in c["TextCampaign"]:
                strategy = c["TextCampaign"]["BiddingStrategy"]
                strategy_type = strategy.get("Search", {}).get("BiddingStrategyType")
                strategy_params = strategy

            values = {
                "yandex_id": c["Id"],
                "name": c.get("Name", ""),
                "type": c.get("Type"),
                "status": c.get("Status"),
                "state": c.get("State"),
                "daily_budget": daily_budget,
                "start_date": c.get("StartDate"),
                "end_date": c.get("EndDate"),
                "strategy_type": strategy_type,
                "strategy_params": strategy_params,
                "synced_at": now,
            }
            await _upsert_by_field(self.db, Campaign, "yandex_id", c["Id"], values)
            count += 1

        await self.db.commit()
        return count

    async def sync_ad_groups(self) -> int:
        now = datetime.now(timezone.utc)
        campaigns = (await self.db.execute(select(Campaign))).scalars().all()
        campaign_map = {c.yandex_id: c.id for c in campaigns}

        if not campaign_map:
            return 0

        yandex_ids = list(campaign_map.keys())
        ad_groups = await self.direct.get_ad_groups(yandex_ids)
        count = 0
        for ag in ad_groups:
            campaign_internal_id = campaign_map.get(ag["CampaignId"])
            if not campaign_internal_id:
                continue
            values = {
                "yandex_id": ag["Id"],
                "campaign_id": campaign_internal_id,
                "name": ag.get("Name", ""),
                "status": ag.get("Status"),
                "region_ids": ag.get("RegionIds"),
                "synced_at": now,
            }
            await _upsert_by_field(self.db, AdGroup, "yandex_id", ag["Id"], values)
            count += 1

        await self.db.commit()
        return count

    async def sync_ads(self) -> int:
        now = datetime.now(timezone.utc)
        ad_groups = (await self.db.execute(select(AdGroup))).scalars().all()
        ag_map = {ag.yandex_id: ag.id for ag in ad_groups}

        if not ag_map:
            return 0

        yandex_ids = list(ag_map.keys())
        count = 0
        for i in range(0, len(yandex_ids), 1000):
            batch = yandex_ids[i:i + 1000]
            ads = await self.direct.get_ads(batch)
            for ad in ads:
                ag_internal_id = ag_map.get(ad["AdGroupId"])
                if not ag_internal_id:
                    continue
                text_ad = ad.get("TextAd", {})
                values = {
                    "yandex_id": ad["Id"],
                    "ad_group_id": ag_internal_id,
                    "type": ad.get("Type"),
                    "title": text_ad.get("Title"),
                    "title2": text_ad.get("Title2"),
                    "text": text_ad.get("Text"),
                    "href": text_ad.get("Href"),
                    "display_url_path": text_ad.get("DisplayUrlPath"),
                    "status": ad.get("Status"),
                    "synced_at": now,
                }
                await _upsert_by_field(self.db, Ad, "yandex_id", ad["Id"], values)
                count += 1

        await self.db.commit()
        return count

    async def sync_keywords(self) -> int:
        now = datetime.now(timezone.utc)
        ad_groups = (await self.db.execute(select(AdGroup))).scalars().all()
        ag_map = {ag.yandex_id: ag.id for ag in ad_groups}

        if not ag_map:
            return 0

        yandex_ids = list(ag_map.keys())
        count = 0
        for i in range(0, len(yandex_ids), 1000):
            batch = yandex_ids[i:i + 1000]
            keywords = await self.direct.get_keywords(batch)
            for kw in keywords:
                ag_internal_id = ag_map.get(kw["AdGroupId"])
                if not ag_internal_id:
                    continue
                bid = None
                if kw.get("Bid"):
                    bid = int(kw["Bid"]) / 1_000_000
                values = {
                    "yandex_id": kw["Id"],
                    "ad_group_id": ag_internal_id,
                    "keyword": kw.get("Keyword", ""),
                    "bid": bid,
                    "status": kw.get("Status"),
                    "serving_status": kw.get("ServingStatus"),
                    "synced_at": now,
                }
                await _upsert_by_field(self.db, Keyword, "yandex_id", kw["Id"], values)
                count += 1

        await self.db.commit()
        return count

    async def sync_daily_stats(self, days_back: int = 7) -> int:
        today = date.today()
        date_from = today - timedelta(days=days_back)

        campaigns = (await self.db.execute(select(Campaign))).scalars().all()
        campaign_map = {str(c.yandex_id): c.id for c in campaigns}

        rows = await self.direct.get_campaign_stats_report(date_from, today)
        now = datetime.now(timezone.utc)
        count = 0
        for row in rows:
            campaign_internal_id = campaign_map.get(row.get("CampaignId"))
            if not campaign_internal_id:
                continue
            cost_raw = row.get("Cost", "0")
            values = {
                "impressions": int(row.get("Impressions", 0)),
                "clicks": int(row.get("Clicks", 0)),
                "cost": float(cost_raw) / 1_000_000 if cost_raw != "--" else 0,
                "conversions": int(row.get("Conversions", 0)) if row.get("Conversions", "--") != "--" else 0,
                "revenue": float(row.get("Revenue", 0)) / 1_000_000 if row.get("Revenue", "--") != "--" else 0,
                "ctr": float(row.get("Ctr", 0)) if row.get("Ctr", "--") != "--" else 0,
                "avg_cpc": float(row.get("AvgCpc", 0)) / 1_000_000 if row.get("AvgCpc", "--") != "--" else 0,
                "avg_position": float(row.get("AvgImpressionPosition", 0)) if row.get("AvgImpressionPosition", "--") != "--" else None,
                "bounce_rate": float(row.get("BounceRate", 0)) if row.get("BounceRate", "--") != "--" else None,
                "synced_at": now,
            }
            filters = {"campaign_id": campaign_internal_id, "date": row["Date"]}
            await _upsert_composite(self.db, DailyStats, filters, values)
            count += 1

        await self.db.commit()
        return count

    async def sync_search_queries(self, days_back: int = 7) -> int:
        today = date.today()
        date_from = today - timedelta(days=days_back)

        campaigns = (await self.db.execute(select(Campaign))).scalars().all()
        campaign_map = {str(c.yandex_id): c.id for c in campaigns}

        rows = await self.direct.get_search_queries_report(date_from, today)
        now = datetime.now(timezone.utc)
        count = 0
        for row in rows:
            campaign_internal_id = campaign_map.get(row.get("CampaignId"))
            if not campaign_internal_id:
                continue
            cost_raw = row.get("Cost", "0")
            values = {
                "impressions": int(row.get("Impressions", 0)),
                "clicks": int(row.get("Clicks", 0)),
                "cost": float(cost_raw) / 1_000_000 if cost_raw != "--" else 0,
                "synced_at": now,
            }
            filters = {
                "campaign_id": campaign_internal_id,
                "query_text": row.get("Query", ""),
                "date": row.get("Date"),
            }
            await _upsert_composite(self.db, SearchQuery, filters, values)
            count += 1

        await self.db.commit()
        return count

    # --- Yandex Metrika ---

    async def sync_goals(self) -> int:
        if not self.metrika or not self.metrika_counter_id:
            return 0
        goals = await self.metrika.get_goals(self.metrika_counter_id)
        now = datetime.now(timezone.utc)
        count = 0
        for g in goals:
            values = {
                "metrika_id": g["id"],
                "name": g.get("name", ""),
                "type": g.get("type"),
                "is_favorite": g.get("is_favorite", False),
                "counter_id": self.metrika_counter_id,
                "synced_at": now,
            }
            await _upsert_by_field(self.db, Goal, "metrika_id", g["id"], values)
            count += 1

        await self.db.commit()
        return count

    async def sync_conversions(self, days_back: int = 7) -> int:
        if not self.metrika or not self.metrika_counter_id:
            return 0

        today = date.today()
        date_from = today - timedelta(days=days_back)

        goals = (await self.db.execute(select(Goal))).scalars().all()
        campaigns = (await self.db.execute(select(Campaign))).scalars().all()

        if not goals or not campaigns:
            return 0

        count = 0
        for goal in goals:
            data = await self.metrika.get_goal_conversions(
                counter_id=self.metrika_counter_id,
                goal_id=goal.metrika_id,
                date1=date_from.isoformat(),
                date2=today.isoformat(),
                dimensions="ym:s:date",
            )
            for row in data.get("data", []):
                row_date = row["dimensions"][0]["name"]
                metrics = row["metrics"]
                reaches = int(metrics[0]) if metrics[0] else 0
                conv_rate = float(metrics[1]) if metrics[1] else 0

                for campaign in campaigns:
                    values = {
                        "conversions_count": reaches,
                        "conversion_rate": conv_rate,
                        "cost_per_conversion": 0,
                    }
                    filters = {
                        "campaign_id": campaign.id,
                        "goal_id": goal.id,
                        "date": row_date,
                    }
                    await _upsert_composite(self.db, Conversion, filters, values)
                    count += 1

        await self.db.commit()
        return count

    # --- Yandex Webmaster ---

    async def sync_webmaster_queries(self, days_back: int = 30) -> int:
        if not self.webmaster or not self.webmaster_user_id or not self.webmaster_host_id:
            return 0

        # Find project by webmaster_host_id
        project_result = await self.db.execute(
            select(Project).where(Project.webmaster_host_id == self.webmaster_host_id)
        )
        project = project_result.scalar_one_or_none()
        project_id = project.id if project else None

        today = date.today()
        date_from = today - timedelta(days=days_back)

        data = await self.webmaster.get_popular_queries(
            user_id=self.webmaster_user_id,
            host_id=self.webmaster_host_id,
            date_from=date_from.isoformat(),
            date_to=today.isoformat(),
        )

        now = datetime.now(timezone.utc)
        count = 0
        for q in data.get("queries", []):
            query_text = q.get("query_text", "")
            indicators = q.get("indicators", {})
            values = {
                "impressions": int(indicators.get("TOTAL_SHOWS", 0)),
                "clicks": int(indicators.get("TOTAL_CLICKS", 0)),
                "ctr": float(indicators.get("AVG_CLICK_POSITION", 0)),
                "position": float(indicators.get("AVG_SHOW_POSITION", 0)),
                "project_id": project_id,
                "synced_at": now,
            }
            filters = {
                "query_text": query_text,
                "date": today,
                "device_type": "ALL",
            }
            await _upsert_composite(self.db, WebmasterQuery, filters, values)
            count += 1

        await self.db.commit()
        return count

    # --- VK Ads (myTarget) ---

    async def sync_vk_campaigns(self) -> int:
        now = datetime.now(timezone.utc)
        campaigns = await self.vk.get_campaigns()
        count = 0
        for c in campaigns:
            values = {
                "vk_id": c.get("id"),
                "platform": "vk_ads",
                "name": c.get("name", ""),
                "status": c.get("status"),
                "state": c.get("status"),  # VK uses status for both
                "daily_budget": c.get("budget_limit_day"),
                "synced_at": now,
            }
            await _upsert_by_field(self.db, Campaign, "vk_id", c["id"], values)
            count += 1

        await self.db.commit()
        return count

    async def sync_vk_banners(self) -> int:
        now = datetime.now(timezone.utc)
        banners = await self.vk.get_banners()
        count = 0
        for b in banners:
            values = {
                "vk_id": b.get("id"),
                "platform": "vk_ads",
                "type": "VK_BANNER",
                "title": b.get("textblocks", {}).get("title", {}).get("text") if isinstance(b.get("textblocks"), dict) else None,
                "text": b.get("textblocks", {}).get("text", {}).get("text") if isinstance(b.get("textblocks"), dict) else None,
                "href": b.get("urls", {}).get("primary", {}).get("url") if isinstance(b.get("urls"), dict) else None,
                "status": b.get("status"),
                "moderation_status": b.get("moderation_status"),
                "synced_at": now,
            }
            await _upsert_by_field(self.db, Ad, "vk_id", b["id"], values)
            count += 1

        await self.db.commit()
        return count

    async def sync_vk_stats(self, days_back: int = 7) -> int:
        today = date.today()
        date_from = today - timedelta(days=days_back)

        # Get VK campaigns from DB
        vk_campaigns = (await self.db.execute(
            select(Campaign).where(Campaign.platform == "vk_ads")
        )).scalars().all()

        if not vk_campaigns:
            return 0

        campaign_map = {c.vk_id: c.id for c in vk_campaigns if c.vk_id}
        vk_ids = list(campaign_map.keys())

        stats = await self.vk.get_campaign_stats(date_from, today, vk_ids)
        now = datetime.now(timezone.utc)
        count = 0

        for item in stats:
            campaign_vk_id = item.get("id")
            campaign_internal_id = campaign_map.get(campaign_vk_id)
            if not campaign_internal_id:
                continue

            for row in item.get("rows", []):
                values = {
                    "impressions": int(row.get("shows", 0)),
                    "clicks": int(row.get("clicks", 0)),
                    "cost": float(row.get("spent", 0)),
                    "conversions": int(row.get("goals", 0)),
                    "ctr": float(row.get("ctr", 0)),
                    "avg_cpc": float(row.get("cpc", 0)),
                    "synced_at": now,
                }
                filters = {
                    "campaign_id": campaign_internal_id,
                    "date": row.get("date"),
                }
                await _upsert_composite(self.db, DailyStats, filters, values)
                count += 1

        await self.db.commit()
        return count
