// schema/*.schema.json과 같은 계약 타입. 모르는 값은 null(키는 필수), 0 대체 금지.

export type QuoteField =
  | 'total_price'
  | 'lead_time_days'
  | 'install_included'
  | 'shipping_fee'
  | 'warranty_months'

export type AdjustmentStatus = 'confirmed' | 'estimated'

export interface Requirements {
  item: string
  budget: number | null
  due_date: string | null
  need_install: boolean | null
  quantity: number | null
  notes: string | null
}

export interface Adjustment {
  label: string
  amount: number
  status: AdjustmentStatus
}

export interface Source {
  field: QuoteField | 'vendor' | 'adjustments'
  type: 'url' | 'mail' | 'attachment'
  ref: string
  snippet: string | null
}

export interface Quote {
  vendor: string
  channel: 'web' | 'mail'
  total_price: number | null
  lead_time_days: number | null
  install_included: boolean | null
  shipping_fee: number | null
  warranty_months: number | null
  missing_fields: QuoteField[]
  adjustments: Adjustment[]
  adjusted_total: number | null
  sources: Source[]
}

export interface FollowUpQuestion {
  vendor: string
  field: QuoteField
  question: string
}

export type SseEvent =
  | { type: 'step'; step: number }
  | { type: 'log'; text: string; vendor?: string }
  | { type: 'browser'; vendor: string; screenshot_url: string }
  | { type: 'quote_update'; vendor: string; quote: Quote }
  | ({ type: 'adjustment'; vendor: string } & Adjustment)
  | { type: 'approval_required'; kind: 'send_mail' | 'submit_form'; draft_id: string }
  | ({ type: 'follow_up' } & FollowUpQuestion)
  | { type: 'recommendation'; vendor: string; score: number; reasons: string[] }

// schema/interview.schema.json
export type InterviewField = 'budget' | 'due_date' | 'need_install' | 'quantity' | 'notes'

export interface InterviewQuestion {
  field: InterviewField
  question: string
}

export interface CreateSessionRequest {
  item: string
}

export interface CreateSessionResponse {
  session_id: string
  questions: InterviewQuestion[]
}

export interface Answer {
  field: InterviewField
  answer: string | null
}

export interface AnswersRequest {
  answers: Answer[]
}

export interface Citation {
  vendor: string
  field:
    | 'total_price'
    | 'adjusted_total'
    | 'lead_time_days'
    | 'install_included'
    | 'shipping_fee'
    | 'warranty_months'
  value: number | boolean
}

export interface MailDraft {
  draft_id: string
  kind: 'request' | 'order' | 'negotiation'
  vendor: string
  to: string
  subject: string
  body: string
  citations: Citation[]
}
