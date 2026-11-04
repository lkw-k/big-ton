package com.doldari.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** @param internalToken Spring ↔ Python 내부 API 공유 토큰. 비어 있으면 내부 API는 전부 거부된다. */
@ConfigurationProperties("agent")
public record AgentProperties(String baseUrl, String internalToken) {
}
