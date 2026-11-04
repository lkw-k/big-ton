package com.doldari.event;

import java.time.Instant;
import java.util.UUID;

import com.doldari.contract.SseEvent;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "event_log")
public class EventLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private UUID sessionId;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, updatable = false)
	private SseEvent payload;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected EventLog() {
	}

	public EventLog(UUID sessionId, SseEvent payload) {
		this.sessionId = sessionId;
		this.payload = payload;
		this.createdAt = Instant.now();
	}

	public SseEvent getPayload() {
		return payload;
	}

}
