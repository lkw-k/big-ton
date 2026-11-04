package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SourceType {

	@JsonProperty("url")
	URL,

	@JsonProperty("mail")
	MAIL,

	@JsonProperty("attachment")
	ATTACHMENT

}
