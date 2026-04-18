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

# Whitelist кампаний Паделя Арктика (artikavidnoe) — строго только эти.
# Источник: memory reference_yandex_direct_padel_scope.md.
PADEL_CAMPAIGN_WHITELIST: list[int] = [704317567, 704350848]


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
                report["auto_assigned"] = await self.auto_assign_campaigns()
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

        if self.webmaster and self.webmaster_user_id:
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

    # --- Auto-assign campaigns to projects ---

    async def auto_assign_campaigns(self) -> int:
        """Match campaigns to projects by keyword rules.
        Uses ordered rules — first match wins. Most specific first.
        Only assigns campaigns that currently have project_id=None.
        """
        projects = (await self.db.execute(select(Project))).scalars().all()
        if not projects:
            return 0

        # Build name→id lookup
        name_to_id = {p.name.lower(): p.id for p in projects}

        # Ordered rules: (keyword_in_campaign_name, project_name)
        # Most specific first — first match wins
        RULES = [
            ("туворк", "туворк самокат"),
            ("самокат", "пкр самокат"),
            ("пкр", "пкр партнер"),
            ("сбермаркет", "y-2work.ru"),
            ("падел", "падел центр"),
            ("лента", "лента работа"),
            ("мир кадров", "мир кадров"),
            ("worldofstaff", "мир кадров"),
        ]

        # Resolve project names to IDs
        resolved_rules: list[tuple[str, int]] = []
        for keyword, proj_name in RULES:
            pid = name_to_id.get(proj_name)
            if pid:
                resolved_rules.append((keyword, pid))

        result = await self.db.execute(
            select(Campaign).where(Campaign.project_id == None)  # noqa: E711
        )
        unassigned = result.scalars().all()

        assigned = 0
        for campaign in unassigned:
            name_lower = campaign.name.lower()
            for keyword, project_id in resolved_rules:
                if keyword in name_lower:
                    campaign.project_id = project_id
                    assigned += 1
                    break

        await self.db.commit()
        logger.info("Auto-assigned %d campaigns to projects", assigned)
        return assigned

    # --- Yandex Direct ---

    async def sync_campaigns(self) -> int:
        now = datetime.now(timezone.utc)
        campaigns = await self.direct.get_campaigns()
        count = 0
        for c in campaigns:
            daily_budget = None
            if c.get("DailyBudget"):
                daily_budget = int(c["DailyBudget"].get("Amount", 0)) / 1_000_000

            strategy_type = None
            strategy_params = None
            if "TextCampaign" in c and "BiddingStrategy" in c["TextCampaign"]:
                strategy = c["TextCampaign"]["BiddingStrategy"]
                strategy_type = strategy.get("Search", {}).get("BiddingStrategyType")
                strategy_params = strategy

            start_date = date.fromisoformat(c["StartDate"]) if c.get("StartDate") else None
            end_date = date.fromisoformat(c["EndDate"]) if c.get("EndDate") else None

            values = {
                "yandex_id": c["Id"],
                "name": c.get("Name", ""),
                "type": c.get("Type"),
                "status": c.get("Status"),
                "state": c.get("State"),
                "daily_budget": daily_budget,
                "start_date": start_date,
                "end_date": end_date,
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
        # Batch by 10 to avoid error 4001 (too many IDs)
        ad_groups = []
        for i in range(0, len(yandex_ids), 10):
            batch = await self.direct.get_ad_groups(yandex_ids[i:i+10])
            ad_groups.extend(batch)
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
            filters = {"campaign_id": campaign_internal_id, "date": date.fromisoformat(row["Date"])}
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
                "date": date.fromisoformat(row["Date"]) if row.get("Date") else date.today(),
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
                        "date": date.fromisoformat(row_date),
                    }
                    await _upsert_composite(self.db, Conversion, filters, values)
                    count += 1

        await self.db.commit()
        return count

    # --- Per-project Direct sync (multi-account safe) ---

    async def sync_direct_for_project(
        self,
        project: Project,
        days_back: int = 30,
    ) -> dict:
        """Full Direct sync scoped to a single project/account.

        Uses self.direct that must be already constructed with the correct
        OAuth token for this project (see api/sync.py).
        Respects PADEL_CAMPAIGN_WHITELIST for projects with yandex_token_ref='padel'.
        """
        if not self.direct:
            return {"skipped": "no direct client"}

        now = datetime.now(timezone.utc)
        stats: dict = {}

        # Whitelist: only for padel account
        whitelist = PADEL_CAMPAIGN_WHITELIST if project.yandex_token_ref == "padel" else None

        # 1. Campaigns → assign to this project
        campaigns_raw = await self.direct.get_campaigns(ids=whitelist)
        camp_count = 0
        for c in campaigns_raw:
            daily_budget = None
            if c.get("DailyBudget"):
                daily_budget = int(c["DailyBudget"].get("Amount", 0)) / 1_000_000
            strategy_type = None
            strategy_params = None
            if "TextCampaign" in c and "BiddingStrategy" in c["TextCampaign"]:
                strategy = c["TextCampaign"]["BiddingStrategy"]
                strategy_type = strategy.get("Search", {}).get("BiddingStrategyType")
                strategy_params = strategy
            values = {
                "yandex_id": c["Id"],
                "platform": "yandex_direct",
                "project_id": project.id,
                "name": c.get("Name", ""),
                "type": c.get("Type"),
                "status": c.get("Status"),
                "state": c.get("State"),
                "daily_budget": daily_budget,
                "start_date": date.fromisoformat(c["StartDate"]) if c.get("StartDate") else None,
                "end_date": date.fromisoformat(c["EndDate"]) if c.get("EndDate") else None,
                "strategy_type": strategy_type,
                "strategy_params": strategy_params,
                "synced_at": now,
            }
            await _upsert_by_field(self.db, Campaign, "yandex_id", c["Id"], values)
            camp_count += 1
        await self.db.commit()
        stats["campaigns"] = camp_count

        # Collect internal IDs of project campaigns
        proj_campaigns = (await self.db.execute(
            select(Campaign).where(Campaign.project_id == project.id)
        )).scalars().all()
        campaign_map_yid_to_id = {c.yandex_id: c.id for c in proj_campaigns if c.yandex_id}
        campaign_yandex_ids = list(campaign_map_yid_to_id.keys())
        if not campaign_yandex_ids:
            logger.info("Direct[%s]: no campaigns after sync, stop", project.name)
            return stats

        # 2. Ad groups (batched by 10)
        ag_count = 0
        ag_map: dict[int, int] = {}
        for i in range(0, len(campaign_yandex_ids), 10):
            batch = await self.direct.get_ad_groups(campaign_yandex_ids[i:i + 10])
            for ag in batch:
                cid = campaign_map_yid_to_id.get(ag["CampaignId"])
                if not cid:
                    continue
                await _upsert_by_field(self.db, AdGroup, "yandex_id", ag["Id"], {
                    "yandex_id": ag["Id"],
                    "campaign_id": cid,
                    "name": ag.get("Name", ""),
                    "status": ag.get("Status"),
                    "region_ids": ag.get("RegionIds"),
                    "synced_at": now,
                })
                ag_count += 1
        await self.db.commit()
        stats["ad_groups"] = ag_count

        proj_ad_groups = (await self.db.execute(
            select(AdGroup).where(AdGroup.campaign_id.in_([c.id for c in proj_campaigns]))
        )).scalars().all()
        ag_map = {ag.yandex_id: ag.id for ag in proj_ad_groups}
        ag_yandex_ids = list(ag_map.keys())

        # 3. Ads
        ad_count = 0
        for i in range(0, len(ag_yandex_ids), 1000):
            ads_batch = await self.direct.get_ads(ag_yandex_ids[i:i + 1000])
            for ad in ads_batch:
                ag_id = ag_map.get(ad["AdGroupId"])
                if not ag_id:
                    continue
                text_ad = ad.get("TextAd", {})
                await _upsert_by_field(self.db, Ad, "yandex_id", ad["Id"], {
                    "yandex_id": ad["Id"],
                    "platform": "yandex_direct",
                    "ad_group_id": ag_id,
                    "type": ad.get("Type"),
                    "title": text_ad.get("Title"),
                    "title2": text_ad.get("Title2"),
                    "text": text_ad.get("Text"),
                    "href": text_ad.get("Href"),
                    "display_url_path": text_ad.get("DisplayUrlPath"),
                    "status": ad.get("Status"),
                    "synced_at": now,
                })
                ad_count += 1
        await self.db.commit()
        stats["ads"] = ad_count

        # 4. Keywords
        kw_count = 0
        for i in range(0, len(ag_yandex_ids), 1000):
            kws = await self.direct.get_keywords(ag_yandex_ids[i:i + 1000])
            for kw in kws:
                ag_id = ag_map.get(kw["AdGroupId"])
                if not ag_id:
                    continue
                bid = int(kw["Bid"]) / 1_000_000 if kw.get("Bid") else None
                await _upsert_by_field(self.db, Keyword, "yandex_id", kw["Id"], {
                    "yandex_id": kw["Id"],
                    "ad_group_id": ag_id,
                    "keyword": kw.get("Keyword", ""),
                    "bid": bid,
                    "status": kw.get("Status"),
                    "serving_status": kw.get("ServingStatus"),
                    "synced_at": now,
                })
                kw_count += 1
        await self.db.commit()
        stats["keywords"] = kw_count

        # 5. Daily stats (campaign report)
        today = date.today()
        date_from = today - timedelta(days=days_back)
        rows = await self.direct.get_campaign_stats_report(
            date_from, today, campaign_ids=campaign_yandex_ids,
        )
        campaign_map_str = {str(k): v for k, v in campaign_map_yid_to_id.items()}
        ds_count = 0
        for row in rows:
            cid = campaign_map_str.get(row.get("CampaignId"))
            if not cid:
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
            filters = {"campaign_id": cid, "date": date.fromisoformat(row["Date"])}
            await _upsert_composite(self.db, DailyStats, filters, values)
            ds_count += 1
        await self.db.commit()
        stats["daily_stats"] = ds_count

        # 6. Search queries
        sq_rows = await self.direct.get_search_queries_report(
            date_from, today, campaign_ids=campaign_yandex_ids,
        )
        sq_count = 0
        for row in sq_rows:
            cid = campaign_map_str.get(row.get("CampaignId"))
            if not cid:
                continue
            cost_raw = row.get("Cost", "0")
            values = {
                "impressions": int(row.get("Impressions", 0)),
                "clicks": int(row.get("Clicks", 0)),
                "cost": float(cost_raw) / 1_000_000 if cost_raw != "--" else 0,
                "synced_at": now,
            }
            filters = {
                "campaign_id": cid,
                "query_text": row.get("Query", ""),
                "date": date.fromisoformat(row["Date"]) if row.get("Date") else date.today(),
            }
            await _upsert_composite(self.db, SearchQuery, filters, values)
            sq_count += 1
        await self.db.commit()
        stats["search_queries"] = sq_count

        logger.info("Direct[%s/%s] synced: %s", project.name, project.yandex_token_ref, stats)
        return stats

    async def sync_metrika_for_project(self, project: Project, days_back: int = 30) -> dict:
        """Metrika sync scoped to project (goals + conversions). Uses self.metrika."""
        if not self.metrika or not project.metrika_counter_id:
            return {"skipped": "no metrika"}
        counter_id = project.metrika_counter_id
        now = datetime.now(timezone.utc)

        goals = await self.metrika.get_goals(counter_id)
        goals_count = 0
        for g in goals:
            await _upsert_by_field(self.db, Goal, "metrika_id", g["id"], {
                "metrika_id": g["id"],
                "name": g.get("name", ""),
                "type": g.get("type"),
                "is_favorite": g.get("is_favorite", False),
                "counter_id": counter_id,
                "synced_at": now,
            })
            goals_count += 1
        await self.db.commit()

        today = date.today()
        date_from = today - timedelta(days=days_back)
        proj_goals = (await self.db.execute(
            select(Goal).where(Goal.counter_id == counter_id)
        )).scalars().all()
        proj_campaigns = (await self.db.execute(
            select(Campaign).where(Campaign.project_id == project.id)
        )).scalars().all()

        conv_count = 0
        for goal in proj_goals:
            data = await self.metrika.get_goal_conversions(
                counter_id=counter_id,
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
                for campaign in proj_campaigns:
                    await _upsert_composite(self.db, Conversion, {
                        "campaign_id": campaign.id,
                        "goal_id": goal.id,
                        "date": date.fromisoformat(row_date),
                    }, {
                        "conversions_count": reaches,
                        "conversion_rate": conv_rate,
                        "cost_per_conversion": 0,
                    })
                    conv_count += 1
        await self.db.commit()
        return {"goals": goals_count, "conversions": conv_count}

    # --- Yandex Webmaster ---

    async def sync_webmaster_queries(self, days_back: int = 30) -> int:
        """Sync webmaster queries for ALL projects that have webmaster_host_id."""
        if not self.webmaster or not self.webmaster_user_id:
            return 0

        # Get all projects with webmaster_host_id
        result = await self.db.execute(
            select(Project).where(Project.webmaster_host_id != None)  # noqa: E711
        )
        projects = result.scalars().all()
        if not projects:
            return 0

        today = date.today()
        date_from = today - timedelta(days=days_back)
        now = datetime.now(timezone.utc)
        total_count = 0

        for project in projects:
            host_id = project.webmaster_host_id
            try:
                data = await self.webmaster.get_popular_queries(
                    user_id=self.webmaster_user_id,
                    host_id=host_id,
                    date_from=date_from.isoformat(),
                    date_to=today.isoformat(),
                )
            except Exception as e:
                logger.warning("Webmaster queries failed for %s (%s): %s", project.name, host_id, e)
                continue

            for q in data.get("queries", []):
                query_text = q.get("query_text", "")
                indicators = q.get("indicators", {})
                values = {
                    "impressions": int(indicators.get("TOTAL_SHOWS", 0)),
                    "clicks": int(indicators.get("TOTAL_CLICKS", 0)),
                    "ctr": float(indicators.get("AVG_CLICK_POSITION", 0)),
                    "position": float(indicators.get("AVG_SHOW_POSITION", 0)),
                    "project_id": project.id,
                    "synced_at": now,
                }
                filters = {
                    "query_text": query_text,
                    "date": today,
                    "device_type": "ALL",
                    "project_id": project.id,
                }
                await _upsert_composite(self.db, WebmasterQuery, filters, values)
                total_count += 1

            logger.info("Webmaster: %s — %d queries", project.name, len(data.get("queries", [])))

        await self.db.commit()
        return total_count

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
