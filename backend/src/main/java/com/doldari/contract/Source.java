package com.doldari.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record Source(
		@NotNull SourceField field,
		@NotNull SourceType type,
		@NotBlank String ref,
		String snippet) {
}
