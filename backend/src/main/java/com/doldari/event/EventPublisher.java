package com.doldari.event;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import com.doldari.contract.SseEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.json.JsonMapper;

/** 이벤트를 event_log에 저장한 뒤 그 세션의 구독자에게 보낸다. */
@Service
public class EventPublisher {

	private final SseEmitterRegistry registry;

	private final EventLogRepository eventLogs;

	private final JsonMapper jsonMapper;

	private final Map<UUID, ReentrantLock> locks = new ConcurrentHashMap<>();

	public EventPublisher(SseEmitterRegistry registry, EventLogRepository eventLogs, JsonMapper jsonMapper) {
		this.registry = registry;
		this.eventLogs = eventLogs;
		this.jsonMapper = jsonMapper;
	}

	/**
	 * 트랜잭션으로 감싸지 않는다: 저장은 save() 단위로 먼저 커밋되고, 전송이 실패해도 로그는 남는다.
	 */
	public void publish(UUID sessionId, SseEvent event) {
		// 순서 보장 > 처리량: 락을 잡은 채 전송하므로 느린 구독자가 같은 세션 발행을 늦출 수 있다 (시연 규모에서 허용).
		ReentrantLock lock = locks.computeIfAbsent(sessionId, id -> new ReentrantLock());
		lock.lock();
		try {
			Long id = eventLogs.save(new EventLog(sessionId, event)).getId();
			String data = jsonMapper.writeValueAsString(event);
			registry.emitters(sessionId).forEach(emitter -> send(sessionId, emitter, id, data));
		}
		finally {
			lock.unlock();
		}
	}

	private void send(UUID sessionId, SseEmitter emitter, Long id, String data) {
		try {
			emitter.send(SseEmitter.event().id(String.valueOf(id)).data(data));
		}
		catch (IOException | IllegalStateException ex) {
			// 끊긴 구독. 컨테이너가 연결을 정리하므로 여기서는 목록에서만 뺀다.
			registry.remove(sessionId, emitter);
		}
	}

}
