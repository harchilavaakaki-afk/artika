import asyncio
import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


class BaseYandexClient:
    BASE_URL: str = ""

    def __init__(self, oauth_token: str, max_concurrent: int = 5, auth_scheme: str = "OAuth"):
        self._token = oauth_token
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"{auth_scheme} {oauth_token}",
                "Accept-Language": "ru",
            },
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout)),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        url: str,
        **kwargs,
    ) -> httpx.Response:
        async with self._semaphore:
            response = await self._client.request(method, url, **kwargs)
            response.raise_for_status()
            return response

    async def _get(self, path: str, params: dict | None = None) -> dict:
        url = f"{self.BASE_URL}{path}"
        response = await self._request("GET", url, params=params)
        return response.json()

    async def _post(self, path: str, json_data: dict | None = None) -> httpx.Response:
        url = f"{self.BASE_URL}{path}"
        return await self._request("POST", url, json=json_data)

    async def close(self):
        await self._client.aclose()
