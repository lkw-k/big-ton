package com.doldari.interview;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.doldari.contract.Answer;
import com.doldari.contract.AnswersRequest;
import com.doldari.contract.CreateSessionResponse;
import com.doldari.contract.InterviewQuestion;
import com.doldari.contract.Requirements;
import com.doldari.llm.StructuredLlm;
import com.doldari.session.Session;
import com.doldari.session.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class InterviewService {

	private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

	private final StructuredLlm llm;

	private final SessionRepository sessions;

	public InterviewService(StructuredLlm llm, SessionRepository sessions) {
		this.llm = llm;
		this.sessions = sessions;
	}

	public CreateSessionResponse start(String item) {
		Session session = new Session();
		session.setRequirements(unknown(item));
		UUID sessionId = sessions.save(session).getId();
		return new CreateSessionResponse(sessionId, questionsFor(item));
	}

	public Optional<Requirements> answer(UUID sessionId, AnswersRequest request) {
		return sessions.findById(sessionId).map(session -> {
			String item = session.getRequirements().item();
			Requirements extracted = llm
				.call("interview-requirements", Map.of("item", item, "answers", format(request.answers())),
						Requirements.class)
				.orElseGet(() -> unknown(item));
			Requirements requirements = UnansweredFields.clear(item, extracted, request.answers());
			session.setRequirements(requirements);
			sessions.save(session);
			return requirements;
		});
	}

	private List<InterviewQuestion> questionsFor(String item) {
		Optional<InterviewQuestions> generated = llm.call("interview-questions", Map.of("item", item),
				InterviewQuestions.class);
		if (generated.isEmpty()) {
			log.warn("인터뷰 질문 생성이 미확인이라 기본 질문으로 대체한다");
		}
		return generated.orElse(InterviewQuestions.DEFAULT).trimmed();
	}

	private static String format(List<Answer> answers) {
		return answers.stream()
			.filter(UnansweredFields::isAnswered)
			.map(answer -> "- " + answer.field().name().toLowerCase() + ": " + answer.answer().strip())
			.collect(Collectors.joining("\n"));
	}

	private static Requirements unknown(String item) {
		return new Requirements(item, null, null, null, null, null);
	}

}
