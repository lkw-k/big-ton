package com.doldari.contract;

import jakarta.validation.constraints.NotNull;

/** answer가 null이거나 공백뿐이면 미응답. */
public record Answer(@NotNull InterviewField field, String answer) {
}
