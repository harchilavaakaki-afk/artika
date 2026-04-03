import logging

from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeClient:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def analyze(
        self,
        system_prompt: str,
        user_content: str,
        max_tokens: int = 4096,
    ) -> str:
        """Send analysis request to Claude and return the response text."""
        message = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        return message.content[0].text

    async def close(self):
        await self._client.close()
