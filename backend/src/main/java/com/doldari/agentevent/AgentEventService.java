package com.doldari.agentevent;

import com.doldari.contract.AgentEvent;
import com.doldari.event.EventPublisher;
import com.doldari.session.SessionRepository;
import org.springframework.stereotype.Service;

@Service
public class AgentEventService {

	private final SessionRepository sessions;

	private final EventPublisher publisher;

	public AgentEventService(SessionRepository sessions, EventPublisher publisher) {
		this.sessions = sessions;
		this.publisher = publisher;
	}

	/** @return 세션이 없으면 false */
	public boolean relay(AgentEvent agentEvent) {
		if (!sessions.existsById(agentEvent.sessionId())) {
			return false;
		}
		publisher.publish(agentEvent.sessionId(), agentEvent.event());
		return true;
	}

}
