package com.doldari.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** schema/follow-up-question.schema.json. */
public record FollowUpQuestion(
		@NotBlank String vendor,
		@NotNull QuoteField field,
		@NotBlank String question) {
}
