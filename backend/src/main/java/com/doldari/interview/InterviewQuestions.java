package com.doldari.interview;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.doldari.contract.InterviewField;
import com.doldari.contract.InterviewQuestion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/** 질문 생성 LLM의 출력 형태. */
record InterviewQuestions(@NotEmpty List<@NotNull @Valid InterviewQuestion> questions) {

	static final int MAX = 5;

	/** LLM 질문 생성이 미확인일 때 쓰는 고정 질문 (spec §4.1 항목). */
	static final InterviewQuestions DEFAULT = new InterviewQuestions(List.of(
			new InterviewQuestion(InterviewField.BUDGET, "예산은 어느 정도인가요?"),
			new InterviewQuestion(InterviewField.DUE_DATE, "언제까지 필요하신가요?"),
			new InterviewQuestion(InterviewField.NEED_INSTALL, "설치도 필요하신가요?"),
			new InterviewQuestion(InterviewField.QUANTITY, "수량은 몇 개인가요?"),
			new InterviewQuestion(InterviewField.NOTES, "그 밖에 원하시는 조건이 있나요?")));

	/** 필드당 첫 질문만 남기고 최대 5개로 자른다. 모자라도 채우지 않는다. */
	List<InterviewQuestion> trimmed() {
		Map<InterviewField, InterviewQuestion> byField = new LinkedHashMap<>();
		questions.forEach(question -> byField.putIfAbsent(question.field(), question));
		return byField.values().stream().limit(MAX).toList();
	}

}
