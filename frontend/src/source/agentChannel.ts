// 메인 창 ↔ "AI 작업 보기" 새 창 동기화. 메인 창이 받은 세션 이벤트를 그대로 새 창으로 넘긴다.
import type { SseEvent } from '../contract'
import type { EventStream } from './types'

export const AGENT_CHANNEL = 'doldari-agent'

export type ChannelLike = Pick<BroadcastChannel, 'postMessage' | 'close'> & {
  onmessage: ((message: MessageEvent) => void) | null
}
type OpenChannel = () => ChannelLike

type Message = { kind: 'event'; event: SseEvent } | { kind: 'history'; events: SseEvent[] } | { kind: 'hello' }

const openBroadcast: OpenChannel = () => new BroadcastChannel(AGENT_CHANNEL)

/** 메인 창: 세션 이벤트를 새 창으로 보낸다. 새 창이 늦게 열려도 처음부터 보이도록 기록을 쌓아 둔다. */
export function relayToAgentWindow(events: EventStream, open: OpenChannel = openBroadcast): () => void {
  const channel = open()
  const history: SseEvent[] = []
  channel.onmessage = ({ data }: MessageEvent<Message>) => {
    if (data.kind === 'hello') channel.postMessage({ kind: 'history', events: history } satisfies Message)
  }
  const unsubscribe = events.subscribe((event) => {
    history.push(event)
    channel.postMessage({ kind: 'event', event } satisfies Message)
  })
  return () => {
    unsubscribe()
    channel.close()
  }
}

/** 새 창: 메인 창이 넘겨주는 이벤트를 세션 이벤트 흐름처럼 읽는다. */
export function watchFromAgentWindow(open: OpenChannel = openBroadcast): EventStream {
  return {
    subscribe(onEvent) {
      const channel = open()
      channel.onmessage = ({ data }: MessageEvent<Message>) => {
        if (data.kind === 'history') data.events.forEach(onEvent)
        if (data.kind === 'event') onEvent(data.event)
      }
      channel.postMessage({ kind: 'hello' } satisfies Message)
      return () => channel.close()
    },
  }
}
