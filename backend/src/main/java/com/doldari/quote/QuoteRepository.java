package com.doldari.quote;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<QuoteRecord, Long> {

	Optional<QuoteRecord> findBySessionIdAndVendor(UUID sessionId, String vendor);

}
