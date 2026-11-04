package com.doldari.schema;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

// 예제 파일 읽기만 하므로 기본 매퍼로 충분하다. 스키마는 processResources로 복사된 classpath:schema/를 쓴다.
class JsonSchemaValidatorTest {

	private static final Path EXAMPLES = Path.of("../schema/examples");

	private static final JsonMapper MAPPER = JsonMapper.builder().build();

	private final JsonSchemaValidator validator = new JsonSchemaValidator();

	@Test
	void validSseEventsPass() throws IOException {
		for (JsonNode event : read(EXAMPLES.resolve("valid/sse-events.json"))) {
			assertThat(validator.validate("sse-event", event)).isEmpty();
		}
	}

	@Test
	void validAgentEventPasses() throws IOException {
		assertThat(validator.validate("agent-event", read(EXAMPLES.resolve("valid/agent-event.json")))).isEmpty();
	}

	static Stream<Path> invalidExamples() throws IOException {
		return Files.list(EXAMPLES.resolve("invalid"))
			.filter(path -> path.getFileName().toString().matches("(sse-event|agent-event|quote)-.*\\.json"))
			.sorted();
	}

	@ParameterizedTest
	@MethodSource
	void invalidExamples(Path example) throws IOException {
		String name = example.getFileName().toString();
		String schema = name.startsWith("sse-event") ? "sse-event" : name.startsWith("agent-event") ? "agent-event" : "quote";

		assertThat(validator.validate(schema, read(example))).isNotEmpty();
	}

	private static JsonNode read(Path path) throws IOException {
		return MAPPER.readTree(Files.readString(path));
	}

}
