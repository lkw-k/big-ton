package com.doldari;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.doldari.contract.Adjustment;
import com.doldari.contract.AdjustmentStatus;
import com.doldari.contract.ApprovalKind;
import com.doldari.contract.Channel;
import com.doldari.contract.Quote;
import com.doldari.contract.QuoteField;
import com.doldari.contract.Requirements;
import com.doldari.contract.Source;
import com.doldari.contract.SourceField;
import com.doldari.contract.SourceType;
import com.doldari.contract.SseEvent;
import com.doldari.event.EventLog;
import com.doldari.event.EventLogRepository;
import com.doldari.quote.QuoteRecord;
import com.doldari.quote.QuoteRepository;
import com.doldari.session.Session;
import com.doldari.session.SessionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

// 운영과 같은 컨텍스트(JsonMapper·Hibernate 설정)로 실제 Postgres 컨테이너에서 Flyway V1을 돌리고 ddl-auto: validate로 대조한다.
@SpringBootTest
@Transactional
@Import(TestcontainersConfiguration.class)
class PersistenceTest {

	@Autowired
	private SessionRepository sessions;

	@Autowired
	private QuoteRepository quotes;

	@Autowired
	private EventLogRepository events;

	@Autowired
	private EntityManager em;

	@Autowired
	private JdbcTemplate jdbc;

	private UUID sessionId;

	@BeforeEach
	void createSession() {
		sessionId = sessions.saveAndFlush(new Session()).getId();
	}

	@Test
	void requirementsWithNullFieldsSurviveReload() {
		Requirements requirements = new Requirements("주문제작 도어락", 1500000L, LocalDate.of(2026, 12, 1), true, 10,
				null);
		sessions.findById(sessionId).orElseThrow().setRequirements(requirements);
		em.flush();
		em.clear();

		assertThat(sessions.findById(sessionId).orElseThrow().getRequirements()).isEqualTo(requirements);
	}

	@Test
	void quoteKeepsNullKeysInJsonb() {
		Quote quote = quote("A업체", 1200000L);
		Long id = quotes.saveAndFlush(new QuoteRecord(sessionId, quote)).getId();
		em.clear();

		QuoteRecord reloaded = quotes.findById(id).orElseThrow();
		assertThat(reloaded.getData()).isEqualTo(quote);
		assertThat(reloaded.getVendor()).isEqualTo("A업체");
		String warrantyType = jdbc.queryForObject("select jsonb_typeof(data->'warranty_months') from quote where id = ?",
				String.class, id);
		assertThat(warrantyType).isEqualTo("null");
	}

	@Test
	void sameVendorTwiceInSessionIsRejected() {
		quotes.saveAndFlush(new QuoteRecord(sessionId, quote("A업체", 1200000L)));

		assertThatThrownBy(() -> quotes.saveAndFlush(new QuoteRecord(sessionId, quote("A업체", 1000000L))))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void replacingQuoteKeepsLatestValueInSingleRow() {
		quotes.saveAndFlush(new QuoteRecord(sessionId, quote("A업체", 1200000L)));
		em.clear();

		Quote latest = quote("A업체", 1100000L);
		quotes.findBySessionIdAndVendor(sessionId, "A업체").orElseThrow().replace(latest);
		em.flush();
		em.clear();

		assertThat(quotes.findBySessionIdAndVendor(sessionId, "A업체").orElseThrow().getData()).isEqualTo(latest);
		assertThat(jdbc.queryForObject("select count(*) from quote where session_id = ?", Integer.class, sessionId))
			.isEqualTo(1);
	}

	@Test
	void replacingWithOtherVendorIsRejected() {
		QuoteRecord record = new QuoteRecord(sessionId, quote("A업체", 1200000L));

		assertThatThrownBy(() -> record.replace(quote("B업체", 1000000L))).isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void sseEventsRestoreInOrder() {
		List<SseEvent> all = List.of(new SseEvent.Step(2), new SseEvent.Log("B업체 사이트에서 납기 확인 중", "B"),
				new SseEvent.Browser("B", "/screenshots/b-1.png"), new SseEvent.QuoteUpdate("A", quote("A업체", 1200000L)),
				new SseEvent.AdjustmentEvent("A", "설치비", 150000L, AdjustmentStatus.CONFIRMED),
				new SseEvent.ApprovalRequired(ApprovalKind.SEND_MAIL, "draft-1"));
		all.forEach(event -> events.save(new EventLog(sessionId, event)));
		em.flush();
		em.clear();

		assertThat(events.findBySessionIdOrderByIdAsc(sessionId)).extracting(EventLog::getPayload)
			.containsExactlyElementsOf(all);
	}

	private static Quote quote(String vendor, Long totalPrice) {
		return new Quote(vendor, Channel.WEB, totalPrice, 14, null, 50000L, null,
				List.of(QuoteField.INSTALL_INCLUDED, QuoteField.WARRANTY_MONTHS),
				List.of(new Adjustment("설치비", 150000L, AdjustmentStatus.CONFIRMED)), totalPrice + 150000L,
				List.of(new Source(SourceField.TOTAL_PRICE, SourceType.URL, "https://a-vendor.example/quote", null)));
	}

}
