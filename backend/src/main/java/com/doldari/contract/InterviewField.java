package com.doldari.contract;

import com.fasterxml.jackson.annotation.JsonProperty;

/** schema/interview.schema.json $defs/field. 알 수 없는 값은 역직렬화 단계에서 거부된다. */
public enum InterviewField {

	@JsonProperty("budget")
	BUDGET,

	@JsonProperty("due_date")
	DUE_DATE,

	@JsonProperty("need_install")
	NEED_INSTALL,

	@JsonProperty("quantity")
	QUANTITY,

	@JsonProperty("notes")
	NOTES

}
