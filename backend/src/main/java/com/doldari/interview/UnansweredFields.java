package com.doldari.interview;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.doldari.contract.Answer;
import com.doldari.contract.InterviewField;
import com.doldari.contract.Requirements;

/** 추측 금지(spec §4.1): 사용자가 답하지 않은 필드는 LLM이 채웠더라도 null로 되돌린다. */
final class UnansweredFields {

	private UnansweredFields() {
	}

	static Requirements clear(String item, Requirements extracted, List<Answer> answers) {
		Set<InterviewField> answered = answers.stream()
			.filter(UnansweredFields::isAnswered)
			.map(Answer::field)
			.collect(Collectors.toSet());
		return new Requirements(item, answered.contains(InterviewField.BUDGET) ? extracted.budget() : null,
				answered.contains(InterviewField.DUE_DATE) ? extracted.dueDate() : null,
				answered.contains(InterviewField.NEED_INSTALL) ? extracted.needInstall() : null,
				answered.contains(InterviewField.QUANTITY) ? extracted.quantity() : null,
				answered.contains(InterviewField.NOTES) ? extracted.notes() : null);
	}

	static boolean isAnswered(Answer answer) {
		return answer.answer() != null && !answer.answer().isBlank();
	}

}
