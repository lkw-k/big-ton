package com.doldari.contract;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

/** schema/quote.schema.json. 모르는 값은 null(0 대체 금지) + missingFields에 기록. */
@JsonNaming(SnakeCaseStrategy.class)
public record Quote(
		@NotBlank String vendor,
		@NotNull Channel channel,
		@PositiveOrZero Long totalPrice,
		@PositiveOrZero Integer leadTimeDays,
		Boolean installIncluded,
		@PositiveOrZero Long shippingFee,
		@PositiveOrZero Integer warrantyMonths,
		@NotNull List<@NotNull QuoteField> missingFields,
		@NotNull List<@NotNull @Valid Adjustment> adjustments,
		Long adjustedTotal,
		@NotNull List<@NotNull @Valid Source> sources) {
}
