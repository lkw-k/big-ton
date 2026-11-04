package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

/** schema/sse-event.schema.json. Python 콜백 이벤트도 같은 형식. */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
		@JsonSubTypes.Type(value = SseEvent.Step.class, name = "step"),
		@JsonSubTypes.Type(value = SseEvent.Log.class, name = "log"),
		@JsonSubTypes.Type(value = SseEvent.Browser.class, name = "browser"),
		@JsonSubTypes.Type(value = SseEvent.QuoteUpdate.class, name = "quote_update"),
		@JsonSubTypes.Type(value = SseEvent.AdjustmentEvent.class, name = "adjustment"),
		@JsonSubTypes.Type(value = SseEvent.ApprovalRequired.class, name = "approval_required") })
public sealed interface SseEvent {

	record Step(@NotNull @Min(1) @Max(6) Integer step) implements SseEvent {
	}

	record Log(@NotBlank String text, @JsonInclude(JsonInclude.Include.NON_NULL) String vendor)
			implements SseEvent {
	}

	@JsonNaming(SnakeCaseStrategy.class)
	record Browser(@NotBlank String vendor, @NotBlank String screenshotUrl) implements SseEvent {
	}

	record QuoteUpdate(@NotBlank String vendor, @NotNull @Valid Quote quote) implements SseEvent {
	}

	record AdjustmentEvent(
			@NotBlank String vendor,
			@NotBlank String label,
			@NotNull Long amount,
			@NotNull AdjustmentStatus status) implements SseEvent {
	}

	@JsonNaming(SnakeCaseStrategy.class)
	record ApprovalRequired(@NotNull ApprovalKind kind, @NotBlank String draftId) implements SseEvent {
	}

}
