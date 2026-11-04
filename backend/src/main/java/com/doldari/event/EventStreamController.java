package com.doldari.event;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
class EventStreamController {

	private final SseEmitterRegistry registry;

	EventStreamController(SseEmitterRegistry registry) {
		this.registry = registry;
	}

	@GetMapping(path = "/api/sessions/{sessionId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	SseEmitter subscribe(@PathVariable UUID sessionId) {
		return registry.subscribe(sessionId);
	}

}
