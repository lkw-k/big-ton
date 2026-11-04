// spec §11 시나리오를 SSE 이벤트 순서로 만든다. 수치는 fixtures의 Quote에서만 가져온다.
import type { Quote, SseEvent } from '../contract'
import { won } from '../format'
import { rank } from '../session/ranking'
import { initialState, reduce } from '../session/reducer'
import { ADJUSTMENT_NOTE, ADJUSTMENTS, QUOTE_A, QUOTE_B, QUOTE_C } from './fixtures'
import { SCREENS } from './screens'

export const REQUEST_DRAFT_ID = 'draft-request-a'

const log = (text: string, vendor?: string): SseEvent =>
  vendor === undefined ? { type: 'log', text } : { type: 'log', text, vendor }

/** 2단계 수집: A업체 메일은 승인 대기, 그동안 B·C 웹 수집. */
export const COLLECT: SseEvent[] = [
  { type: 'step', step: 2 },
  log('견적 수집을 시작합니다. 메일 1곳(A업체), 웹 2곳(B업체, C업체)'),
  log('견적 요청 메일 초안을 작성했습니다. 발송하려면 승인이 필요합니다', 'A업체'),
  { type: 'approval_required', kind: 'send_mail', draft_id: REQUEST_DRAFT_ID },
  log('사이트 접속, 견적 페이지 탐색 중', 'B업체'),
  { type: 'browser', vendor: 'B업체', screenshot_url: SCREENS.bQuote },
  log('견적 총액·설치·배송·A/S 추출', 'B업체'),
  { type: 'browser', vendor: 'B업체', screenshot_url: SCREENS.bLeadTime },
  log('배송 안내 페이지에서 납기 12일 확인', 'B업체'),
  { type: 'quote_update', vendor: 'B업체', quote: QUOTE_B },
  log('사이트 접속, 견적 페이지 탐색 중', 'C업체'),
  { type: 'browser', vendor: 'C업체', screenshot_url: SCREENS.cQuote },
  log('A/S 기간을 찾지 못했습니다 — 미확인으로 둡니다', 'C업체'),
  { type: 'quote_update', vendor: 'C업체', quote: QUOTE_C },
  log('A업체 메일 승인을 기다리는 중'),
]

/** 요청 메일 승인 후: 회신 도착 → 3·4단계 정리·비교 → 누락 비용 가산 → 5단계 추천. */
export const AFTER_REQUEST_APPROVED: SseEvent[] = [
  log('견적 요청 메일 발송 완료', 'A업체'),
  log('회신 도착 — 본문과 첨부 견적서.pdf 분석 중', 'A업체'),
  { type: 'step', step: 3 },
  log('설치 여부·배송비·A/S 기간이 회신에 없습니다 — 미확인으로 둡니다', 'A업체'),
  { type: 'quote_update', vendor: 'A업체', quote: QUOTE_A },
  { type: 'step', step: 4 },
  log('통일 양식 비교표 완성 — 견적서 표기 총액 기준 A업체 1위'),
  log('빠진 비용을 찾는 중입니다'),
  ...ADJUSTMENTS.flatMap((adjustment): SseEvent[] => [
    log(ADJUSTMENT_NOTE[`${adjustment.vendor} ${adjustment.label}`], adjustment.vendor),
    ...(adjustment.vendor === 'C업체' ? [{ type: 'browser', vendor: 'C업체', screenshot_url: SCREENS.cInstall } as SseEvent] : []),
    adjustment,
  ]),
  { type: 'step', step: 5 },
  { type: 'follow_up', vendor: 'A업체', field: 'install_included', question: '설치가 견적에 포함되어 있나요? 별도라면 비용을 알려 주세요.' },
  { type: 'follow_up', vendor: 'A업체', field: 'shipping_fee', question: '배송비 50,000원이 10개 전체 기준인가요?' },
  { type: 'follow_up', vendor: 'A업체', field: 'warranty_months', question: 'A/S 기간과 연장 비용은 어떻게 되나요?' },
  { type: 'follow_up', vendor: 'C업체', field: 'warranty_months', question: 'A/S 기간은 얼마인가요?' },
  recommendation(),
  { type: 'step', step: 6 },
  log('비교표에서 업체를 고르면 문의 메일을 만들거나 빅딜을 걸 수 있습니다'),
]

/** 시나리오를 끝까지 반영한 견적. 추천 이유·빅딜 초안의 수치는 여기서만 가져온다 (도메인 규칙 6). */
export function finalQuotes(): Quote[] {
  const events: SseEvent[] = [...COLLECT, { type: 'quote_update', vendor: 'A업체', quote: QUOTE_A }, ...ADJUSTMENTS]
  return events.reduce((state, event) => reduce(state, event, ''), initialState).quotes
}

function recommendation(): SseEvent {
  // 점수 계산은 backend 7-2 몫이다. 시연에서는 결과만 고정하고, 이유의 수치는 견적에서 꺼낸다.
  const best = rank(finalQuotes(), 'adjusted_total')[0]
  return {
    type: 'recommendation',
    vendor: best.vendor,
    score: 82,
    reasons: [
      `설치 포함 보정 총액 ${won(best.adjusted_total!)}으로 가장 낮음`,
      `납기 ${best.lead_time_days}일로 요구 납기 충족`,
      `A/S ${best.warranty_months}개월 확인됨 (출처 있음)`,
    ],
  }
}
