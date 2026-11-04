package com.doldari.quote;

import java.util.List;

import com.doldari.contract.Adjustment;

/** adjusted_total = total_price + Σ adjustments.amount (spec §5.2). */
public final class AdjustedTotal {

	private AdjustedTotal() {
	}

	/** 표기 총액을 모르면 보정 총액도 알 수 없으므로 null을 돌려준다 (0 대체 금지). */
	public static Long calculate(Long totalPrice, List<Adjustment> adjustments) {
		if (totalPrice == null) {
			return null;
		}
		return totalPrice + adjustments.stream().mapToLong(Adjustment::amount).sum();
	}

}
