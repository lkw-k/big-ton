package com.doldari.event;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {

	List<EventLog> findBySessionIdOrderByIdAsc(UUID sessionId);

}
