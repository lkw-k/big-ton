package com.doldari;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import com.doldari.contract.Requirements;
import com.doldari.llm.StructuredLlm;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

// spec §12 Groq 모델 선정용 실측. ./gradlew groqTest 로만 실행되며 GROQ_MODEL로 모델을 바꾼다.
@Tag("groq")
@EnabledIfEnvironmentVariable(named = "GROQ_API_KEY", matches = ".+")
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class GroqStructuredOutputTest {

	private static final String CONVERSATION = """
			사용자: 주문제작 도어락이 필요해요.
			AI: 예산은 어느 정도인가요?
			사용자: 150만원이요.
			AI: 수량은 몇 개인가요?
			사용자: 10개요.
			AI: 언제까지 필요하세요?
			사용자: 2026-12-01까지요.
			AI: 설치도 필요하신가요?
			사용자: 그건 아직 모르겠어요.
			""";

	@Autowired
	private StructuredLlm llm;

	@RepeatedTest(5)
	void requirementsExtractionPassesValidationWithoutGuessing() {
		Optional<Requirements> result = llm.call("groq-probe-requirements", Map.of("conversation", CONVERSATION),
				Requirements.class);

		assertThat(result).isPresent();
		Requirements requirements = result.get();
		assertThat(requirements.item()).contains("도어락");
		assertThat(requirements.budget()).isEqualTo(1500000L);
		assertThat(requirements.quantity()).isEqualTo(10);
		assertThat(requirements.dueDate()).isEqualTo(LocalDate.of(2026, 12, 1));
		assertThat(requirements.needInstall()).isNull();
		assertThat(requirements.notes()).isNull();
	}

}
