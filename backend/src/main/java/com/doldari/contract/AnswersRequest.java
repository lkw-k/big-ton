package com.doldari.contract;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/** schema/interview.schema.json $defs/answersRequest. */
public record AnswersRequest(@NotNull List<@NotNull @Valid Answer> answers) {
}
