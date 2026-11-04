package com.doldari.schema;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.networknt.schema.Schema;
import com.networknt.schema.SchemaLocation;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SpecificationVersion;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

/**
 * 루트 schema/*.schema.json(빌드 시 classpath:schema/로 복사)으로 외부 입력을 검증한다. 레코드 역직렬화가 못 잡는 키 누락·추가 속성까지 잡는다.
 */
@Component
public class JsonSchemaValidator {

	private static final String ID_PREFIX = "https://doldari.local/schema/";

	private final SchemaRegistry registry = SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_2020_12,
			builder -> builder.schemaIdResolvers(resolvers -> resolvers.mapPrefix(ID_PREFIX, "classpath:schema/")));

	private final Map<String, Schema> schemas = new ConcurrentHashMap<>();

	/** @return 위반 메시지 목록. 비어 있으면 통과. */
	public List<String> validate(String schemaName, JsonNode instance) {
		Schema schema = schemas.computeIfAbsent(schemaName,
				name -> registry.getSchema(SchemaLocation.of(ID_PREFIX + name + ".schema.json")));
		return schema
			.validate(instance, context -> context.executionConfig(config -> config.formatAssertionsEnabled(true)))
			.stream()
			.map(error -> error.getInstanceLocation() + " " + error.getMessage())
			.toList();
	}

}
