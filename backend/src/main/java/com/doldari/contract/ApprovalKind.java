package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum ApprovalKind {

	@JsonProperty("send_mail")
	SEND_MAIL,

	@JsonProperty("submit_form")
	SUBMIT_FORM

}
