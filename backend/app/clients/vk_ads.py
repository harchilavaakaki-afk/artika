import asyncio
import logging
from datetime import date

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.clients.base_client import BaseYandexClient

logger = logging.getLogger(__name__)


class VKAdsCookieClient:
    """VK Ads client using browser session cookies via ads.vk.com/proxy/mt/v2/.

    The OAuth token approach only reaches the app account (0 campaigns).
    This client uses the user's browser cookies to call the proxy endpoint,
    which returns the real account campaigns (34+).

    Obtain cookies:
      1. Open ads.vk.com in Chrome while logged in.
      2. DevTools → Network → any /proxy/mt/ request → Headers → Cookie.
      3. Copy the full Cookie header value and save via POST /api/v1/vk/save-cookie.
    """

    PROXY_BASE = "https://ads.vk.com/proxy/mt/v2"

    def __init__(self, cookie: str, account_id: str = "4168629"):
        self._account_id = account_id
        self._semaphore = asyncio.Semaphore(3)
        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Cookie": cookie,
                "Accept-Language": "ru",
                "Referer": "https://ads.vk.com/",
            },
        )

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.ReadTimeout)),
        reraise=True,
    )
    async def _get(self, path: str, params: dict | None = None) -> dict:
        p = {"account": self._account_id, "limit": 250}
        if params:
            p.update(params)
        async with self._semaphore:
            resp = await self._client.get(f"{self.PROXY_BASE}{path}", params=p)
            resp.raise_for_status()
            return resp.json()

    async def get_campaigns(self, status: str | None = None) -> list[dict]:
        params: dict = {}
        if status:
            params["status"] = status
        data = await self._get("/ad_plans.json", params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def get_adgroups(self, campaign_id: int | None = None) -> list[dict]:
        params: dict = {}
        if campaign_id:
            params["campaign_id"] = campaign_id
        data = await self._get("/ad_groups.json", params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def get_banners(self, campaign_id: int | None = None) -> list[dict]:
        params: dict = {}
        if campaign_id:
            params["campaign_id"] = campaign_id
        data = await self._get("/banners.json", params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def get_campaign_stats(self, date_from: date, date_to: date, campaign_ids: list[int] | None = None) -> list[dict]:
        params: dict = {
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "metrics": "all",
        }
        if campaign_ids:
            params["id"] = ",".join(str(x) for x in campaign_ids)
        data = await self._get("/statistics/campaigns/day.json", params)
        return data.get("items", []) if isinstance(data, dict) else []

    async def get_user_info(self) -> dict:
        async with self._semaphore:
            resp = await self._client.get(f"{self.PROXY_BASE}/user.json", params={"account": self._account_id})
            resp.raise_for_status()
            return resp.json()

    async def close(self):
        await self._client.aclose()


class VKAdsClient(BaseYandexClient):
    """Client for VK Ads API v3 (ads.vk.com)."""

    BASE_URL = "https://ads.vk.com/api/v3"

    def __init__(self, access_token: str):
        super().__init__(access_token, max_concurrent=5, auth_scheme="Bearer")

    # --- Campaigns ---

    async def get_campaigns(self, status: str | None = None) -> list[dict]:
        """Fetch all campaigns."""
        params = {"limit": 250}
        if status:
            params["_status"] = status
        data = await self._get("/campaigns.json", params=params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def update_campaign(self, campaign_id: int, params: dict) -> dict:
        """Update campaign parameters."""
        url = f"{self.BASE_URL}/campaigns/{campaign_id}.json"
        response = await self._request("POST", url, json=params)
        return response.json()

    # --- Ad Groups (packages in myTarget) ---

    async def get_adgroups(self, campaign_id: int | None = None) -> list[dict]:
        """Fetch ad groups (packages)."""
        params = {"limit": 250}
        if campaign_id:
            params["_campaign_id"] = campaign_id
        data = await self._get("/adgroups.json", params=params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def update_adgroup(self, adgroup_id: int, params: dict) -> dict:
        url = f"{self.BASE_URL}/adgroups/{adgroup_id}.json"
        response = await self._request("POST", url, json=params)
        return response.json()

    # --- Banners (Ads) ---

    async def get_banners(self, campaign_id: int | None = None) -> list[dict]:
        """Fetch banners (ads)."""
        params = {"limit": 250}
        if campaign_id:
            params["_campaign_id"] = campaign_id
        data = await self._get("/banners.json", params=params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def update_banner(self, banner_id: int, params: dict) -> dict:
        url = f"{self.BASE_URL}/banners/{banner_id}.json"
        response = await self._request("POST", url, json=params)
        return response.json()

    # --- Statistics ---

    async def get_campaign_stats(
        self,
        date_from: date,
        date_to: date,
        campaign_ids: list[int] | None = None,
    ) -> list[dict]:
        """Get campaign-level statistics."""
        params = {
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "metrics": "all",
        }
        if campaign_ids:
            params["id"] = ",".join(str(x) for x in campaign_ids)

        data = await self._get("/statistics/campaigns/day.json", params=params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def get_banner_stats(
        self,
        date_from: date,
        date_to: date,
        banner_ids: list[int] | None = None,
    ) -> list[dict]:
        """Get banner-level statistics."""
        params = {
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "metrics": "all",
        }
        if banner_ids:
            params["id"] = ",".join(str(x) for x in banner_ids)

        data = await self._get("/statistics/banners/day.json", params=params)
        return data.get("items", data) if isinstance(data, dict) else data

    async def create_campaign(self, data: dict) -> dict:
        """Create a new campaign."""
        url = f"{self.BASE_URL}/campaigns.json"
        response = await self._request("POST", url, json=data)
        return response.json()

    async def delete_campaign(self, campaign_id: int) -> dict:
        """Delete (set status=deleted) a campaign."""
        url = f"{self.BASE_URL}/campaigns/{campaign_id}.json"
        response = await self._request("DELETE", url)
        return response.json()

    # --- Targeting & Remarketing ---

    async def get_remarketing_lists(self) -> list[dict]:
        """Get remarketing audiences."""
        data = await self._get("/remarketing/users_lists.json", params={"limit": 50})
        return data.get("items", []) if isinstance(data, dict) else []

    # --- Account info ---

    async def get_user_info(self) -> dict:
        """Get current user info (includes balance fields)."""
        return await self._get("/user.json")

    async def get_daily_stats(
        self,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """Get total account stats aggregated by day."""
        params = {
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "metrics": "all",
        }
        data = await self._get("/statistics/campaigns/day.json", params=params)
        return data.get("items", []) if isinstance(data, dict) else []

    async def refresh_token_by_credentials(self, client_id: str, client_secret: str) -> str | None:
        """Refresh token using client_credentials grant (myTarget fallback)."""
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://target.my.com/api/v2/oauth2/token.json",
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
            )
            data = resp.json()
            return data.get("access_token")
