package com.doldari.llm;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** @param maxAttempts LLM 출력이 검증에 실패할 때 포함해 최대 호출 횟수 */
@ConfigurationProperties("llm")
public record LlmProperties(@DefaultValue("3") int maxAttempts) {
}
