package com.doldari.config;

import org.hibernate.cfg.MappingSettings;
import org.hibernate.type.format.jackson.Jackson3JsonFormatMapper;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

// Hibernate는 classpath의 Jackson 2를 먼저 골라 계약 record의 Jackson 3 어노테이션(@JsonNaming)을 무시한다.
// jsonb도 API와 같은 Boot JsonMapper로 직렬화하게 고정한다.
@Configuration(proxyBeanMethods = false)
class JpaJsonConfig {

	@Bean
	HibernatePropertiesCustomizer jsonFormatMapper(JsonMapper jsonMapper) {
		return properties -> properties.put(MappingSettings.JSON_FORMAT_MAPPER,
				new Jackson3JsonFormatMapper(jsonMapper));
	}

}
