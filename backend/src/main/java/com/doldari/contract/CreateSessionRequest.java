package com.doldari.contract;

import jakarta.validation.constraints.NotBlank;

/** schema/interview.schema.json $defs/createSessionRequest. */
public record CreateSessionRequest(@NotBlank String item) {
}
