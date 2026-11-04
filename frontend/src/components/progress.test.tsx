import { act, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { createLiveEvents } from '../source/liveEvents'
import { useSession } from '../session/useSession'
import type { EventStream } from '../source/types'
import { ActivityLog } from './ActivityLog'
import { AgentScreen } from './AgentScreen'
import { StepIndicator } from './StepIndicator'

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

function Progress({ events }: { events: EventStream }) {
  const state = useSession(events)
  return (
    <>
      <StepIndicator step={state.step} />
      <ActivityLog logs={state.logs} />
      <AgentScreen screen={state.screen} />
    </>
  )
}

describe('실시간 진행 표시', () => {
  test('SSE 이벤트를 받으면 단계·로그·에이전트 화면이 갱신된다', () => {
    const events = createLiveEvents('s-1', FakeEventSource as unknown as typeof EventSource)
    render(<Progress events={events} />)

    expect(FakeEventSource.last.url).toBe('/api/sessions/s-1/events')
    expect(screen.getByText('에이전트가 페이지를 열면 여기에 표시됩니다')).toBeInTheDocument()

    act(() => {
      FakeEventSource.last.emit({ type: 'step', step: 2 })
      FakeEventSource.last.emit({ type: 'log', text: 'B업체 사이트에서 납기 확인 중', vendor: 'B업체' })
      FakeEventSource.last.emit({ type: 'browser', vendor: 'B업체', screenshot_url: '/b.png' })
    })

    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('수집')
    expect(screen.getByText('B업체 사이트에서 납기 확인 중')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'B업체 페이지 화면' })).toHaveAttribute('src', '/b.png')
  })

  test('화면이 사라지면 구독을 닫는다', () => {
    const events = createLiveEvents('s-2', FakeEventSource as unknown as typeof EventSource)
    const { unmount } = render(<Progress events={events} />)

    unmount()

    expect(FakeEventSource.last.closed).toBe(true)
  })
})
