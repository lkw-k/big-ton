import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { Quote } from '../contract'
import { CostChart } from './CostChart'

const quote = (vendor: string, total: number | null, adjustments: Quote['adjustments'] = []): Quote => ({
  vendor,
  channel: 'web',
  total_price: total,
  lead_time_days: null,
  install_included: null,
  shipping_fee: null,
  warranty_months: null,
  missing_fields: [],
  adjustments,
  adjusted_total: total === null ? null : total + adjustments.reduce((s, a) => s + a.amount, 0),
  sources: [{ field: 'total_price', type: 'url', ref: `https://${vendor}.example`, snippet: null }],
})

const quotes = [
  quote('A업체', 1000000, [
    { label: '설치비', amount: 300000, status: 'estimated' },
    { label: '배송비', amount: 100000, status: 'confirmed' },
  ]),
  quote('B업체', 1200000),
  quote('D업체', null),
]

const rows = () =>
  within(screen.getByRole('list', { name: '업체별 실제 예상 비용' }))
    .getAllByRole('listitem')
    .map((row) => within(row).getByRole('heading').textContent)
const width = (el: HTMLElement) => parseFloat(el.style.width)

describe('CostChart', () => {
  test('실제 예상 비용이 낮은 순서로 막대가 놓이고, 금액을 모르는 업체는 맨 아래', () => {
    render(<CostChart quotes={quotes} budget={null} />)

    expect(rows()).toEqual(['B업체', 'A업체', 'D업체'])
  })

  test('막대 조각 길이는 금액에 비례하고, 끝에 실제 예상 비용이 적혀 있다', () => {
    render(<CostChart quotes={quotes} budget={null} />)
    const rowA = screen.getByRole('listitem', { name: 'A업체' })

    const base = within(rowA).getByLabelText('견적서 금액 1,000,000원')
    const install = within(rowA).getByLabelText('설치비 300,000원 (추정치)')
    const shipping = within(rowA).getByLabelText('배송비 100,000원 (확인됨)')
    expect(width(base) / width(install)).toBeCloseTo(1000000 / 300000, 5)
    expect(width(install) / width(shipping)).toBeCloseTo(3, 5)
    expect(within(rowA).getByText('1,400,000원')).toBeInTheDocument()
  })

  test('추정치 조각은 무늬로도 구분된다 (색만으로 구분하지 않음)', () => {
    render(<CostChart quotes={quotes} budget={null} />)

    expect(screen.getByLabelText('설치비 300,000원 (추정치)')).toHaveClass('seg--estimated')
    expect(screen.getByLabelText('배송비 100,000원 (확인됨)')).toHaveClass('seg--confirmed')
  })

  test('금액을 모르는 업체는 막대를 0으로 그리지 않고 확인 안 됨으로 표시한다', () => {
    render(<CostChart quotes={quotes} budget={null} />)
    const rowD = screen.getByRole('listitem', { name: 'D업체' })

    expect(within(rowD).getByText('견적서 금액 확인 안 됨')).toBeInTheDocument()
    expect(within(rowD).queryByLabelText(/견적서 금액 \d/)).not.toBeInTheDocument()
  })

  test('예산 기준선을 보여 준다', () => {
    render(<CostChart quotes={quotes} budget={1500000} />)

    expect(screen.getByText('예산 1,500,000원')).toBeInTheDocument()
  })
})
