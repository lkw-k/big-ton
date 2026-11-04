package com.doldari.contract;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

/** schema/requirements.schema.json. 답하지 않은 항목은 null. */
@JsonNaming(SnakeCaseStrategy.class)
public record Requirements(
		@NotBlank String item,
		@PositiveOrZero Long budget,
		LocalDate dueDate,
		Boolean needInstall,
		@Positive Integer quantity,
		String notes) {
}
