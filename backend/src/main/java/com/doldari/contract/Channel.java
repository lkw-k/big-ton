package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum Channel {

	@JsonProperty("web")
	WEB,

	@JsonProperty("mail")
	MAIL

}
