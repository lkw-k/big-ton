package com.doldari.agentevent;

import java.util.List;
import java.util.Map;

import com.doldari.contract.AgentEvent;
import com.doldari.schema.JsonSchemaValidator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** agent 콜백. 토큰 검증은 InternalTokenFilter가 먼저 한다. */
@RestController
class AgentEventController {

	private static final int MAX_ERRORS = 5;

	private final JsonSchemaValidator validator;

	private final JsonMapper jsonMapper;

	private final AgentEventService agentEvents;

	AgentEventController(JsonSchemaValidator validator, JsonMapper jsonMapper, AgentEventService agentEvents) {
		this.validator = validator;
		this.jsonMapper = jsonMapper;
		this.agentEvents = agentEvents;
	}

	@PostMapping("/internal/agent-events")
	ResponseEntity<?> receive(@RequestBody JsonNode body) {
		List<String> errors = validator.validate("agent-event", body);
		if (!errors.isEmpty()) {
			return ResponseEntity.badRequest().body(Map.of("errors", errors.stream().limit(MAX_ERRORS).toList()));
		}
		boolean relayed = agentEvents.relay(jsonMapper.treeToValue(body, AgentEvent.class));
		return relayed ? ResponseEntity.accepted().build() : ResponseEntity.notFound().build();
	}

}
