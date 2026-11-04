package com.doldari.interview;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;

import com.doldari.contract.AnswersRequest;
import com.doldari.contract.CreateSessionResponse;
import com.doldari.contract.Requirements;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(InterviewController.class)
class InterviewControllerTest {

	private static final UUID SESSION_ID = UUID.fromString("3f2b8c1e-5a4d-4e7f-9b2a-1c6d8e0f4a21");

	@Autowired
	private MockMvc mvc;

	@MockitoBean
	private InterviewService interview;

	@Test
	void startReturnsCreatedWithQuestions() throws Exception {
		given(interview.start("도어락"))
			.willReturn(new CreateSessionResponse(SESSION_ID, InterviewQuestions.DEFAULT.questions()));

		mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON).content("{\"item\": \"도어락\"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.session_id").value(SESSION_ID.toString()))
			.andExpect(jsonPath("$.questions.length()").value(5))
			.andExpect(jsonPath("$.questions[0].field").value("budget"));
	}

	@Test
	void blankItemIsBadRequest() throws Exception {
		mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON).content("{\"item\": \" \"}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void answerReturnsRequirementsWithNullKeys() throws Exception {
		given(interview.answer(eq(SESSION_ID), any(AnswersRequest.class)))
			.willReturn(Optional.of(new Requirements("도어락", 1500000L, null, null, null, null)));

		mvc.perform(post("/api/sessions/{id}/answers", SESSION_ID).contentType(MediaType.APPLICATION_JSON)
			.content("{\"answers\": [{\"field\": \"budget\", \"answer\": \"150만원\"}]}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.budget").value(1500000))
			.andExpect(jsonPath("$.need_install").hasJsonPath())
			.andExpect(jsonPath("$.need_install").isEmpty());
	}

	@Test
	void unknownFieldIsBadRequest() throws Exception {
		mvc.perform(post("/api/sessions/{id}/answers", SESSION_ID).contentType(MediaType.APPLICATION_JSON)
			.content("{\"answers\": [{\"field\": \"color\", \"answer\": \"검정\"}]}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	void unknownSessionIsNotFound() throws Exception {
		given(interview.answer(eq(SESSION_ID), any(AnswersRequest.class))).willReturn(Optional.empty());

		mvc.perform(post("/api/sessions/{id}/answers", SESSION_ID).contentType(MediaType.APPLICATION_JSON)
			.content("{\"answers\": []}"))
			.andExpect(status().isNotFound());
	}

}
