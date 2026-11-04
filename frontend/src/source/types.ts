import type { SseEvent } from '../contract'

/** 세션 이벤트 흐름. 실제(SSE)와 시연(재생기) 공급원이 같은 모양을 따른다. */
export interface EventStream {
  /** @returns 구독 해제 함수 */
  subscribe(onEvent: (event: SseEvent) => void): () => void
}
