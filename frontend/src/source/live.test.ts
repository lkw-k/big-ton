import { describe, expect, test, vi } from 'vitest'
import type { CreateSessionResponse, SseEvent } from '../contract'
import { createLiveEvents } from './liveEvents'
import { createLiveInterview } from './liveInterview'

// EventSource 대역: 테스트가 직접 메시지를 밀어 넣는다.
class FakeEventSource {
  static last: FakeEventSource
  onmessage: ((message: MessageEvent<string>) => void) | null = null
  closed = false
  readonly url: string

  constructor(url: string) {
    this.url = url
    FakeEventSource.last = this
  }

  emit(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  close() {
    this.closed = true
  }
}

const started: CreateSessionResponse = {
  session_id: 's-1',
  questions: [{ field: 'budget', question: '예산은 어느 정도인가요?' }],
}

describe('liveEvents', () => {
  test('세션 SSE를 구독해 이벤트를 넘기고, 해제하면 연결을 닫는다', () => {
    const received: SseEvent[] = []
    const stop = createLiveEvents('s-1', FakeEventSource as unknown as typeof EventSource).subscribe((e) =>
      received.push(e),
    )

    expect(FakeEventSource.last.url).toBe('/api/sessions/s-1/events')
    FakeEventSource.last.emit({ type: 'step', step: 2 })
    expect(received).toEqual([{ type: 'step', step: 2 }])

    stop()
    expect(FakeEventSource.last.closed).toBe(true)
  })
})

describe('liveInterview', () => {
  test('backend 인터뷰 API 경로와 본문으로 호출한다', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(started), { status: 201 }))
    const api = createLiveInterview(fetchMock as unknown as typeof fetch)

    expect(await api.start('도어락')).toEqual(started)
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: '도어락' }),
    })
  })

  test('실패 응답은 상태 코드를 담은 오류가 된다', async () => {
    const api = createLiveInterview((async () => new Response('', { status: 404 })) as unknown as typeof fetch)

    await expect(api.answer('s-x', [])).rejects.toThrow('답변 정리 실패 (상태 404)')
  })
})
