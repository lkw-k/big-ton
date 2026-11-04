"""schema/*.schema.json과 같은 계약. 모르는 값은 None(키는 필수), 0 대체 금지."""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

NonEmptyStr = Annotated[str, Field(min_length=1)]
Amount = Annotated[int, Field(ge=0)]
QuoteField = Literal[
    "total_price", "lead_time_days", "install_included", "shipping_fee", "warranty_months"
]


class Contract(BaseModel):
    # strict: "1500000" 같은 문자열을 숫자로 바꾸지 않는다 (스키마와 동일).
    model_config = ConfigDict(extra="forbid", strict=True)


class Requirements(Contract):
    item: NonEmptyStr
    budget: Amount | None
    due_date: date | None
    need_install: bool | None
    quantity: Annotated[int, Field(ge=1)] | None
    notes: str | None


class Adjustment(Contract):
    label: NonEmptyStr
    amount: int
    status: Literal["confirmed", "estimated"]


class Source(Contract):
    field: Literal[
        "vendor",
        "total_price",
        "lead_time_days",
        "install_included",
        "shipping_fee",
        "warranty_months",
        "adjustments",
    ]
    type: Literal["url", "mail", "attachment"]
    ref: NonEmptyStr
    snippet: str | None


class Quote(Contract):
    vendor: NonEmptyStr
    channel: Literal["web", "mail"]
    total_price: Amount | None
    lead_time_days: Amount | None
    install_included: bool | None
    shipping_fee: Amount | None
    warranty_months: Amount | None
    missing_fields: list[QuoteField]
    adjustments: list[Adjustment]
    adjusted_total: int | None
    sources: list[Source]


class FollowUpQuestion(Contract):
    vendor: NonEmptyStr
    field: QuoteField
    question: NonEmptyStr


class StepEvent(Contract):
    type: Literal["step"]
    step: Annotated[int, Field(ge=1, le=6)]


class LogEvent(Contract):
    type: Literal["log"]
    text: NonEmptyStr
    # 스키마에서 vendor는 선택이지만 null은 허용하지 않으므로 None이면 키를 뺀다.
    vendor: NonEmptyStr | None = Field(default=None, exclude_if=lambda v: v is None)


class BrowserEvent(Contract):
    type: Literal["browser"]
    vendor: NonEmptyStr
    screenshot_url: NonEmptyStr


class QuoteUpdateEvent(Contract):
    type: Literal["quote_update"]
    vendor: NonEmptyStr
    quote: Quote


class AdjustmentEvent(Contract):
    type: Literal["adjustment"]
    vendor: NonEmptyStr
    label: NonEmptyStr
    amount: int
    status: Literal["confirmed", "estimated"]


class ApprovalRequiredEvent(Contract):
    type: Literal["approval_required"]
    kind: Literal["send_mail", "submit_form"]
    draft_id: NonEmptyStr


SseEvent = Annotated[
    StepEvent
    | LogEvent
    | BrowserEvent
    | QuoteUpdateEvent
    | AdjustmentEvent
    | ApprovalRequiredEvent,
    Field(discriminator="type"),
]
