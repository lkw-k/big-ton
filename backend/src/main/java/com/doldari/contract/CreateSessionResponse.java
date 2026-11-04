package com.doldari.contract;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

/** schema/interview.schema.json $defs/createSessionResponse. 질문은 최대 5개 (spec §4.1). */
@JsonNaming(SnakeCaseStrategy.class)
public record CreateSessionResponse(
		@NotNull UUID sessionId,
		@NotNull @Size(min = 1, max = 5) List<@NotNull @Valid InterviewQuestion> questions) {
}
