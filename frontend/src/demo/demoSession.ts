// 시연 공급원. 실서비스 코드와 분리되어 있어 backend 연동 후 이 디렉터리만 걷어내면 된다.
import type { MailDraft, Quote, Requirements, SseEvent } from '../contract'
import { FIELD_LABEL, won } from '../format'
import { rank } from '../session/ranking'
import type { DispatchApi, EventStream, InterviewApi } from '../source/types'
import { QUESTIONS, VENDOR_EMAIL } from './fixtures'
import { extractRequirements } from './interview'
import { formScreen } from './screens'
import { AFTER_REQUEST_APPROVED, COLLECT, finalQuotes, REQUEST_DRAFT_ID } from './timeline'

export interface DemoSession {
  interview: InterviewApi
  events: EventStream
  dispatch: DispatchApi
  startCollection(): void
}

type Schedule = (run: () => void, delayMs: number) => void

const KIND_TEXT: Record<MailDraft['kind'], string> = {
  request: '견적 요청 메일',
  order: '문의 메일',
  negotiation: '빅딜 메일',
}

export function createDemoSession(
  schedule: Schedule = (run, ms) => void setTimeout(run, ms),
  stepMs = 900,
): DemoSession {
  const listeners = new Set<(event: SseEvent) => void>()
  const drafts = new Map<string, MailDraft>([[REQUEST_DRAFT_ID, requestDraft()]])
  const queue: SseEvent[] = []
  let playing = false
  let item = ''
  let requirements: Requirements | null = null
  let count = 0

  const emit = (event: SseEvent) => listeners.forEach((listener) => listener(event))

  /** 재생 큐: 한 줄씩 stepMs 간격으로 보낸다. 재생 중에 추가되면 뒤에 이어 붙는다. */
  function pump() {
    const next = queue.shift()
    if (next === undefined) {
      playing = false
      return
    }
    playing = true
    schedule(() => {
      emit(next)
      pump()
    }, stepMs)
  }

  function play(events: SseEvent[]) {
    queue.push(...events)
    if (!playing) pump()
  }

  return {
    interview: {
      async start(requested) {
        item = requested
        return { session_id: 'demo-session', questions: QUESTIONS }
      },
      async answer(_sessionId, answers) {
        requirements = extractRequirements(item, answers)
        return requirements
      },
    },
    events: {
      subscribe(onEvent) {
        listeners.add(onEvent)
        return () => listeners.delete(onEvent)
      },
    },
    dispatch: {
      async requestDraft(vendor, kind) {
        const quote = finalQuotes().find((q) => q.vendor === vendor)!
        count += 1
        if (kind === 'order' && quote.channel === 'web') {
          formFilled(quote, requirements, count).forEach(emit)
          return
        }
        const draft = kind === 'negotiation' ? negotiationDraft(quote, count) : orderDraft(quote, requirements, count)
        drafts.set(draft.draft_id, draft)
        emit({ type: 'log', text: `${KIND_TEXT[kind]} 초안을 작성했습니다. 미리보기를 확인하고 승인하세요`, vendor })
        emit({ type: 'approval_required', kind: 'send_mail', draft_id: draft.draft_id })
      },
      async getDraft(draftId) {
        return drafts.get(draftId)!
      },
      async approve(draftId) {
        if (draftId === REQUEST_DRAFT_ID) {
          play(AFTER_REQUEST_APPROVED)
          return
        }
        const draft = drafts.get(draftId)!
        emit({ type: 'log', text: `${KIND_TEXT[draft.kind]} 발송 완료 (${draft.to})`, vendor: draft.vendor })
      },
    },
    startCollection() {
      play(COLLECT)
    },
  }
}

function requestDraft(): MailDraft {
  return {
    draft_id: REQUEST_DRAFT_ID,
    kind: 'request',
    vendor: 'A업체',
    to: VENDOR_EMAIL['A업체'],
    subject: '[견적 요청] 주문제작 도어락',
    body: '안녕하세요. 주문제작 도어락 견적을 요청드립니다.\n수량·희망 납기·설치 조건은 요구 조건을 참고해 주시고, 설치비·배송비·A/S 기간도 함께 적어 주시면 감사하겠습니다.',
    citations: [],
  }
}

function orderDraft(quote: Quote, req: Requirements | null, n: number): MailDraft {
  const missing = quote.missing_fields.map((f) => FIELD_LABEL[f]).join(', ')
  return {
    draft_id: `draft-order-${n}`,
    kind: 'order',
    vendor: quote.vendor,
    to: VENDOR_EMAIL[quote.vendor],
    subject: `[문의] ${req?.item || '주문제작 도어락'} 견적 확인`,
    body: `안녕하세요. 보내주신 견적 ${won(quote.total_price!)} 잘 받았습니다.\n발주 전에 ${missing || '최종 조건'}을(를) 확인 부탁드립니다.`,
    citations: [],
  }
}

/** 빅딜 걸기: 보정 총액이 가장 낮은 다른 업체 수치를 근거로 협상한다. 수치는 저장된 견적에서만 (도메인 규칙 6). */
function negotiationDraft(target: Quote, n: number): MailDraft {
  const rival = rank(
    finalQuotes().filter((q) => q.vendor !== target.vendor),
    'adjusted_total',
  )[0]
  const install = rival.install_included ? '설치 포함' : '설치 별도'
  return {
    draft_id: `draft-negotiation-${n}`,
    kind: 'negotiation',
    vendor: target.vendor,
    to: VENDOR_EMAIL[target.vendor],
    subject: '[견적 문의] 주문제작 도어락 가격 조정 요청',
    body: `안녕하세요. 보내주신 견적 잘 받았습니다.\n${rival.vendor}는 ${install} ${won(rival.adjusted_total!)}을 제시했습니다. 설치비 등 조정이 가능할지 문의드립니다.`,
    citations: [
      { vendor: rival.vendor, field: 'adjusted_total', value: rival.adjusted_total! },
      { vendor: rival.vendor, field: 'install_included', value: rival.install_included! },
    ],
  }
}

function formFilled(quote: Quote, req: Requirements | null, n: number): SseEvent[] {
  const domain = new URL(quote.sources[0].ref).host
  const install = req?.need_install
  const rows: [string, string][] = [
    ['품목', req?.item || '주문제작 도어락'],
    ['수량', req?.quantity ? `${req.quantity}개` : '비워 둠 (미확인)'],
    ['희망 납기', req?.due_date ?? '비워 둠 (미확인)'],
    ['설치', install === true ? '필요' : install === false ? '불필요' : '비워 둠 (미확인)'],
  ]
  return [
    { type: 'log', text: '주문 폼 작성 중 — 제출 버튼은 누르지 않습니다', vendor: quote.vendor },
    { type: 'browser', vendor: quote.vendor, screenshot_url: formScreen(quote.vendor, domain, rows) },
    { type: 'approval_required', kind: 'submit_form', draft_id: `form-${n}` },
  ]
}
