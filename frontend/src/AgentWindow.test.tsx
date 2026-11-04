import { act, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { SseEvent } from './contract'
import { AgentView } from './AgentWindow'
import type { EventStream } from './source/types'

function pushStream() {
  let push: (event: SseEvent) => void = () => {}
  const stream: EventStream = {
    subscribe(onEvent) {
      push = onEvent
      return () => {}
    },
  }
  return { stream, push: (event: SseEvent) => act(() => push(event)) }
}

describe('AI 작업 보기 새 창', () => {
  test('AI가 보고 있는 화면, 지금 하는 일, 전체 기록을 보여 준다', () => {
    const { stream, push } = pushStream()
    render(<AgentView events={stream} />)

    expect(screen.getByText('AI가 일을 시작하면 여기에 화면이 나타나요')).toBeInTheDocument()

    push({ type: 'step', step: 2 })
    push({ type: 'log', text: '사이트 접속, 견적 페이지 탐색 중', vendor: 'B업체' })
    push({ type: 'browser', vendor: 'B업체', screenshot_url: '/b.png' })
    push({ type: 'log', text: '배송 안내 페이지에서 납기 12일 확인', vendor: 'B업체' })

    expect(screen.getByRole('img', { name: 'B업체 페이지 화면' })).toHaveAttribute('src', '/b.png')
    expect(screen.getByRole('status')).toHaveTextContent('배송 안내 페이지에서 납기 12일 확인')
    expect(screen.getByRole('list', { name: '작업 기록' }).children).toHaveLength(2)
  })

  test('보기 전용이라 보내기·승인·제출 버튼이 없다', () => {
    const { stream, push } = pushStream()
    render(<AgentView events={stream} />)
    push({ type: 'approval_required', kind: 'send_mail', draft_id: 'd1' })

    expect(screen.queryByRole('button', { name: /보내기|승인|제출/ })).not.toBeInTheDocument()
  })
})
