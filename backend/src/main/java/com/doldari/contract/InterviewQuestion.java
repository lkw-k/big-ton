package com.doldari.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InterviewQuestion(@NotNull InterviewField field, @NotBlank String question) {
}
