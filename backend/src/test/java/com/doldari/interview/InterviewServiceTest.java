package com.doldari.interview;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.UUID;

import com.doldari.TestcontainersConfiguration;
import com.doldari.contract.Answer;
import com.doldari.contract.AnswersRequest;
import com.doldari.contract.CreateSessionResponse;
import com.doldari.contract.InterviewField;
import com.doldari.contract.InterviewQuestion;
import com.doldari.contract.Requirements;
import com.doldari.session.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

// 실제 DB + 실제 StructuredLlm, LLM 응답만 ScriptedChatModel로 대체한다.
@SpringBootTest
@Import({ TestcontainersConfiguration.class, InterviewServiceTest.FakeLlm.class })
class InterviewServiceTest {

	private static final String SEVEN_QUESTIONS = """
			{"questions": [
			  {"field": "budget", "question": "예산은?"},
			  {"field": "due_date", "question": "납기는?"},
			  {"field": "budget", "question": "예산 상한은?"},
			  {"field": "need_install", "question": "설치는?"},
			  {"field": "quantity", "question": "수량은?"},
			  {"field": "notes", "question": "기타 조건은?"},
			  {"field": "notes", "question": "색상은?"}
			]}""";

	@Autowired
	private InterviewService interview;

	@Autowired
	private SessionRepository sessions;

	@Autowired
	private ScriptedChatModel model;

	@BeforeEach
	void reset() {
		model.responses.clear();
	}

	@Test
	void questionsAreDedupedByFieldAndCutToFive() {
		model.responses.add(SEVEN_QUESTIONS);

		CreateSessionResponse response = interview.start("주문제작 도어락");

		assertThat(response.questions()).extracting(InterviewQuestion::field)
			.containsExactly(InterviewField.BUDGET, InterviewField.DUE_DATE, InterviewField.NEED_INSTALL,
					InterviewField.QUANTITY, InterviewField.NOTES);
		assertThat(sessions.findById(response.sessionId()).orElseThrow().getRequirements())
			.isEqualTo(new Requirements("주문제작 도어락", null, null, null, null, null));
	}

	@Test
	void fewerQuestionsAreKeptAsIs() {
		model.responses.add("{\"questions\": [{\"field\": \"budget\", \"question\": \"예산은?\"}]}");

		assertThat(interview.start("도어락").questions()).hasSize(1);
	}

	@Test
	void failedQuestionGenerationFallsBackToDefaults() {
		model.responses.addAll(List.of("x", "y", "z"));

		assertThat(interview.start("도어락").questions()).isEqualTo(InterviewQuestions.DEFAULT.questions());
	}

	@Test
	void unansweredFieldIsNullEvenIfLlmGuesses() {
		UUID sessionId = startSession();
		model.responses.add("""
				{"item": "도어락", "budget": 1500000, "due_date": null, "need_install": true,
				 "quantity": 10, "notes": null}""");

		Requirements result = interview
			.answer(sessionId,
					new AnswersRequest(List.of(new Answer(InterviewField.BUDGET, "150만원"),
							new Answer(InterviewField.QUANTITY, "10개"), new Answer(InterviewField.NEED_INSTALL, " "))))
			.orElseThrow();

		assertThat(result).isEqualTo(new Requirements("주문제작 도어락", 1500000L, null, null, 10, null));
		assertThat(sessions.findById(sessionId).orElseThrow().getRequirements()).isEqualTo(result);
	}

	@Test
	void failedExtractionStoresUnknown() {
		UUID sessionId = startSession();
		model.responses.addAll(List.of("x", "y", "z"));

		Requirements result = interview
			.answer(sessionId, new AnswersRequest(List.of(new Answer(InterviewField.BUDGET, "150만원"))))
			.orElseThrow();

		assertThat(result).isEqualTo(new Requirements("주문제작 도어락", null, null, null, null, null));
		assertThat(sessions.findById(sessionId).orElseThrow().getRequirements()).isEqualTo(result);
	}

	@Test
	void unknownSessionGivesEmpty() {
		assertThat(interview.answer(UUID.randomUUID(), new AnswersRequest(List.of()))).isEmpty();
	}

	private UUID startSession() {
		model.responses.add(SEVEN_QUESTIONS);
		return interview.start("주문제작 도어락").sessionId();
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class FakeLlm {

		@Bean
		@Primary
		ScriptedChatModel scriptedChatModel() {
			return new ScriptedChatModel();
		}

	}

	static class ScriptedChatModel implements ChatModel {

		private final Deque<String> responses = new ArrayDeque<>();

		@Override
		public ChatResponse call(Prompt prompt) {
			return new ChatResponse(List.of(new Generation(new AssistantMessage(responses.removeFirst()))));
		}

	}

}
