package com.doldari.quote;

import java.time.Instant;
import java.util.UUID;

import com.doldari.contract.Quote;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "quote")
public class QuoteRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private UUID sessionId;

	/** data.vendor()에서만 파생한다. 직접 설정하지 않는다. */
	@Column(nullable = false, updatable = false)
	private String vendor;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false)
	private Quote data;

	@Column(nullable = false)
	private Instant updatedAt;

	protected QuoteRecord() {
	}

	public QuoteRecord(UUID sessionId, Quote data) {
		this.sessionId = sessionId;
		this.vendor = data.vendor();
		this.data = data;
		this.updatedAt = Instant.now();
	}

	/** 같은 업체의 최신 견적으로 교체한다. */
	public void replace(Quote latest) {
		if (!vendor.equals(latest.vendor())) {
			throw new IllegalArgumentException("업체가 다른 견적으로 교체할 수 없다: " + vendor + " → " + latest.vendor());
		}
		this.data = latest;
		this.updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getVendor() {
		return vendor;
	}

	public Quote getData() {
		return data;
	}

}
