package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum AdjustmentStatus {

	@JsonProperty("confirmed")
	CONFIRMED,

	@JsonProperty("estimated")
	ESTIMATED

}
