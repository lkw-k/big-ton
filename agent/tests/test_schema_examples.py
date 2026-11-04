import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

SCHEMA_DIR = Path(__file__).resolve().parents[2] / "schema"
EXAMPLES_DIR = SCHEMA_DIR / "examples"
SCHEMA_NAMES = [
    "requirements",
    "quote",
    "follow-up-question",
    "sse-event",
    "interview",
    "agent-event",
]


def _load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _schemas() -> dict[str, dict]:
    return {name: _load(SCHEMA_DIR / f"{name}.schema.json") for name in SCHEMA_NAMES}


def _validator(name: str) -> Draft202012Validator:
    schemas = _schemas()
    # $ref를 로컬 파일로만 해석해 네트워크 접근 없이 검증한다.
    registry = Registry().with_resources(
        (s["$id"], Resource.from_contents(s)) for s in schemas.values()
    )
    return Draft202012Validator(schemas[name], registry=registry, format_checker=FormatChecker())


def _schema_for(example: Path) -> str:
    # 파일명 접두사(예: quote-xxx.json → quote)로 대상 스키마를 정한다. 긴 이름 우선.
    stem = example.stem
    for name in sorted(SCHEMA_NAMES, key=len, reverse=True):
        if stem == name or stem.startswith(f"{name}-") or stem == f"{name}s":
            return name
    raise AssertionError(f"대상 스키마를 알 수 없는 예제: {example.name}")


def _instances(example: Path) -> list:
    data = _load(example)
    # sse-events.json처럼 배열 파일은 원소 하나하나를 인스턴스로 본다.
    return data if isinstance(data, list) else [data]


VALID = sorted((EXAMPLES_DIR / "valid").glob("*.json"))
INVALID = sorted((EXAMPLES_DIR / "invalid").glob("*.json"))


@pytest.mark.parametrize("name", SCHEMA_NAMES)
def test_schema_itself_is_valid(name):
    Draft202012Validator.check_schema(_schemas()[name])


def test_examples_exist():
    assert {_schema_for(p) for p in VALID} == set(SCHEMA_NAMES)
    assert INVALID


@pytest.mark.parametrize("example", VALID, ids=lambda p: p.name)
def test_valid_example_passes(example):
    validator = _validator(_schema_for(example))
    for instance in _instances(example):
        validator.validate(instance)


@pytest.mark.parametrize("example", INVALID, ids=lambda p: p.name)
def test_invalid_example_fails(example):
    validator = _validator(_schema_for(example))
    assert not validator.is_valid(_load(example))


def test_sse_examples_cover_all_event_types():
    events = _load(EXAMPLES_DIR / "valid" / "sse-events.json")
    assert {e["type"] for e in events} == {
        "step",
        "log",
        "browser",
        "quote_update",
        "adjustment",
        "approval_required",
    }
