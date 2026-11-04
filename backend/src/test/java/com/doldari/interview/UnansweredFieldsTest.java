package com.doldari.interview;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import com.doldari.contract.Answer;
import com.doldari.contract.InterviewField;
import com.doldari.contract.Requirements;
import org.junit.jupiter.api.Test;

class UnansweredFieldsTest {

	private static final Requirements GUESSED = new Requirements("LLM이 바꾼 물품", 1500000L, LocalDate.of(2026, 12, 1),
			true, 10, "검정색");

	@Test
	void answeredFieldsAreKept() {
		List<Answer> answers = List.of(new Answer(InterviewField.BUDGET, "150만원"),
				new Answer(InterviewField.DUE_DATE, "12월 1일"), new Answer(InterviewField.NEED_INSTALL, "네"),
				new Answer(InterviewField.QUANTITY, "10개"), new Answer(InterviewField.NOTES, "검정색"));

		assertThat(UnansweredFields.clear("도어락", GUESSED, answers))
			.isEqualTo(new Requirements("도어락", 1500000L, LocalDate.of(2026, 12, 1), true, 10, "검정색"));
	}

	@Test
	void missingNullBlankAndWhitespaceAnswersBecomeNull() {
		List<Answer> answers = List.of(new Answer(InterviewField.BUDGET, "150만원"),
				new Answer(InterviewField.DUE_DATE, null), new Answer(InterviewField.NEED_INSTALL, ""),
				new Answer(InterviewField.QUANTITY, "   "));

		assertThat(UnansweredFields.clear("도어락", GUESSED, answers))
			.isEqualTo(new Requirements("도어락", 1500000L, null, null, null, null));
	}

	@Test
	void itemAlwaysComesFromSession() {
		assertThat(UnansweredFields.clear("도어락", GUESSED, List.of()).item()).isEqualTo("도어락");
	}

}
