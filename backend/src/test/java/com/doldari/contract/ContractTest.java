package com.doldari.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

// 운영과 같은 매퍼 설정을 쓰기 위해 Boot가 구성한 JsonMapper를 주입받는다.
@JsonTest
class ContractTest {

	private static final Path EXAMPLES = Path.of("../schema/examples");

	private static final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	@Autowired
	private JsonMapper mapper;

	static Stream<Arguments> validExamples() {
		return Stream.of(
				arguments("requirements.json", Requirements.class),
				arguments("quote.json", Quote.class),
				arguments("follow-up-question.json", FollowUpQuestion.class),
				arguments("interview-create-session-request.json", CreateSessionRequest.class),
				arguments("interview-create-session-response.json", CreateSessionResponse.class),
				arguments("interview-answers-request.json", AnswersRequest.class));
	}

	@ParameterizedTest
	@MethodSource
	void validExamples(String file, Class<?> type) throws IOException {
		assertRoundTrip(readTree("valid/" + file), type);
	}

	@Test
	void validSseEventsRoundTripAllTypes() throws IOException {
		JsonNode events = readTree("valid/sse-events.json");
		assertThat(events.size()).isEqualTo(6);
		for (JsonNode event : events) {
			assertRoundTrip(event, SseEvent.class);
		}
	}

	static Stream<Arguments> violationExamples() {
		return Stream.of(
				arguments("quote-adjustment-no-status.json", Quote.class),
				arguments("sse-event-adjustment-no-status.json", SseEvent.class),
				arguments("sse-event-quote-update-bad-quote.json", SseEvent.class),
				arguments("requirements-missing-item.json", Requirements.class),
				arguments("interview-blank-item.json", CreateSessionRequest.class),
				arguments("interview-answer-missing-field.json", AnswersRequest.class),
				arguments("interview-too-many-questions.json", CreateSessionResponse.class));
	}

	@ParameterizedTest
	@MethodSource
	void violationExamples(String file, Class<?> type) throws IOException {
		Object value = mapper.treeToValue(readTree("invalid/" + file), type);
		assertThat(validator.validate(value)).isNotEmpty();
	}

	static Stream<Arguments> unreadableExamples() {
		return Stream.of(
				arguments("quote-adjustment-bad-status.json", Quote.class),
				arguments("quote-bad-channel.json", Quote.class),
				arguments("quote-bad-source-type.json", Quote.class),
				arguments("sse-event-unknown-type.json", SseEvent.class),
				arguments("sse-event-approval-bad-kind.json", SseEvent.class),
				arguments("requirements-bad-date.json", Requirements.class),
				arguments("follow-up-question-bad-field.json", FollowUpQuestion.class),
				arguments("interview-unknown-field.json", AnswersRequest.class));
	}

	@ParameterizedTest
	@MethodSource
	void unreadableExamples(String file, Class<?> type) throws IOException {
		JsonNode tree = readTree("invalid/" + file);
		assertThatThrownBy(() -> mapper.treeToValue(tree, type)).isInstanceOf(JacksonException.class);
	}

	private void assertRoundTrip(JsonNode original, Class<?> type) {
		Object value = mapper.treeToValue(original, type);
		assertThat(validator.validate(value)).isEmpty();
		// 문자열을 거쳐 다시 읽어야 Long/Integer 노드 타입 차이 없이 비교된다. null 키 유지도 여기서 확인된다.
		assertThat(mapper.readTree(mapper.writeValueAsString(value))).isEqualTo(original);
	}

	private JsonNode readTree(String relativePath) throws IOException {
		return mapper.readTree(Files.readString(EXAMPLES.resolve(relativePath)));
	}

}
