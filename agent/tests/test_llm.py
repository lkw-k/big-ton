from types import SimpleNamespace

from app.config import Settings
from app.llm import ClaudeClient, GroqClient, create_llm_client


def _settings(**overrides) -> Settings:
    # 로컬 .env를 읽지 않도록 _env_file=None.
    return Settings(
        _env_file=None, groq_api_key="test-key", anthropic_api_key="test-key", **overrides
    )


def test_groq_provider_creates_groq_client_with_configured_model():
    client = create_llm_client(_settings(llm_provider="groq", groq_model="groq-model-x"))

    assert isinstance(client, GroqClient)
    assert client.model == "groq-model-x"


def test_claude_provider_creates_claude_client_with_configured_model():
    client = create_llm_client(_settings(llm_provider="claude", claude_model="claude-model-x"))

    assert isinstance(client, ClaudeClient)
    assert client.model == "claude-model-x"


class _Recorder:
    def __init__(self, response):
        self.response = response
        self.kwargs = None

    async def create(self, **kwargs):
        self.kwargs = kwargs
        return self.response


async def test_groq_client_sends_prompt_as_user_message():
    completions = _Recorder(
        SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="응답"))])
    )
    sdk = SimpleNamespace(chat=SimpleNamespace(completions=completions))

    assert await GroqClient(sdk, "m").complete("질문") == "응답"
    assert completions.kwargs["model"] == "m"
    assert completions.kwargs["messages"] == [{"role": "user", "content": "질문"}]


async def test_claude_client_sends_prompt_as_user_message():
    messages = _Recorder(SimpleNamespace(content=[SimpleNamespace(type="text", text="응답")]))
    sdk = SimpleNamespace(messages=messages)

    assert await ClaudeClient(sdk, "m").complete("질문") == "응답"
    assert messages.kwargs["model"] == "m"
    assert messages.kwargs["messages"] == [{"role": "user", "content": "질문"}]
