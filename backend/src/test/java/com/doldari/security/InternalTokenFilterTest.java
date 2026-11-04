package com.doldari.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.doldari.config.AgentProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class InternalTokenFilterTest {

	@Test
	void emptyConfiguredTokenRejectsEvenEmptyHeader() throws Exception {
		assertThat(status(new AgentProperties("http://agent", ""), "")).isEqualTo(401);
	}

	@Test
	void matchingTokenPasses() throws Exception {
		assertThat(status(new AgentProperties("http://agent", "secret"), "secret")).isEqualTo(200);
	}

	@Test
	void differentTokenIsRejected() throws Exception {
		assertThat(status(new AgentProperties("http://agent", "secret"), "secreT")).isEqualTo(401);
	}

	private static int status(AgentProperties properties, String header) throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/internal/agent-events");
		request.addHeader(InternalTokenFilter.HEADER, header);
		MockHttpServletResponse response = new MockHttpServletResponse();
		new InternalTokenFilter(properties).doFilter(request, response, new MockFilterChain());
		return response.getStatus();
	}

}
