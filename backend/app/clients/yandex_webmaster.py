import logging

from app.clients.base_client import BaseYandexClient

logger = logging.getLogger(__name__)


class YandexWebmasterClient(BaseYandexClient):
    BASE_URL = "https://api.webmaster.yandex.net/v4"

    def __init__(self, oauth_token: str):
        super().__init__(oauth_token, max_concurrent=5)

    # --- User & Hosts ---

    async def get_user_id(self) -> int:
        """Get the authenticated user's ID."""
        data = await self._get("/user")
        return data["user_id"]

    async def get_hosts(self, user_id: int) -> list[dict]:
        """List all verified hosts."""
        data = await self._get(f"/user/{user_id}/hosts")
        return data.get("hosts", [])

    # --- Search Queries ---

    async def get_popular_queries(
        self,
        user_id: int,
        host_id: str,
        date_from: str,
        date_to: str,
        query_indicator: str = "TOTAL_SHOWS",
        order_by: str = "TOTAL_SHOWS",
        limit: int = 500,
        offset: int = 0,
    ) -> dict:
        """
        Get popular search queries.
        query_indicator: TOTAL_SHOWS, TOTAL_CLICKS, AVG_SHOW_POSITION, AVG_CLICK_POSITION
        """
        params = {
            "order_by": order_by,
            "query_indicator": query_indicator,
            "date_from": date_from,
            "date_to": date_to,
            "limit": limit,
            "offset": offset,
        }
        url = f"{self.BASE_URL}/user/{user_id}/hosts/{host_id}/search-queries/popular"
        response = await self._request("GET", url, params=params)
        return response.json()

    async def get_query_history(
        self,
        user_id: int,
        host_id: str,
        query_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        """Get history for a specific search query."""
        body = {
            "date_from": date_from,
            "date_to": date_to,
        }
        url = f"{self.BASE_URL}/user/{user_id}/hosts/{host_id}/search-queries/{query_id}/history"
        response = await self._request("POST", url, json=body)
        return response.json()

    async def get_all_queries_history(
        self,
        user_id: int,
        host_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        """Get aggregated query history for the host."""
        body = {
            "date_from": date_from,
            "date_to": date_to,
        }
        url = f"{self.BASE_URL}/user/{user_id}/hosts/{host_id}/search-queries/all/history"
        response = await self._request("POST", url, json=body)
        return response.json()

    # --- Host info ---

    async def get_host_info(self, user_id: int, host_id: str) -> dict:
        """Get full host info including ИКС (site quality score)."""
        return await self._get(f"/user/{user_id}/hosts/{host_id}")

    # --- Indexing ---

    async def get_indexing_stats(self, user_id: int, host_id: str) -> dict:
        """Get indexing statistics for the host."""
        return await self._get(f"/user/{user_id}/hosts/{host_id}/summary")

    async def get_indexing_history(
        self,
        user_id: int,
        host_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        """Get indexing history."""
        params = {"date_from": date_from, "date_to": date_to}
        return await self._get(
            f"/user/{user_id}/hosts/{host_id}/indexing/history",
            params=params,
        )

    # --- Diagnostics (errors) ---

    async def get_diagnostics(self, user_id: int, host_id: str) -> dict:
        """Get site diagnostics / errors."""
        return await self._get(f"/user/{user_id}/hosts/{host_id}/diagnostics")

    # --- Recrawl ---

    async def get_recrawl_quota(self, user_id: int, host_id: str) -> dict:
        """Get remaining recrawl quota."""
        return await self._get(
            f"/user/{user_id}/hosts/{host_id}/recrawl/quota"
        )

    async def add_recrawl_url(self, user_id: int, host_id: str, url: str) -> dict:
        """Submit a URL for recrawling by Yandex."""
        response = await self._post(
            f"/user/{user_id}/hosts/{host_id}/recrawl/queue",
            json_data={"url": url},
        )
        return response.json()

    async def get_recrawl_queue(self, user_id: int, host_id: str) -> dict:
        """Get current recrawl queue."""
        return await self._get(f"/user/{user_id}/hosts/{host_id}/recrawl/queue")

    # --- Sitemaps ---

    async def get_sitemaps(self, user_id: int, host_id: str) -> dict:
        """Get list of submitted sitemaps."""
        return await self._get(f"/user/{user_id}/hosts/{host_id}/sitemaps")

    async def add_sitemap(self, user_id: int, host_id: str, sitemap_url: str) -> dict:
        """Submit a sitemap URL."""
        response = await self._post(
            f"/user/{user_id}/hosts/{host_id}/sitemaps",
            json_data={"url": sitemap_url},
        )
        return response.json()
