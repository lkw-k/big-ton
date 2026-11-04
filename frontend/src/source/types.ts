import type { Answer, CreateSessionResponse, MailDraft, Requirements, SseEvent } from '../contract'

/**
 * 발송 API (spec §4.6, §4.8). 초안을 요청하면 공급원이 approval_required 이벤트를 보내고,
 * 화면은 미리보기를 보여 준 뒤 사용자가 승인해야만 approve를 호출한다.
 */
export interface DispatchApi {
  requestDraft(vendor: string, kind: 'order' | 'negotiation'): Promise<void>
  getDraft(draftId: string): Promise<MailDraft>
  approve(draftId: string): Promise<void>
}

/** 인터뷰 API (backend 2-3). */
export interface InterviewApi {
  start(item: string): Promise<CreateSessionResponse>
  answer(sessionId: string, answers: Answer[]): Promise<Requirements>
}

/** 세션 이벤트 흐름. 실제(SSE)와 시연(재생기) 공급원이 같은 모양을 따른다. */
export interface EventStream {
  /** @returns 구독 해제 함수 */
  subscribe(onEvent: (event: SseEvent) => void): () => void
}
