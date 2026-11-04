package com.doldari.quote;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import com.doldari.contract.Adjustment;
import com.doldari.contract.AdjustmentStatus;
import com.doldari.contract.Quote;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class AdjustedTotalTest {

	private static final Adjustment INSTALL = new Adjustment("설치비", 150000L, AdjustmentStatus.CONFIRMED);

	@Test
	void nullTotalStaysNullEvenWithAdjustments() {
		assertThat(AdjustedTotal.calculate(null, List.of(INSTALL))).isNull();
	}

	@Test
	void noAdjustmentsKeepsTotal() {
		assertThat(AdjustedTotal.calculate(1200000L, List.of())).isEqualTo(1200000L);
	}

	@Test
	void sumsConfirmedAndEstimated() {
		Adjustment shipping = new Adjustment("배송비", 30000L, AdjustmentStatus.ESTIMATED);

		assertThat(AdjustedTotal.calculate(1200000L, List.of(INSTALL, shipping))).isEqualTo(1380000L);
	}

	@Test
	void negativeAdjustmentIsSubtracted() {
		Adjustment discount = new Adjustment("할인", -100000L, AdjustmentStatus.CONFIRMED);

		assertThat(AdjustedTotal.calculate(1200000L, List.of(INSTALL, discount))).isEqualTo(1250000L);
	}

	@Test
	void matchesSchemaExample() throws IOException {
		// 예제 읽기만 하므로 Spring 컨텍스트 없이 기본 매퍼를 쓴다. 매퍼 설정 일치는 ContractTest가 검증한다.
		Quote quote = JsonMapper.builder().build()
			.readValue(Files.readString(Path.of("../schema/examples/valid/quote.json")), Quote.class);

		assertThat(AdjustedTotal.calculate(quote.totalPrice(), quote.adjustments())).isEqualTo(quote.adjustedTotal());
	}

}
