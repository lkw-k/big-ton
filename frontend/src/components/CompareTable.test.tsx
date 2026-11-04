import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { Quote, SseEvent } from '../contract'
import { initialState, reduce } from '../session/reducer'
import { CompareTable } from './CompareTable'

const source = (field: string, ref: string) => ({ field, type: 'url', ref, snippet: null }) as Quote['sources'][number]

const quote = (vendor: string, total: number | null, overrides: Partial<Quote> = {}): Quote => ({
  vendor,
  channel: 'web',
  total_price: total,
  lead_time_days: 14,
  install_included: true,
  shipping_fee: 30000,
  warranty_months: 12,
  missing_fields: [],
  adjustments: [],
  adjusted_total: total,
  sources: ['vendor', 'total_price', 'lead_time_days', 'install_included', 'shipping_fee', 'warranty_months'].map((f) =>
    source(f, `https://${vendor}.example`),
  ),
  ...overrides,
})

const vendorsInOrder = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getByRole('rowheader').textContent ?? '')
    .map((text) => text.replace(/(웹|메일).*$/, ''))

const quotesAfter = (events: SseEvent[]) => events.reduce((s, e) => reduce(s, e, '00:00:00'), initialState).quotes

const initial: SseEvent[] = [
  { type: 'quote_update', vendor: 'A업체', quote: quote('A업체', 1150000, { channel: 'mail' }) },
  { type: 'quote_update', vendor: 'B업체', quote: quote('B업체', 1290000) },
  { type: 'quote_update', vendor: 'C업체', quote: quote('C업체', 1240000) },
]

const adjustments: SseEvent[] = [
  { type: 'adjustment', vendor: 'A업체', label: '설치비', amount: 150000, status: 'estimated' },
  { type: 'adjustment', vendor: 'A업체', label: '배송비', amount: 50000, status: 'confirmed' },
  { type: 'adjustment', vendor: 'C업체', label: '배송비', amount: 50000, status: 'confirmed' },
]

describe('CompareTable', () => {
  test('처음에는 표기 총액 기준으로 A업체가 1등', () => {
    render(<CompareTable quotes={quotesAfter(initial)} />)

    expect(vendorsInOrder()).toEqual(['A업체', 'C업체', 'B업체'])
  })

  test('가산이 들어오면 보정 총액 기준으로 재정렬되어 A업체가 3등이 된다', () => {
    const { rerender } = render(<CompareTable quotes={quotesAfter(initial)} />)

    rerender(<CompareTable quotes={quotesAfter([...initial, ...adjustments])} />)

    expect(vendorsInOrder()).toEqual(['B업체', 'C업체', 'A업체'])
    expect(screen.getByRole('button', { name: '보정 총액' })).toHaveAttribute('aria-pressed', 'true')
    const rowA = screen.getAllByRole('row').find((row) => row.textContent?.includes('A업체'))!
    expect(within(rowA).getByText('1,350,000원')).toBeInTheDocument()
    expect(within(rowA).getByText('추정')).toBeInTheDocument()
    expect(within(rowA).getByText('확정')).toBeInTheDocument()
    expect(within(rowA).getByLabelText('2계단 하락')).toHaveTextContent('▼2')
  })

  test('정렬 기준을 직접 바꿀 수 있다', () => {
    render(<CompareTable quotes={quotesAfter([...initial, ...adjustments])} />)

    fireEvent.click(screen.getByRole('button', { name: '표기 총액' }))

    expect(vendorsInOrder()).toEqual(['A업체', 'C업체', 'B업체'])
  })

  test('모르는 값은 0이 아니라 미확인으로 표시하고, 미확인 총액은 맨 뒤', () => {
    render(
      <CompareTable
        quotes={[
          quote('A업체', 1000000),
          quote('D업체', null, { warranty_months: null, missing_fields: ['total_price', 'warranty_months'] }),
        ]}
      />,
    )

    expect(vendorsInOrder()).toEqual(['A업체', 'D업체'])
    const rowD = screen.getAllByRole('row')[2]
    expect(within(rowD).getAllByText('미확인').length).toBeGreaterThanOrEqual(3)
    expect(within(rowD).queryByText('0원')).not.toBeInTheDocument()
  })

  test('출처가 없는 값은 표시하지 않고 미확인으로 둔다', () => {
    const noLeadTimeSource = quote('A업체', 1000000)
    noLeadTimeSource.sources = noLeadTimeSource.sources.filter((s) => s.field !== 'lead_time_days')
    render(<CompareTable quotes={[noLeadTimeSource]} />)

    expect(screen.queryByText('14일')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '표기 총액 출처' })).toHaveAttribute('href', 'https://A업체.example')
  })
})
