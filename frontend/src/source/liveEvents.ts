import type { SseEvent } from '../contract'
import type { EventStream } from './types'

/** backend SSE(GET /api/sessions/{id}/events) 구독. backend가 스키마 검증 후 중계하므로 여기서는 파싱만 한다. */
export function createLiveEvents(sessionId: string, EventSourceImpl: typeof EventSource = EventSource): EventStream {
  return {
    subscribe(onEvent) {
      const source = new EventSourceImpl(`/api/sessions/${sessionId}/events`)
      source.onmessage = (message: MessageEvent<string>) => onEvent(JSON.parse(message.data) as SseEvent)
      return () => source.close()
    },
  }
}
