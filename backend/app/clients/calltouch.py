import asyncio
import logging
from collections import defaultdict
from datetime import date as dt

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
        """Get calls diary. Dates: DD/MM/YYYY. Returns records + totals."""
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
        unique = sum(1 for c in all_records if c.get("uniqueCall"))
        return {
            "total_calls": total,
            "target_calls": target,
            "unique_calls": unique,
            "records": all_records,
        }

    async def get_requests(self, date_from: str, date_to: str) -> list[dict]:
        """Get form requests. Dates: MM/DD/YYYY."""
        data = await self._get(
            "/requests/",
            params={"siteId": self._site_id, "dateFrom": date_from, "dateTo": date_to},
        )
        return data if isinstance(data, list) else []

    async def get_leads_summary(self, date_from: str, date_to: str) -> dict:
        """Combined leads summary. Dates: YYYY-MM-DD."""
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
            "unique_calls": calls_data["unique_calls"],
            "requests": len(reqs),
        }

    async def get_daily_breakdown(self, date_from: str, date_to: str) -> list[dict]:
        """Daily breakdown of calls + requests. Dates: YYYY-MM-DD."""
        d1 = dt.fromisoformat(date_from)
        d2 = dt.fromisoformat(date_to)

        calls_data = await self.get_calls(
            d1.strftime("%d/%m/%Y"), d2.strftime("%d/%m/%Y"))
        reqs = await self.get_requests(
            d1.strftime("%m/%d/%Y"), d2.strftime("%m/%d/%Y"))

        by_day: dict[str, dict] = defaultdict(lambda: {
            "total_calls": 0, "target_calls": 0, "unique_calls": 0,
            "requests": 0, "total_duration": 0,
        })

        for c in calls_data["records"]:
            day = c.get("date", "")[:10]  # YYYY-MM-DD or DD/MM/YYYY
            if "/" in day:
                parts = day.split("/")
                day = f"{parts[2]}-{parts[1]}-{parts[0]}"
            d = by_day[day]
            d["total_calls"] += 1
            if c.get("targetCall"):
                d["target_calls"] += 1
            if c.get("uniqueCall"):
                d["unique_calls"] += 1
            d["total_duration"] += c.get("duration", 0)

        for r in reqs:
            day = r.get("date", "")[:10]
            if "/" in day:
                parts = day.split("/")
                day = f"{parts[2]}-{parts[1]}-{parts[0]}"
            by_day[day]["requests"] += 1

        result = []
        for day in sorted(by_day.keys()):
            d = by_day[day]
            d["date"] = day
            d["leads"] = d["target_calls"] + d["requests"]
            d["avg_duration"] = round(d["total_duration"] / d["total_calls"]) if d["total_calls"] else 0
            result.append(d)

        return result

    async def get_calls_journal(self, date_from: str, date_to: str) -> list[dict]:
        """Detailed call journal. Dates: YYYY-MM-DD."""
        d1 = dt.fromisoformat(date_from)
        d2 = dt.fromisoformat(date_to)

        calls_data = await self.get_calls(
            d1.strftime("%d/%m/%Y"), d2.strftime("%d/%m/%Y"))

        journal = []
        for c in calls_data["records"]:
            journal.append({
                "id": c.get("callId"),
                "date": c.get("date", ""),
                "caller": c.get("callerNumber", ""),
                "phone": c.get("phoneNumber", ""),
                "duration": c.get("duration", 0),
                "waiting": c.get("waitingConnect", 0),
                "target": c.get("targetCall", False),
                "unique": c.get("uniqueCall", False),
                "callback": c.get("callbackCall", False),
                "source": c.get("source", ""),
                "medium": c.get("medium", ""),
                "keyword": c.get("keyword", ""),
                "utm_source": c.get("utmSource", ""),
                "utm_medium": c.get("utmMedium", ""),
                "utm_campaign": c.get("utmCampaign", ""),
                "city": c.get("city", ""),
                "successful": c.get("successful", False),
                "url": c.get("url", ""),
            })

        return sorted(journal, key=lambda x: x["date"], reverse=True)

    async def get_source_breakdown(self, date_from: str, date_to: str) -> list[dict]:
        """Calls grouped by source. Dates: YYYY-MM-DD."""
        d1 = dt.fromisoformat(date_from)
        d2 = dt.fromisoformat(date_to)

        calls_data = await self.get_calls(
            d1.strftime("%d/%m/%Y"), d2.strftime("%d/%m/%Y"))

        by_src: dict[str, dict] = defaultdict(lambda: {
            "total": 0, "target": 0, "unique": 0, "duration": 0,
        })

        for c in calls_data["records"]:
            src = c.get("source") or c.get("utmSource") or "(прямой)"
            d = by_src[src]
            d["total"] += 1
            if c.get("targetCall"):
                d["target"] += 1
            if c.get("uniqueCall"):
                d["unique"] += 1
            d["duration"] += c.get("duration", 0)

        result = []
        for src, d in sorted(by_src.items(), key=lambda x: x[1]["total"], reverse=True):
            result.append({
                "source": src,
                "total": d["total"],
                "target": d["target"],
                "unique": d["unique"],
                "avg_duration": round(d["duration"] / d["total"]) if d["total"] else 0,
                "conversion": round(d["target"] / d["total"] * 100, 1) if d["total"] else 0,
            })

        return result

    async def close(self):
        await self._client.aclose()
