import { describe, expect, test } from 'vitest'
import type { Quote, SseEvent } from '../contract'
import { adjustedTotal } from './adjustedTotal'
import { rank, rankChanges } from './ranking'
import { initialState, reduce, type SessionState } from './reducer'

const quote = (vendor: string, total: number | null): Quote => ({
  vendor,
  channel: 'web',
  total_price: total,
  lead_time_days: null,
  install_included: null,
  shipping_fee: null,
  warranty_months: null,
  missing_fields: [],
  adjustments: [],
  adjusted_total: total,
  sources: [],
})

const play = (events: SseEvent[]): SessionState =>
  events.reduce((state, event) => reduce(state, event, '14:02:11'), initialState)

describe('adjustedTotal', () => {
  test('표기 총액이 null이면 null', () => {
    expect(adjustedTotal(null, [{ label: '설치비', amount: 1, status: 'confirmed' }])).toBeNull()
  })

  test('확정·추정 모두 합산', () => {
    expect(
      adjustedTotal(1000, [
        { label: '설치비', amount: 150, status: 'confirmed' },
        { label: 'A/S', amount: 30, status: 'estimated' },
      ]),
    ).toBe(1180)
  })
})

describe('reduce', () => {
  test('step·log·browser 이벤트로 진행 상태가 갱신된다', () => {
    const state = play([
      { type: 'step', step: 2 },
      { type: 'log', text: 'B업체 사이트에서 납기 확인 중', vendor: 'B업체' },
      { type: 'browser', vendor: 'B업체', screenshot_url: '/b.png' },
    ])

    expect(state.step).toBe(2)
    expect(state.logs).toEqual([
      { id: 0, at: '14:02:11', text: 'B업체 사이트에서 납기 확인 중', vendor: 'B업체' },
    ])
    expect(state.screen).toEqual({ vendor: 'B업체', url: '/b.png' })
  })

  test('quote_update는 업체별로 교체된다', () => {
    const state = play([
      { type: 'quote_update', vendor: 'A업체', quote: quote('A업체', 100) },
      { type: 'quote_update', vendor: 'A업체', quote: quote('A업체', 90) },
    ])

    expect(state.quotes).toEqual([quote('A업체', 90)])
  })

  test('adjustment는 해당 견적에 가산되고 보정 총액이 다시 계산된다', () => {
    const state = play([
      { type: 'quote_update', vendor: 'A업체', quote: quote('A업체', 1000) },
      { type: 'adjustment', vendor: 'A업체', label: '설치비', amount: 150, status: 'estimated' },
    ])

    expect(state.quotes[0].adjustments).toEqual([
      { label: '설치비', amount: 150, status: 'estimated' },
    ])
    expect(state.quotes[0].adjusted_total).toBe(1150)
  })

  test('표기 총액이 미확인이면 가산해도 보정 총액은 미확인', () => {
    const state = play([
      { type: 'quote_update', vendor: 'C업체', quote: quote('C업체', null) },
      { type: 'adjustment', vendor: 'C업체', label: '설치비', amount: 150, status: 'confirmed' },
    ])

    expect(state.quotes[0].adjusted_total).toBeNull()
  })

  test('확인 질문·추천·승인 요청이 쌓인다', () => {
    const state = play([
      { type: 'follow_up', vendor: 'A업체', field: 'install_included', question: '설치 포함인가요?' },
      { type: 'recommendation', vendor: 'B업체', score: 82, reasons: ['설치 포함'] },
      { type: 'approval_required', kind: 'send_mail', draft_id: 'd1' },
    ])

    expect(state.followUps).toEqual([
      { vendor: 'A업체', field: 'install_included', question: '설치 포함인가요?' },
    ])
    expect(state.recommendation).toEqual({ vendor: 'B업체', score: 82, reasons: ['설치 포함'] })
    expect(state.approvals).toEqual([{ kind: 'send_mail', draft_id: 'd1', step: 0 }])
  })
})

describe('ranking', () => {
  const quotes = [quote('A업체', 1200), quote('C업체', null), quote('B업체', 1250)]

  test('금액 오름차순, 미확인은 맨 뒤', () => {
    expect(rank(quotes, 'total_price').map((q) => q.vendor)).toEqual(['A업체', 'B업체', 'C업체'])
  })

  test('순위 변화: 올라가면 양수, 내려가면 음수', () => {
    expect(rankChanges(['A업체', 'B업체', 'C업체'], ['B업체', 'C업체', 'A업체'])).toEqual({
      'A업체': -2,
      'B업체': 1,
      'C업체': 1,
    })
  })
})
