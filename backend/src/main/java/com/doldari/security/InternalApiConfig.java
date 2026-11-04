package com.doldari.security;

import com.doldari.config.AgentProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class InternalApiConfig {

	@Bean
	FilterRegistrationBean<InternalTokenFilter> internalTokenFilter(AgentProperties properties) {
		FilterRegistrationBean<InternalTokenFilter> registration = new FilterRegistrationBean<>(
				new InternalTokenFilter(properties));
		registration.addUrlPatterns("/internal/*");
		return registration;
	}

}
