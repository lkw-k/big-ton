package com.doldari.llm;

import java.util.Map;

import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.template.st.StTemplateRenderer;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

/** classpath:prompts/{name}.md를 읽어 변수를 치환한다. */
@Component
public class PromptLoader {

	// 프롬프트에 JSON 예시가 들어가므로 기본 구분자 {} 대신 <변수>를 쓴다.
	private static final StTemplateRenderer RENDERER = StTemplateRenderer.builder()
		.startDelimiterToken('<')
		.endDelimiterToken('>')
		.build();

	private final ResourceLoader resourceLoader;

	public PromptLoader(ResourceLoader resourceLoader) {
		this.resourceLoader = resourceLoader;
	}

	public String render(String name, Map<String, Object> variables) {
		return PromptTemplate.builder()
			.resource(resourceLoader.getResource("classpath:prompts/" + name + ".md"))
			.renderer(RENDERER)
			.build()
			.render(variables);
	}

}
