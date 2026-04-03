import logging

from app.clients.base_client import BaseYandexClient

logger = logging.getLogger(__name__)


class YandexMetrikaClient(BaseYandexClient):
    BASE_URL = "https://api-metrika.yandex.net"

    def __init__(self, oauth_token: str):
        super().__init__(oauth_token, max_concurrent=5)

    # --- Counters & Goals ---

    async def get_counters(self) -> list[dict]:
        """List all available Metrika counters."""
        data = await self._get("/management/v1/counters")
        return data.get("counters", [])

    async def get_goals(self, counter_id: int) -> list[dict]:
        """Get all goals for a counter."""
        data = await self._get(f"/management/v1/counter/{counter_id}/goals")
        return data.get("goals", [])

    # --- Statistics ---

    async def get_traffic_stats(
        self,
        counter_id: int,
        date1: str,
        date2: str,
        dimensions: str = "ym:s:date",
        metrics: str = "ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds",
        group: str = "day",
        limit: int = 10000,
    ) -> dict:
        """Get traffic statistics by date."""
        params = {
            "ids": counter_id,
            "date1": date1,
            "date2": date2,
            "dimensions": dimensions,
            "metrics": metrics,
            "group": group,
            "limit": limit,
        }
        return await self._get("/stat/v1/data", params=params)

    async def get_source_stats(
        self,
        counter_id: int,
        date1: str,
        date2: str,
    ) -> dict:
        """Get traffic by source (Direct, organic, referral, etc.)."""
        params = {
            "ids": counter_id,
            "date1": date1,
            "date2": date2,
            "dimensions": "ym:s:lastTrafficSource",
            "metrics": "ym:s:visits,ym:s:users,ym:s:bounceRate",
            "limit": 100,
        }
        return await self._get("/stat/v1/data", params=params)

    async def get_goal_conversions(
        self,
        counter_id: int,
        goal_id: int,
        date1: str,
        date2: str,
        dimensions: str = "ym:s:date",
        group: str = "day",
    ) -> dict:
        """Get conversion stats for a specific goal."""
        metrics = (
            f"ym:s:goal{goal_id}reaches,"
            f"ym:s:goal{goal_id}conversionRate,"
            f"ym:s:goal{goal_id}revenue"
        )
        params = {
            "ids": counter_id,
            "date1": date1,
            "date2": date2,
            "dimensions": dimensions,
            "metrics": metrics,
            "group": group,
            "limit": 10000,
        }
        return await self._get("/stat/v1/data", params=params)

    async def get_direct_summary(
        self,
        counter_id: int,
        date1: str,
        date2: str,
    ) -> dict:
        """Get Yandex Direct specific traffic in Metrika (campaigns, keywords)."""
        params = {
            "ids": counter_id,
            "date1": date1,
            "date2": date2,
            "dimensions": "ym:s:lastDirectClickOrder",
            "metrics": "ym:s:visits,ym:s:bounceRate,ym:s:goalReaches,ym:s:avgVisitDurationSeconds",
            "limit": 10000,
        }
        return await self._get("/stat/v1/data", params=params)

    async def get_bytime_stats(
        self,
        counter_id: int,
        date1: str,
        date2: str,
        metrics: str = "ym:s:visits",
        group: str = "hour",
    ) -> dict:
        """Get time-series stats (by hour/day/week/month)."""
        params = {
            "ids": counter_id,
            "date1": date1,
            "date2": date2,
            "metrics": metrics,
            "group": group,
        }
        return await self._get("/stat/v1/data/bytime", params=params)
