package com.doldari.session;

import java.time.Instant;
import java.util.UUID;

import com.doldari.contract.Requirements;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "session")
public class Session {

	@Id
	private UUID id = UUID.randomUUID();

	/** 인터뷰 전에는 null. */
	@JdbcTypeCode(SqlTypes.JSON)
	private Requirements requirements;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	public UUID getId() {
		return id;
	}

	public Requirements getRequirements() {
		return requirements;
	}

	public void setRequirements(Requirements requirements) {
		this.requirements = requirements;
	}

}
