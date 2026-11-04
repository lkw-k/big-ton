package com.doldari.llm;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * 프롬프트 파일로 LLM을 호출하고 출력을 타입으로 파싱·검증한다. 검증 실패 시 재호출하고, 끝내 실패하면 empty(=미확인).
 */
@Component
public class StructuredLlm {

	private static final Logger log = LoggerFactory.getLogger(StructuredLlm.class);

	private static final Pattern CODE_FENCE = Pattern.compile("^```(?:json)?\s*(.*?)\s*```$", Pattern.DOTALL);

	// 응답에 개인정보가 섞일 수 있어 로그에는 앞부분만 남긴다.
	private static final int LOG_LIMIT = 200;

	private final ChatClient chatClient;

	private final PromptLoader prompts;

	private final JsonMapper jsonMapper;

	private final Validator validator;

	private final LlmProperties properties;

	public StructuredLlm(ChatClient.Builder chatClientBuilder, PromptLoader prompts, JsonMapper jsonMapper,
			Validator validator, LlmProperties properties) {
		this.chatClient = chatClientBuilder.build();
		this.prompts = prompts;
		this.jsonMapper = jsonMapper;
		this.validator = validator;
		this.properties = properties;
	}

	public <T> Optional<T> call(String promptName, Map<String, Object> variables, Class<T> type) {
		String prompt = prompts.render(promptName, variables);
		for (int attempt = 1; attempt <= properties.maxAttempts(); attempt++) {
			String output = chatClient.prompt().user(prompt).call().content();
			Optional<T> parsed = parse(output, type, promptName, attempt);
			if (parsed.isPresent()) {
				return parsed;
			}
		}
		return Optional.empty();
	}

	private <T> Optional<T> parse(String output, Class<T> type, String promptName, int attempt) {
		if (output == null) {
			warn(promptName, attempt, "빈 응답", "");
			return Optional.empty();
		}
		try {
			T value = jsonMapper.readValue(stripCodeFence(output), type);
			if (value == null) {
				warn(promptName, attempt, "null 응답", output);
				return Optional.empty();
			}
			Set<ConstraintViolation<T>> violations = validator.validate(value);
			if (violations.isEmpty()) {
				return Optional.of(value);
			}
			warn(promptName, attempt, violations.toString(), output);
		}
		catch (JacksonException ex) {
			warn(promptName, attempt, ex.getOriginalMessage(), output);
		}
		return Optional.empty();
	}

	private static String stripCodeFence(String output) {
		Matcher matcher = CODE_FENCE.matcher(output.strip());
		return matcher.matches() ? matcher.group(1) : output;
	}

	private void warn(String promptName, int attempt, String reason, String output) {
		log.warn("LLM 출력 검증 실패 prompt={} attempt={}/{} reason={} output={}", promptName, attempt,
				properties.maxAttempts(), truncate(reason), truncate(output));
	}

	private static String truncate(String text) {
		String value = String.valueOf(text);
		return value.length() <= LOG_LIMIT ? value : value.substring(0, LOG_LIMIT) + "...";
	}

}
