"""브라우저 에이전트용 LLM 호출 (spec §6). 에이전트 코드는 LLMClient만 사용한다."""

from typing import Any, Protocol

from anthropic import AsyncAnthropic
from groq import AsyncGroq

from app.config import Settings

CLAUDE_MAX_TOKENS = 4096


class LLMClient(Protocol):
    model: str

    async def complete(self, prompt: str) -> str: ...


class GroqClient:
    def __init__(self, sdk: Any, model: str):
        self.sdk = sdk
        self.model = model

    async def complete(self, prompt: str) -> str:
        response = await self.sdk.chat.completions.create(
            model=self.model, messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content


class ClaudeClient:
    def __init__(self, sdk: Any, model: str):
        self.sdk = sdk
        self.model = model

    async def complete(self, prompt: str) -> str:
        response = await self.sdk.messages.create(
            model=self.model,
            max_tokens=CLAUDE_MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")


def create_llm_client(settings: Settings) -> LLMClient:
    # llm_provider는 Settings에서 Literal["groq", "claude"]로 제한된다.
    if settings.llm_provider == "claude":
        return ClaudeClient(
            AsyncAnthropic(api_key=settings.anthropic_api_key), settings.claude_model
        )
    return GroqClient(AsyncGroq(api_key=settings.groq_api_key), settings.groq_model)
