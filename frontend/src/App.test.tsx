import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import App from './App'
import { finalQuotes } from './demo/timeline'
import { createEnvironment } from './environment'
import { won } from './format'

// 시연 재생을 테스트가 직접 진행시키는 스케줄러.
function manualClock() {
  const tasks: (() => void)[] = []
  return {
    schedule: (run: () => void) => void tasks.push(run),
    async runAll() {
      await act(async () => {
        while (tasks.length > 0) tasks.shift()!()
      })
    },
    async runUntil(done: () => boolean) {
      while (!done() && tasks.length > 0) {
        await act(async () => tasks.shift()!())
      }
    },
  }
}

const chartOrder = () =>
  within(screen.getByRole('list', { name: '업체별 실제 예상 비용' }))
    .getAllByRole('heading')
    .map((h) => h.textContent)

async function chatInterview() {
  fireEvent.click(screen.getByRole('button', { name: '주문제작 도어락' }))
  for (const answer of ['150만원', '2026-12-01까지', '네, 설치도 필요해요', '10개', '잘 모르겠어요']) {
    fireEvent.click(await screen.findByRole('button', { name: answer }))
  }
  await screen.findByRole('list', { name: '요구 조건' })
  fireEvent.click(screen.getByRole('button', { name: '이대로 견적 모으기' }))
}

describe('시연 시나리오 (spec §11)', () => {
  test('첫 화면: 서비스 이름, 시연 모드, 이용 방법 안내, 챗봇 인사', () => {
    render(<App environment={() => createEnvironment('', manualClock().schedule)} />)

    expect(screen.getByRole('heading', { name: '돌다리' })).toBeInTheDocument()
    expect(screen.getByText('시연 모드')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '이렇게 진행돼요' })).toBeInTheDocument()
    expect(screen.getByText(/어떤 물건의 견적이 필요하세요/)).toBeInTheDocument()
  })

  test('챗봇 인터뷰 → 견적 모으기 → A 1등 → 숨은 비용 → A 3등 → 추천 → 빅딜 메일 → 주문서 제출 직전', async () => {
    const clock = manualClock()
    const openAgentWindow = vi.fn()
    render(<App environment={() => createEnvironment('', clock.schedule)} openAgentWindow={openAgentWindow} />)

    await chatInterview()
    await clock.runAll()

    // 2단계: 웹 견적은 들어왔고, 메일 업체(A)는 내가 요청 메일을 보내야 진행된다.
    expect(screen.getByRole('heading', { name: '업체에 보낼 견적 요청 메일을 확인해 주세요' })).toBeInTheDocument()
    const progress = screen.getByRole('region', { name: '업체별 진행 상황' })
    expect(within(progress).getAllByText(/견적 받음/)).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'AI 작업 화면 새 창에서 크게 보기' }))
    expect(openAgentWindow).toHaveBeenCalledTimes(1)

    const mails = screen.getByRole('region', { name: '내 확인이 필요한 메일' })
    expect(await within(mails).findByText('[견적 요청] 주문제작 도어락')).toBeInTheDocument()
    fireEvent.click(within(mails).getByRole('button', { name: '보내기' }))
    expect(await within(mails).findByText('보냄')).toBeInTheDocument()

    // A 회신 도착 직후 비교 결과로 넘어가고, 견적서 금액 기준 A업체 1등.
    await clock.runUntil(() => screen.queryAllByRole('list', { name: '업체별 실제 예상 비용' }).length > 0 && chartOrder().length === 3)
    expect(chartOrder()).toEqual(['A업체', 'C업체', 'B업체'])

    // 숨은 비용이 붙은 뒤 A업체 3등, B업체 추천.
    await clock.runAll()
    expect(chartOrder()).toEqual(['B업체', 'C업체', 'A업체'])
    expect(within(screen.getByRole('region', { name: '추천' })).getByRole('heading', { name: 'B업체' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'A업체 확인 질문' })).toBeInTheDocument()

    // 4단계: 추천 업체가 미리 골라져 있고, A업체를 골라 빅딜을 건다.
    fireEvent.click(screen.getByRole('button', { name: 'B업체에 연락하기' }))
    expect(screen.getByRole('radio', { name: /B업체/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /A업체/ }))
    fireEvent.click(screen.getByRole('button', { name: /빅딜 걸기/ }))

    const outbox = await screen.findByRole('region', { name: '보낼 메일' })
    const negotiation = await within(outbox).findByRole('article', { name: 'A업체 메일 초안' })
    const rivalB = finalQuotes().find((q) => q.vendor === 'B업체')!
    expect(within(negotiation).getByText(`B업체 실제 예상 비용 ${won(rivalB.adjusted_total!)}`)).toBeInTheDocument()
    expect(within(negotiation).queryByText('보냄')).not.toBeInTheDocument()
    fireEvent.click(within(negotiation).getByRole('button', { name: '보내기' }))
    expect(await within(negotiation).findByText('보냄')).toBeInTheDocument()

    // 웹사이트 업체는 주문서를 제출 직전까지만 채운다.
    fireEvent.click(screen.getByRole('radio', { name: /C업체/ }))
    fireEvent.click(screen.getByRole('button', { name: '문의 메일 쓰기' }))
    await waitFor(() => expect(screen.getByText(/제출 직전까지 채워 뒀어요/)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /제출/ })).not.toBeInTheDocument()

    // 끝난 단계는 다시 볼 수 있다.
    fireEvent.click(within(screen.getByRole('list', { name: '진행 단계' })).getByRole('button', { name: /비교 결과/ }))
    expect(screen.getByRole('list', { name: '업체별 실제 예상 비용' })).toBeInTheDocument()
  })
})
