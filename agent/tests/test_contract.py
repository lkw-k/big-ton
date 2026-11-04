import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter, ValidationError

from app.contract import FollowUpQuestion, Quote, Requirements, SseEvent

EXAMPLES_DIR = Path(__file__).resolve().parents[2] / "schema" / "examples"

SSE_EVENT = TypeAdapter(SseEvent)

# 예제 파일명 접두사 → 검증기.
ADAPTERS: list[tuple[str, TypeAdapter]] = [
    ("follow-up-question", TypeAdapter(FollowUpQuestion)),
    ("requirements", TypeAdapter(Requirements)),
    ("sse-event", SSE_EVENT),
    ("quote", TypeAdapter(Quote)),
]


def _adapter_for(example: Path) -> TypeAdapter:
    for prefix, adapter in ADAPTERS:
        if example.stem.startswith(prefix):
            return adapter
    raise AssertionError(f"대상 모델을 알 수 없는 예제: {example.name}")


def _assert_round_trip(adapter: TypeAdapter, raw: dict):
    value = adapter.validate_json(json.dumps(raw))
    # exclude_none 없이 덤프해 null 키가 유지되는지까지 비교한다.
    assert adapter.dump_python(value, mode="json") == raw


@pytest.mark.parametrize("name", ["requirements.json", "quote.json", "follow-up-question.json"])
def test_valid_example_round_trip(name):
    path = EXAMPLES_DIR / "valid" / name
    _assert_round_trip(_adapter_for(path), json.loads(path.read_text(encoding="utf-8")))


def test_valid_sse_events_round_trip_all_types():
    events = json.loads((EXAMPLES_DIR / "valid" / "sse-events.json").read_text(encoding="utf-8"))
    assert len(events) == 6
    for event in events:
        _assert_round_trip(SSE_EVENT, event)


@pytest.mark.parametrize(
    "example", sorted((EXAMPLES_DIR / "invalid").glob("*.json")), ids=lambda p: p.name
)
def test_invalid_example_rejected(example):
    with pytest.raises(ValidationError):
        _adapter_for(example).validate_json(example.read_text(encoding="utf-8"))


def test_log_without_vendor_omits_key():
    event = SSE_EVENT.validate_python({"type": "log", "text": "진행 중"})
    assert SSE_EVENT.dump_python(event, mode="json") == {"type": "log", "text": "진행 중"}


def test_numeric_string_is_not_coerced():
    with pytest.raises(ValidationError):
        Requirements.model_validate_json(
            '{"item": "도어락", "budget": "1500000", "due_date": null,'
            ' "need_install": null, "quantity": null, "notes": null}'
        )
