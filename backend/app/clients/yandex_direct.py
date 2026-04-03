import asyncio
import csv
import io
import logging
from datetime import date

import httpx

from app.clients.base_client import BaseYandexClient

logger = logging.getLogger(__name__)


class YandexDirectClient(BaseYandexClient):
    BASE_URL = "https://api.direct.yandex.com/json/v5"
    REPORTS_URL = "https://api.direct.yandex.com/json/v5/reports"

    def __init__(self, oauth_token: str, client_login: str | None = None):
        super().__init__(oauth_token, max_concurrent=10, auth_scheme="Bearer")
        self._client_login = client_login
        if client_login:
            self._client.headers["Client-Login"] = client_login

    async def _api_call(self, service: str, method: str, params: dict | None = None) -> dict:
        """Call Yandex Direct API v5 service."""
        url = f"{self.BASE_URL}/{service}"
        body = {"method": method}
        if params:
            body["params"] = params
        response = await self._post(f"/{service}", json_data=body)
        data = response.json()
        if "error" in data:
            raise RuntimeError(f"Yandex Direct API error: {data['error']}")
        return data.get("result", {})

    # --- Campaigns ---

    async def get_campaigns(
        self,
        states: list[str] | None = None,
        statuses: list[str] | None = None,
    ) -> list[dict]:
        """Fetch all campaigns."""
        selection_criteria = {}
        if states:
            selection_criteria["States"] = states
        if statuses:
            selection_criteria["Statuses"] = statuses

        params = {
            "SelectionCriteria": selection_criteria,
            "FieldNames": [
                "Id", "Name", "Type", "Status", "State",
                "DailyBudget", "StartDate", "EndDate", "Statistics",
            ],
            "TextCampaignFieldNames": ["BiddingStrategy"],
        }
        result = await self._api_call("campaigns", "get", params)
        return result.get("Campaigns", [])

    # --- Ad Groups ---

    async def get_ad_groups(self, campaign_ids: list[int]) -> list[dict]:
        """Fetch ad groups for given campaigns."""
        params = {
            "SelectionCriteria": {"CampaignIds": campaign_ids},
            "FieldNames": ["Id", "Name", "CampaignId", "Status", "RegionIds"],
        }
        result = await self._api_call("adgroups", "get", params)
        return result.get("AdGroups", [])

    # --- Ads ---

    async def get_ads(self, ad_group_ids: list[int]) -> list[dict]:
        """Fetch ads for given ad groups."""
        params = {
            "SelectionCriteria": {"AdGroupIds": ad_group_ids},
            "FieldNames": ["Id", "AdGroupId", "Type", "Status"],
            "TextAdFieldNames": [
                "Title", "Title2", "Text", "Href",
                "DisplayUrlPath", "SitelinkSetId",
            ],
        }
        result = await self._api_call("ads", "get", params)
        return result.get("Ads", [])

    # --- Keywords ---

    async def get_keywords(self, ad_group_ids: list[int]) -> list[dict]:
        """Fetch keywords for given ad groups."""
        params = {
            "SelectionCriteria": {"AdGroupIds": ad_group_ids},
            "FieldNames": ["Id", "AdGroupId", "Keyword", "Bid", "Status", "ServingStatus"],
        }
        result = await self._api_call("keywords", "get", params)
        return result.get("Keywords", [])

    # --- Reports ---

    async def get_campaign_stats_report(
        self,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """Get campaign performance report (TSV format via Reports API)."""
        report_def = {
            "params": {
                "SelectionCriteria": {
                    "DateFrom": date_from.isoformat(),
                    "DateTo": date_to.isoformat(),
                },
                "FieldNames": [
                    "CampaignId", "Date", "Impressions", "Clicks",
                    "Cost", "Conversions", "Revenue", "Ctr",
                    "AvgCpc", "AvgImpressionPosition", "BounceRate",
                ],
                "ReportName": f"campaign_stats_{date_from}_{date_to}",
                "ReportType": "CAMPAIGN_PERFORMANCE_REPORT",
                "DateRangeType": "CUSTOM_DATE",
                "Format": "TSV",
                "IncludeVAT": "YES",
                "IncludeDiscount": "NO",
            }
        }
        return await self._poll_report(report_def)

    async def get_search_queries_report(
        self,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """Get search queries report."""
        report_def = {
            "params": {
                "SelectionCriteria": {
                    "DateFrom": date_from.isoformat(),
                    "DateTo": date_to.isoformat(),
                },
                "FieldNames": [
                    "CampaignId", "Query", "Impressions", "Clicks",
                    "Cost", "CriterionId", "Date",
                ],
                "ReportName": f"search_queries_{date_from}_{date_to}",
                "ReportType": "SEARCH_QUERY_PERFORMANCE_REPORT",
                "DateRangeType": "CUSTOM_DATE",
                "Format": "TSV",
                "IncludeVAT": "YES",
                "IncludeDiscount": "NO",
            }
        }
        return await self._poll_report(report_def)

    async def _poll_report(self, report_definition: dict) -> list[dict]:
        """
        Submit report request and poll until ready.
        Yandex Direct Reports API uses HTTP status codes:
        - 200: report ready
        - 201: report created, processing
        - 202: report not ready yet
        """
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept-Language": "ru",
            "processingMode": "auto",
            "returnMoneyInMicros": "false",
            "skipReportHeader": "true",
            "skipReportSummary": "true",
        }
        if self._client_login:
            headers["Client-Login"] = self._client_login

        async with self._semaphore:
            wait_time = 2
            for _ in range(15):  # max ~60s total
                response = await self._client.post(
                    self.REPORTS_URL,
                    json=report_definition,
                    headers=headers,
                    timeout=60.0,
                )
                if response.status_code == 200:
                    return self._parse_tsv(response.text)
                elif response.status_code in (201, 202):
                    retry_in = int(response.headers.get("retryIn", wait_time))
                    logger.info("Report not ready, retrying in %ds", retry_in)
                    await asyncio.sleep(retry_in)
                    wait_time = min(wait_time * 2, 15)
                else:
                    response.raise_for_status()

        raise TimeoutError("Report generation timed out after polling")

    @staticmethod
    def _parse_tsv(tsv_text: str) -> list[dict]:
        """Parse TSV report into list of dicts."""
        reader = csv.DictReader(io.StringIO(tsv_text), delimiter="\t")
        return list(reader)

    # --- Campaign Management (write-back) ---

    async def update_campaign(self, campaign_id: int, params: dict) -> dict:
        """Update campaign parameters."""
        update_params = {
            "Campaigns": [{
                "Id": campaign_id,
                **params,
            }]
        }
        return await self._api_call("campaigns", "update", update_params)

    async def suspend_campaign(self, campaign_id: int) -> dict:
        """Suspend (pause) a campaign."""
        return await self._api_call(
            "campaigns", "suspend",
            {"SelectionCriteria": {"Ids": [campaign_id]}}
        )

    async def resume_campaign(self, campaign_id: int) -> dict:
        """Resume a suspended campaign."""
        return await self._api_call(
            "campaigns", "resume",
            {"SelectionCriteria": {"Ids": [campaign_id]}}
        )

    async def update_keyword_bids(self, keyword_bids: list[dict]) -> dict:
        """
        Update keyword bids.
        keyword_bids: [{"KeywordId": 123, "Bid": 5000000}]  # bid in microcurrency
        """
        return await self._api_call(
            "keywordbids", "set",
            {"KeywordBids": keyword_bids}
        )
