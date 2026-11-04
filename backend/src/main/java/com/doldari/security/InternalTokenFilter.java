package com.doldari.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import com.doldari.config.AgentProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/** X-Internal-Token이 설정값과 같을 때만 통과시킨다. 토큰 값은 어디에도 기록하지 않는다. 등록 경로는 InternalApiConfig. */
public class InternalTokenFilter extends OncePerRequestFilter {

	public static final String HEADER = "X-Internal-Token";

	private final byte[] expected;

	public InternalTokenFilter(AgentProperties properties) {
		String token = properties.internalToken();
		this.expected = token == null ? new byte[0] : token.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		if (!authorized(request.getHeader(HEADER))) {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			return;
		}
		chain.doFilter(request, response);
	}

	private boolean authorized(String provided) {
		// 설정 토큰이 비어 있으면 fail closed.
		if (expected.length == 0 || provided == null) {
			return false;
		}
		return MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8));
	}

}
