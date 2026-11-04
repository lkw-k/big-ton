import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
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

const vendorsInOrder = () =>
  within(screen.getByRole('region', { name: '견적 비교' }))
    .getAllByRole('rowheader')
    .map((th) => within(th).getByRole('button').textContent)

async function finishInterview() {
  fireEvent.change(screen.getByLabelText('필요한 물품'), { target: { value: '주문제작 도어락' } })
  fireEvent.click(screen.getByRole('button', { name: '질문 받기' }))
  fireEvent.change(await screen.findByLabelText('예산은 어느 정도인가요?'), { target: { value: '150만원' } })
  fireEvent.change(screen.getByLabelText('언제까지 필요하신가요?'), { target: { value: '2026-12-01까지' } })
  fireEvent.change(screen.getByLabelText('수량은 몇 개인가요?'), { target: { value: '10개' } })
  fireEvent.click(screen.getByRole('button', { name: '요구 조건 정리' }))
  await screen.findByRole('list', { name: '요구 조건' })
}

describe('시연 시나리오 (spec §11)', () => {
  test('앱 타이틀과 시연 모드 표시', () => {
    render(<App environment={() => createEnvironment('', manualClock().schedule)} />)

    expect(screen.getByRole('heading', { name: '돌다리' })).toBeInTheDocument()
    expect(screen.getByText('시연 모드 · 고정 데이터')).toBeInTheDocument()
  })

  test('인터뷰 → 수집 → A 1등 → 가산 → A 3등 → 확인 질문·추천 → 빅딜 초안 승인 → 폼 제출 직전', async () => {
    const clock = manualClock()
    render(<App environment={() => createEnvironment('', clock.schedule)} />)

    await finishInterview()
    await clock.runAll()

    // 2단계: 웹 견적만 들어오고, A업체는 요청 메일 승인 전이라 아직 없다.
    expect(vendorsInOrder()).toEqual(['C업체', 'B업체'])
    const dispatch = screen.getByRole('region', { name: '발송 대기' })
    expect(within(dispatch).getByText('[견적 요청] 주문제작 도어락')).toBeInTheDocument()

    fireEvent.click(within(dispatch).getByRole('button', { name: '승인하고 발송' }))
    expect(await within(dispatch).findByText('발송됨')).toBeInTheDocument()

    // A업체 회신 도착 직후: 견적서 표기 총액 기준 A업체 1등.
    await clock.runUntil(() => screen.queryByRole('button', { name: 'A업체' }) !== null)
    expect(vendorsInOrder()).toEqual(['A업체', 'C업체', 'B업체'])

    await clock.runAll()

    // 가산 후 보정 총액 기준 A업체 3등.
    expect(vendorsInOrder()).toEqual(['B업체', 'C업체', 'A업체'])
    expect(screen.getByRole('list', { name: 'A업체 확인 질문' })).toBeInTheDocument()
    const recommend = screen.getByRole('region', { name: '추천' })
    expect(within(recommend).getByRole('heading', { name: 'B업체' })).toBeInTheDocument()

    // 빅딜 걸기: 인용 수치는 저장된 견적 값과 같다.
    fireEvent.click(screen.getByRole('button', { name: 'A업체' }))
    fireEvent.click(within(dispatch).getByRole('button', { name: '빅딜 걸기' }))
    await waitFor(() => expect(within(dispatch).getAllByRole('article', { name: 'A업체 메일 초안' })).toHaveLength(2))
    const negotiation = within(dispatch).getAllByRole('article', { name: 'A업체 메일 초안' })[1]
    const rivalB = finalQuotes().find((q) => q.vendor === 'B업체')!
    expect(within(negotiation).getByText(`B업체 보정 총액 ${won(rivalB.adjusted_total!)}`)).toBeInTheDocument()
    expect(within(negotiation).queryByText('발송됨')).not.toBeInTheDocument()

    fireEvent.click(within(negotiation).getByRole('button', { name: '승인하고 발송' }))
    expect(await within(negotiation).findByText('발송됨')).toBeInTheDocument()

    // 웹 업체 문의는 폼을 제출 직전까지만 채운다.
    fireEvent.click(screen.getByRole('button', { name: 'C업체' }))
    fireEvent.click(within(dispatch).getByRole('button', { name: '문의 메일 작성' }))
    expect(await within(dispatch).findByText(/제출 직전에서 멈췄습니다/)).toBeInTheDocument()
    expect(within(dispatch).queryByRole('button', { name: /제출/ })).not.toBeInTheDocument()
  })
})
