package com.doldari.agentevent;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import com.doldari.TestcontainersConfiguration;
import com.doldari.session.Session;
import com.doldari.session.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties = "agent.internal-token=test-token")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AgentEventsTest {

	private static final String LOG_EVENT = "{\"type\":\"log\",\"text\":\"B업체 사이트에서 납기 확인 중\",\"vendor\":\"B\"}";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private SessionRepository sessions;

	private UUID sessionId;

	@BeforeEach
	void createSession() {
		sessionId = sessions.save(new Session()).getId();
	}

	@Test
	void missingTokenIsUnauthorized() throws Exception {
		mvc.perform(post("/internal/agent-events").contentType(MediaType.APPLICATION_JSON).content(body(LOG_EVENT)))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void wrongTokenIsUnauthorized() throws Exception {
		mvc.perform(post("/internal/agent-events").header("X-Internal-Token", "wrong")
			.contentType(MediaType.APPLICATION_JSON)
			.content(body(LOG_EVENT))).andExpect(status().isUnauthorized());
	}

	@ParameterizedTest
	@ValueSource(strings = { "{\"type\":\"progress\",\"percent\":50}",
			"{\"type\":\"adjustment\",\"vendor\":\"A\",\"label\":\"설치비\",\"amount\":150000}",
			"{\"type\":\"quote_update\",\"vendor\":\"A\",\"quote\":{\"vendor\":\"A\",\"channel\":\"web\"}}",
			"{\"type\":\"step\",\"step\":2,\"extra\":true}" })
	void invalidEventIsBadRequest(String event) throws Exception {
		mvc.perform(authorized(body(event))).andExpect(status().isBadRequest());
	}

	@Test
	void validEventIsRelayedToSubscribers() throws Exception {
		MockHttpServletResponse stream = mvc.perform(get("/api/sessions/{id}/events", sessionId))
			.andExpect(request().asyncStarted())
			.andReturn()
			.getResponse();

		mvc.perform(authorized(body(LOG_EVENT))).andExpect(status().isAccepted());

		assertThat(stream.getContentAsString(StandardCharsets.UTF_8)).contains("data:" + LOG_EVENT);
	}

	@Test
	void unknownSessionIsNotFound() throws Exception {
		String unknown = "{\"session_id\":\"" + UUID.randomUUID() + "\",\"event\":" + LOG_EVENT + "}";

		mvc.perform(authorized(unknown)).andExpect(status().isNotFound());
	}

	private MockHttpServletRequestBuilder authorized(String content) {
		return post("/internal/agent-events").header("X-Internal-Token", "test-token")
			.contentType(MediaType.APPLICATION_JSON)
			.content(content);
	}

	private String body(String event) {
		return "{\"session_id\":\"" + sessionId + "\",\"event\":" + event + "}";
	}

}
