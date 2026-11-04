import type { FollowUpQuestion, Quote, SseEvent } from '../contract'
import { adjustedTotal } from './adjustedTotal'

export interface LogEntry {
  id: number
  at: string
  text: string
  vendor?: string
}

export interface Recommendation {
  vendor: string
  score: number
  reasons: string[]
}

export interface Approval {
  kind: 'send_mail' | 'submit_form'
  draft_id: string
  /** 요청이 들어온 단계. 수집 중 요청과 연락 단계 요청을 나눠 보여 주는 데 쓴다. */
  step: number
}

export interface SessionState {
  step: number
  logs: LogEntry[]
  screen: { vendor: string; url: string } | null
  quotes: Quote[]
  followUps: FollowUpQuestion[]
  recommendation: Recommendation | null
  approvals: Approval[]
}

export const initialState: SessionState = {
  step: 0,
  logs: [],
  screen: null,
  quotes: [],
  followUps: [],
  recommendation: null,
  approvals: [],
}

/** SSE 이벤트 하나를 세션 상태에 반영한다. at은 수신 시각(표시용). */
export function reduce(state: SessionState, event: SseEvent, at: string): SessionState {
  switch (event.type) {
    case 'step':
      return { ...state, step: event.step }
    case 'log':
      return { ...state, logs: [...state.logs, toLog(state.logs.length, at, event)] }
    case 'browser':
      return { ...state, screen: { vendor: event.vendor, url: event.screenshot_url } }
    case 'quote_update':
      return { ...state, quotes: upsert(state.quotes, event.quote) }
    case 'adjustment':
      return { ...state, quotes: state.quotes.map((q) => (q.vendor === event.vendor ? addAdjustment(q, event) : q)) }
    case 'approval_required':
      return { ...state, approvals: [...state.approvals, { kind: event.kind, draft_id: event.draft_id, step: state.step }] }
    case 'follow_up':
      return {
        ...state,
        followUps: [...state.followUps, { vendor: event.vendor, field: event.field, question: event.question }],
      }
    case 'recommendation':
      return { ...state, recommendation: { vendor: event.vendor, score: event.score, reasons: event.reasons } }
  }
}

function toLog(id: number, at: string, event: { text: string; vendor?: string }): LogEntry {
  return event.vendor === undefined ? { id, at, text: event.text } : { id, at, text: event.text, vendor: event.vendor }
}

function upsert(quotes: Quote[], quote: Quote): Quote[] {
  return quotes.some((q) => q.vendor === quote.vendor)
    ? quotes.map((q) => (q.vendor === quote.vendor ? quote : q))
    : [...quotes, quote]
}

function addAdjustment(quote: Quote, event: Extract<SseEvent, { type: 'adjustment' }>): Quote {
  const adjustments = [...quote.adjustments, { label: event.label, amount: event.amount, status: event.status }]
  return { ...quote, adjustments, adjusted_total: adjustedTotal(quote.total_price, adjustments) }
}
