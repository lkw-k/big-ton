package com.doldari.contract;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy;
import tools.jackson.databind.annotation.JsonNaming;

/** schema/agent-event.schema.json. agent → backend 콜백 본문. */
@JsonNaming(SnakeCaseStrategy.class)
public record AgentEvent(@NotNull UUID sessionId, @NotNull @Valid SseEvent event) {
}
