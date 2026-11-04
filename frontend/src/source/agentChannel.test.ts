import { describe, expect, test } from 'vitest'
import type { SseEvent } from '../contract'
import { relayToAgentWindow, watchFromAgentWindow, type ChannelLike } from './agentChannel'
import type { EventStream } from './types'

/** 같은 이름의 채널끼리 메시지를 주고받는 BroadcastChannel 대역 (자기 자신에게는 보내지 않음). */
function fakeBus() {
  const channels = new Set<ChannelLike>()
  return () => {
    const channel: ChannelLike = {
      onmessage: null,
      postMessage(data) {
        channels.forEach((other) => other !== channel && other.onmessage?.({ data } as MessageEvent))
      },
      close() {
        channels.delete(channel)
      },
    }
    channels.add(channel)
    return channel
  }
}

function pushStream() {
  let push: (event: SseEvent) => void = () => {}
  const stream: EventStream = {
    subscribe(onEvent) {
      push = onEvent
      return () => {}
    },
  }
  return { stream, push: (event: SseEvent) => push(event) }
}

describe('agentChannel', () => {
  test('늦게 연 새 창도 지금까지의 기록을 받고, 이후 이벤트도 이어서 받는다', () => {
    const open = fakeBus()
    const main = pushStream()
    const stopRelay = relayToAgentWindow(main.stream, open)

    main.push({ type: 'step', step: 2 })
    main.push({ type: 'log', text: 'B업체 사이트 접속', vendor: 'B업체' })

    const received: SseEvent[] = []
    const stopWatch = watchFromAgentWindow(open).subscribe((event) => received.push(event))
    main.push({ type: 'browser', vendor: 'B업체', screenshot_url: '/b.png' })

    expect(received).toEqual([
      { type: 'step', step: 2 },
      { type: 'log', text: 'B업체 사이트 접속', vendor: 'B업체' },
      { type: 'browser', vendor: 'B업체', screenshot_url: '/b.png' },
    ])
    stopWatch()
    stopRelay()
  })
})
