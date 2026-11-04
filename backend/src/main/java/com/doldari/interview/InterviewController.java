package com.doldari.interview;

import java.util.UUID;

import com.doldari.contract.AnswersRequest;
import com.doldari.contract.CreateSessionRequest;
import com.doldari.contract.CreateSessionResponse;
import com.doldari.contract.Requirements;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
class InterviewController {

	private final InterviewService interview;

	InterviewController(InterviewService interview) {
		this.interview = interview;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	CreateSessionResponse start(@Valid @RequestBody CreateSessionRequest request) {
		return interview.start(request.item());
	}

	@PostMapping("/{sessionId}/answers")
	ResponseEntity<Requirements> answer(@PathVariable UUID sessionId, @Valid @RequestBody AnswersRequest request) {
		return ResponseEntity.of(interview.answer(sessionId, request));
	}

}
