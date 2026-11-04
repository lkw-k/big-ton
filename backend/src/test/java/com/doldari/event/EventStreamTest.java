package com.doldari.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import com.doldari.TestcontainersConfiguration;
import com.doldari.contract.AdjustmentStatus;
import com.doldari.contract.Channel;
import com.doldari.contract.Quote;
import com.doldari.contract.SseEvent;
import com.doldari.session.Session;
import com.doldari.session.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 세션별 SSE 구독·발행. 구독 이전에 발행된 이벤트는 받지 않는 것이 의도다 (Last-Event-ID 재전송은 범위 밖).
 * 발행이 스레드를 넘나들므로 @Transactional 없이 실제로 커밋하고, 세션 id로 테스트 간 데이터를 분리한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class EventStreamTest {

	@Autowired
	private MockMvc mvc;

	@Autowired
	private EventPublisher publisher;

	@Autowired
	private SseEmitterRegistry registry;

	@Autowired
	private SessionRepository sessions;

	@Autowired
	private EventLogRepository eventLogs;

	private UUID sessionId;

	@BeforeEach
	void createSession() {
		sessionId = sessions.save(new Session()).getId();
	}

	@Test
	void subscriberReceivesEventJsonWithIdAndNullKeys() throws Exception {
		MockHttpServletResponse stream = subscribe(sessionId);

		publisher.publish(sessionId, new SseEvent.QuoteUpdate("A", quote()));

		List<String> lines = lines(stream);
		assertThat(lines).anyMatch(line -> line.matches("id:\\d+"));
		assertThat(data(lines)).singleElement()
			.satisfies(json -> assertThat(json).contains("\"type\":\"quote_update\"")
				.contains("\"warranty_months\":null"));
	}

	@Test
	void eventsArriveInPublishOrderWithIncreasingIds() throws Exception {
		MockHttpServletResponse stream = subscribe(sessionId);

		publisher.publish(sessionId, new SseEvent.Step(1));
		publisher.publish(sessionId, new SseEvent.Step(2));

		List<String> lines = lines(stream);
		assertThat(data(lines)).containsExactly("{\"type\":\"step\",\"step\":1}", "{\"type\":\"step\",\"step\":2}");
		List<Long> ids = ids(lines);
		assertThat(ids).hasSize(2).isSorted();
	}

	@Test
	void otherSessionDoesNotReceive() throws Exception {
		UUID otherSession = sessions.save(new Session()).getId();
		MockHttpServletResponse other = subscribe(otherSession);

		publisher.publish(sessionId, new SseEvent.Step(1));

		assertThat(data(lines(other))).isEmpty();
	}

	@Test
	void publishedEventsAreLoggedInOrder() {
		List<SseEvent> events = List.of(new SseEvent.Step(2),
				new SseEvent.AdjustmentEvent("A", "설치비", 150000L, AdjustmentStatus.ESTIMATED));

		events.forEach(event -> publisher.publish(sessionId, event));

		assertThat(eventLogs.findBySessionIdOrderByIdAsc(sessionId)).extracting(EventLog::getPayload)
			.containsExactlyElementsOf(events);
	}

	@Test
	void failedSendRemovesEmitterButKeepsLog() {
		SseEmitter broken = new SseEmitter() {
			@Override
			public void send(SseEventBuilder builder) throws IOException {
				throw new IOException("client gone");
			}
		};
		registry.register(sessionId, broken);

		publisher.publish(sessionId, new SseEvent.Step(3));

		assertThat(registry.emitters(sessionId)).doesNotContain(broken);
		assertThat(eventLogs.findBySessionIdOrderByIdAsc(sessionId)).extracting(EventLog::getPayload)
			.containsExactly(new SseEvent.Step(3));
	}

	@Test
	void concurrentPublishKeepsSendOrderEqualToLogOrder() throws Exception {
		MockHttpServletResponse stream = subscribe(sessionId);
		int count = 16;
		CountDownLatch start = new CountDownLatch(1);
		ExecutorService pool = Executors.newFixedThreadPool(count);
		IntStream.range(0, count).forEach(i -> pool.submit(() -> {
			start.await();
			publisher.publish(sessionId, new SseEvent.Log("작업 " + i, null));
			return null;
		}));

		start.countDown();
		pool.shutdown();
		assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();

		List<Long> received = ids(lines(stream));
		List<Long> logged = eventLogs.findBySessionIdOrderByIdAsc(sessionId).stream().map(EventLog::getId).toList();
		assertThat(received).hasSize(count).isSorted().isEqualTo(logged);
	}

	private MockHttpServletResponse subscribe(UUID session) throws Exception {
		return mvc.perform(get("/api/sessions/{id}/events", session))
			.andExpect(request().asyncStarted())
			.andReturn()
			.getResponse();
	}

	private static List<String> lines(MockHttpServletResponse stream) throws IOException {
		return stream.getContentAsString(StandardCharsets.UTF_8).lines().toList();
	}

	private static List<String> data(List<String> lines) {
		return lines.stream().filter(line -> line.startsWith("data:")).map(line -> line.substring(5)).toList();
	}

	private static List<Long> ids(List<String> lines) {
		return lines.stream().filter(line -> line.startsWith("id:")).map(line -> Long.valueOf(line.substring(3))).toList();
	}

	private static Quote quote() {
		return new Quote("A업체", Channel.WEB, 1200000L, 14, null, 50000L, null, List.of(), List.of(), 1200000L,
				List.of());
	}

}
