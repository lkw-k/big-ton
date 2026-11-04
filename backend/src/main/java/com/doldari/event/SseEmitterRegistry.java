package com.doldari.event;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** 세션별 SSE 구독 저장소. 완료·타임아웃·에러가 난 구독은 스스로 빠진다. */
@Component
public class SseEmitterRegistry {

	private static final Duration TIMEOUT = Duration.ofMinutes(30);

	private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

	public SseEmitter subscribe(UUID sessionId) {
		return register(sessionId, new SseEmitter(TIMEOUT.toMillis()));
	}

	public SseEmitter register(UUID sessionId, SseEmitter emitter) {
		emitters.computeIfAbsent(sessionId, id -> new CopyOnWriteArraySet<>()).add(emitter);
		emitter.onCompletion(() -> remove(sessionId, emitter));
		emitter.onTimeout(() -> remove(sessionId, emitter));
		emitter.onError(error -> remove(sessionId, emitter));
		return emitter;
	}

	public Set<SseEmitter> emitters(UUID sessionId) {
		return emitters.getOrDefault(sessionId, Set.of());
	}

	public void remove(UUID sessionId, SseEmitter emitter) {
		emitters.computeIfPresent(sessionId, (id, set) -> {
			set.remove(emitter);
			return set.isEmpty() ? null : set;
		});
	}

}
