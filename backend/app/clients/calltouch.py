import asyncio
import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


class CalltouchClient:
    BASE_URL = "https://api.calltouch.ru/calls-service/RestAPI"

    def __init__(self, site_id: str, api_key: str, max_concurrent: int = 3):
        self._site_id = site_id
        self._api_key = api_key
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._client = httpx.AsyncClient(timeout=30.0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout)),
        reraise=True,
    )
    async def _get(self, path: str, params: dict | None = None) -> dict | list:
        url = f"{self.BASE_URL}{path}"
        p = {"clientApiId": self._api_key, **(params or {})}
        async with self._semaphore:
            r = await self._client.request("GET", url, params=p)
            r.raise_for_status()
            return r.json()

    async def get_calls(self, date_from: str, date_to: str) -> dict:
        """Get calls diary. Dates: DD/MM/YYYY."""
        all_records: list[dict] = []
        page = 1
        while True:
            data = await self._get(
                f"/{self._site_id}/calls-diary/calls",
                params={"dateFrom": date_from, "dateTo": date_to,
                        "page": page, "limit": 1000},
            )
            all_records.extend(data.get("records", []))
            if page >= data.get("pageTotal", 1):
                break
            page += 1

        total = len(all_records)
        target = sum(1 for c in all_records if c.get("targetCall"))
        return {"total_calls": total, "target_calls": target, "records": all_records}

    async def get_requests(self, date_from: str, date_to: str) -> list[dict]:
        """Get form requests. Dates: MM/DD/YYYY."""
        data = await self._get(
            "/requests/",
            params={"siteId": self._site_id, "dateFrom": date_from, "dateTo": date_to},
        )
        return data if isinstance(data, list) else []

    async def get_leads_summary(self, date_from: str, date_to: str) -> dict:
        """Get combined leads summary (target calls + requests).
        Dates: YYYY-MM-DD (converts internally).
        """
        from datetime import date as dt
        d1 = dt.fromisoformat(date_from)
        d2 = dt.fromisoformat(date_to)

        calls_data = await self.get_calls(
            d1.strftime("%d/%m/%Y"), d2.strftime("%d/%m/%Y"))
        reqs = await self.get_requests(
            d1.strftime("%m/%d/%Y"), d2.strftime("%m/%d/%Y"))

        return {
            "leads": calls_data["target_calls"] + len(reqs),
            "target_calls": calls_data["target_calls"],
            "total_calls": calls_data["total_calls"],
            "requests": len(reqs),
        }

    async def close(self):
        await self._client.aclose()
