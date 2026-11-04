package com.doldari.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record Adjustment(
		@NotBlank String label,
		@NotNull Long amount,
		@NotNull AdjustmentStatus status) {
}
