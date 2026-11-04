package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SourceField {

	@JsonProperty("vendor")
	VENDOR,

	@JsonProperty("total_price")
	TOTAL_PRICE,

	@JsonProperty("lead_time_days")
	LEAD_TIME_DAYS,

	@JsonProperty("install_included")
	INSTALL_INCLUDED,

	@JsonProperty("shipping_fee")
	SHIPPING_FEE,

	@JsonProperty("warranty_months")
	WARRANTY_MONTHS,

	@JsonProperty("adjustments")
	ADJUSTMENTS

}
