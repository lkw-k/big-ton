package com.doldari.llm;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.core.io.DefaultResourceLoader;
import tools.jackson.databind.json.JsonMapper;

// 실제 LLM 호출 없이 미리 준비한 응답을 돌려주는 ChatModel로 검증·재시도를 확인한다.
// JsonMapper는 운영과 같은 Boot 설정을 쓰려고 @JsonTest로 주입받는다.
@JsonTest
class StructuredLlmTest {

	record Item(@NotBlank String name, Integer count) {
	}

	@Autowired
	private JsonMapper jsonMapper;

	private FakeChatModel model;

	@Test
	void validFirstResponseIsReturned() {
		assertThat(call("{\"name\": \"도어락\", \"count\": null}")).contains(new Item("도어락", null));
		assertThat(model.prompts).hasSize(1);
	}

	@Test
	void invalidJsonIsRetried() {
		assertThat(call("도어락입니다", "{\"name\": \"도어락\", \"count\": 2}")).contains(new Item("도어락", 2));
		assertThat(model.prompts).hasSize(2);
	}

	@Test
	void allAttemptsFailingGivesUnknown() {
		assertThat(call("x", "{", "{\"name\": ")).isEmpty();
		assertThat(model.prompts).hasSize(3);
	}

	@Test
	void validationViolationIsRetried() {
		assertThat(call("{\"name\": \"\", \"count\": 1}", "{\"name\": \"도어락\", \"count\": 1}"))
			.contains(new Item("도어락", 1));
		assertThat(model.prompts).hasSize(2);
	}

	@Test
	void codeFenceIsStripped() {
		assertThat(call("```json\n{\"name\": \"도어락\", \"count\": null}\n```")).contains(new Item("도어락", null));
	}

	@Test
	void promptFileIsRenderedWithVariables() {
		call("{\"name\": \"도어락\", \"count\": null}");

		assertThat(model.prompts.get(0)).contains("물품 주문제작 도어락의 이름")
			.contains("{\"name\": \"...\", \"count\": null}");
	}

	private Optional<Item> call(String... responses) {
		model = new FakeChatModel(responses);
		StructuredLlm llm = new StructuredLlm(ChatClient.builder(model), new PromptLoader(new DefaultResourceLoader()),
				jsonMapper, Validation.buildDefaultValidatorFactory().getValidator(), new LlmProperties(3));
		return llm.call("test-item", Map.of("item", "주문제작 도어락"), Item.class);
	}

	private static final class FakeChatModel implements ChatModel {

		private final Deque<String> responses;

		private final List<String> prompts = new ArrayList<>();

		FakeChatModel(String... responses) {
			this.responses = new ArrayDeque<>(List.of(responses));
		}

		@Override
		public ChatResponse call(Prompt prompt) {
			prompts.add(prompt.getContents());
			return new ChatResponse(List.of(new Generation(new AssistantMessage(responses.removeFirst()))));
		}

	}

}
