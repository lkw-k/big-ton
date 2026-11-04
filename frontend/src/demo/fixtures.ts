// spec §11 시연 시나리오 고정 데이터. 계약 타입(contract.ts) 그대로 쓴다.
// 모르는 값은 null + missing_fields, 표시하는 값은 모두 sources에 근거가 있다.
import type { CreateSessionResponse, Quote, SseEvent } from '../contract'

export const ITEM_EXAMPLE = '주문제작 도어락'

export const QUESTIONS: CreateSessionResponse['questions'] = [
  { field: 'budget', question: '예산은 어느 정도인가요?' },
  { field: 'due_date', question: '언제까지 필요하신가요?' },
  { field: 'need_install', question: '설치도 필요하신가요?' },
  { field: 'quantity', question: '수량은 몇 개인가요?' },
  { field: 'notes', question: '그 밖에 원하시는 조건이 있나요?' },
]

export const VENDOR_EMAIL: Record<string, string> = {
  'A업체': 'sales@a-vendor.example',
  'B업체': 'order@b-vendor.example',
  'C업체': 'contact@c-vendor.example',
}

const A_MAIL = 'mail://inbox/a-vendor-reply-1'

export const QUOTE_A: Quote = {
  vendor: 'A업체',
  channel: 'mail',
  total_price: 1150000,
  lead_time_days: 15,
  install_included: null,
  shipping_fee: null,
  warranty_months: null,
  missing_fields: ['install_included', 'shipping_fee', 'warranty_months'],
  adjustments: [],
  adjusted_total: 1150000,
  sources: [
    { field: 'vendor', type: 'mail', ref: A_MAIL, snippet: '보낸 사람: A업체 영업팀' },
    { field: 'total_price', type: 'attachment', ref: `${A_MAIL}/견적서.pdf`, snippet: '합계 1,150,000원 (VAT 포함)' },
    { field: 'lead_time_days', type: 'mail', ref: A_MAIL, snippet: '발주 후 15일 이내 납품' },
  ],
}

export const QUOTE_B: Quote = {
  vendor: 'B업체',
  channel: 'web',
  total_price: 1290000,
  lead_time_days: 12,
  install_included: true,
  shipping_fee: 0,
  warranty_months: 24,
  missing_fields: [],
  adjustments: [],
  adjusted_total: 1290000,
  sources: [
    { field: 'vendor', type: 'url', ref: 'https://b-vendor.example', snippet: null },
    { field: 'total_price', type: 'url', ref: 'https://b-vendor.example/quote', snippet: '견적 총액 (10개) 1,290,000원' },
    { field: 'lead_time_days', type: 'url', ref: 'https://b-vendor.example/delivery', snippet: '예상 납기 12일' },
    { field: 'install_included', type: 'url', ref: 'https://b-vendor.example/quote', snippet: '설치 포함' },
    { field: 'shipping_fee', type: 'url', ref: 'https://b-vendor.example/quote', snippet: '배송 무료' },
    { field: 'warranty_months', type: 'url', ref: 'https://b-vendor.example/quote', snippet: 'A/S 24개월' },
  ],
}

export const QUOTE_C: Quote = {
  vendor: 'C업체',
  channel: 'web',
  total_price: 1240000,
  lead_time_days: 14,
  install_included: false,
  shipping_fee: 0,
  warranty_months: null,
  missing_fields: ['warranty_months'],
  adjustments: [],
  adjusted_total: 1240000,
  sources: [
    { field: 'vendor', type: 'url', ref: 'https://c-vendor.example', snippet: null },
    { field: 'total_price', type: 'url', ref: 'https://c-vendor.example/estimate', snippet: '견적 총액 (10개) 1,240,000원' },
    { field: 'lead_time_days', type: 'url', ref: 'https://c-vendor.example/estimate', snippet: '납기 14일' },
    { field: 'install_included', type: 'url', ref: 'https://c-vendor.example/estimate', snippet: '설치 별도 문의' },
    { field: 'shipping_fee', type: 'url', ref: 'https://c-vendor.example/estimate', snippet: '배송비 무료' },
  ],
}

/** 누락 비용 탐색 결과 (spec §4.7). 확정 = 업체 자료에서 확인, 추정 = 기준값. */
export const ADJUSTMENTS: Extract<SseEvent, { type: 'adjustment' }>[] = [
  { type: 'adjustment', vendor: 'A업체', label: '설치비', amount: 150000, status: 'estimated' },
  { type: 'adjustment', vendor: 'C업체', label: '설치비', amount: 100000, status: 'confirmed' },
  { type: 'adjustment', vendor: 'A업체', label: '배송비', amount: 50000, status: 'confirmed' },
  { type: 'adjustment', vendor: 'A업체', label: 'A/S 연장비', amount: 80000, status: 'estimated' },
]

export const ADJUSTMENT_NOTE: Record<string, string> = {
  'A업체 설치비': '설치 조건이 없어 업계 기준값 150,000원으로 추정',
  'C업체 설치비': 'C업체 설치 안내 페이지에서 1식 100,000원 확인',
  'A업체 배송비': 'A업체 견적서 PDF 하단 각주에서 배송비 50,000원 확인',
  'A업체 A/S 연장비': 'A/S 기간 미기재 — 24개월 연장 기준값 80,000원으로 추정',
}
