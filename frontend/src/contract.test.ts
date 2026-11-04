import { expect, test } from 'vitest'
import requirementsJson from '../../schema/examples/valid/requirements.json'
import quoteJson from '../../schema/examples/valid/quote.json'
import followUpJson from '../../schema/examples/valid/follow-up-question.json'
import sseEventsJson from '../../schema/examples/valid/sse-events.json'
import type { FollowUpQuestion, Quote, Requirements, SseEvent } from './contract'

// 아래 리터럴은 tsc가 타입을, 테스트가 schema 예제와의 일치를 검사한다.
const requirements = {
  item: '주문제작 도어락',
  budget: 1500000,
  due_date: '2026-12-01',
  need_install: true,
  quantity: 10,
  notes: null,
} satisfies Requirements

const quote = {
  vendor: 'A업체',
  channel: 'web',
  total_price: 1200000,
  lead_time_days: 14,
  install_included: null,
  shipping_fee: 50000,
  warranty_months: null,
  missing_fields: ['install_included', 'warranty_months'],
  adjustments: [{ label: '설치비', amount: 150000, status: 'confirmed' }],
  adjusted_total: 1350000,
  sources: [
    {
      field: 'total_price',
      type: 'url',
      ref: 'https://a-vendor.example/quote',
      snippet: '총 견적 1,200,000원',
    },
  ],
} satisfies Quote

const followUp = {
  vendor: 'A업체',
  field: 'install_included',
  question: '설치비가 별도인가요?',
} satisfies FollowUpQuestion

const sseEvents = [
  { type: 'step', step: 2 },
  { type: 'log', text: 'B업체 사이트에서 납기 확인 중', vendor: 'B' },
  { type: 'browser', vendor: 'B', screenshot_url: '/screenshots/b-1.png' },
  { type: 'quote_update', vendor: 'A', quote },
  { type: 'adjustment', vendor: 'A', label: '설치비', amount: 150000, status: 'confirmed' },
  { type: 'approval_required', kind: 'send_mail', draft_id: 'draft-1' },
] satisfies SseEvent[]

// 거부되어야 하는 형태. 타입이 받아들이면 @ts-expect-error가 미사용 에러가 되어 빌드가 깨진다.
const { warranty_months: _omitted, ...quoteMissingKey } = quote
export const rejected = [
  // @ts-expect-error adjustment status 누락
  { ...quote, adjustments: [{ label: '설치비', amount: 150000 }] } satisfies Quote,
  // @ts-expect-error status는 confirmed | estimated
  { ...quote, adjustments: [{ label: '설치비', amount: 1, status: 'maybe' }] } satisfies Quote,
  // @ts-expect-error 키 누락 (null과 구분)
  quoteMissingKey satisfies Quote,
  // @ts-expect-error 스키마에 없는 속성
  { ...followUp, extra: 1 } satisfies FollowUpQuestion,
  // @ts-expect-error 알 수 없는 SSE type
  { type: 'progress', percent: 50 } satisfies SseEvent,
]

test('TS 계약 리터럴이 schema 예제와 같다', () => {
  expect(requirements).toEqual(requirementsJson)
  expect(quote).toEqual(quoteJson)
  expect(followUp).toEqual(followUpJson)
  expect(sseEvents).toEqual(sseEventsJson)
})
