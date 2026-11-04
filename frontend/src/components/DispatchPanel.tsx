import { useEffect, useState } from 'react'
import type { Citation, MailDraft } from '../contract'
import { FIELD_LABEL, won } from '../format'
import type { Approval } from '../session/reducer'
import type { DispatchApi } from '../source/types'

interface DispatchPanelProps {
  api: DispatchApi
  approvals: Approval[]
  selectedVendor: string | null
}

/**
 * spec §4.6·§4.8 발송 대기. 메일은 미리보기 → 사용자 승인 후에만 발송(규칙 1).
 * 업체 폼은 제출 직전까지만 채우고 제출은 사용자가 직접 한다 (제출 버튼을 두지 않는다).
 */
export function DispatchPanel({ api, approvals, selectedVendor }: DispatchPanelProps) {
  return (
    <div className="dispatch">
      <div className="dispatch__actions">
        <span className="muted">{selectedVendor ? `선택한 업체: ${selectedVendor}` : '비교표에서 업체를 고르세요'}</span>
        <button
          type="button"
          className="button"
          disabled={selectedVendor === null}
          onClick={() => selectedVendor && void api.requestDraft(selectedVendor, 'order')}
        >
          문의 메일 작성
        </button>
        <button
          type="button"
          className="button button--deal"
          disabled={selectedVendor === null}
          onClick={() => selectedVendor && void api.requestDraft(selectedVendor, 'negotiation')}
        >
          빅딜 걸기
        </button>
      </div>
      {approvals.length === 0 ? (
        <p className="empty">발송 전 확인이 필요한 메일·폼이 여기에 쌓입니다</p>
      ) : (
        <ul className="dispatch__list">
          {approvals.map((approval) => (
            <li key={approval.draft_id}>
              {approval.kind === 'send_mail' ? <MailApproval api={api} draftId={approval.draft_id} /> : <FormStop />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type MailState = { name: 'loading' } | { name: 'preview' } | { name: 'sending' } | { name: 'sent' } | { name: 'error'; message: string }

function MailApproval({ api, draftId }: { api: DispatchApi; draftId: string }) {
  const [draft, setDraft] = useState<MailDraft | null>(null)
  const [state, setState] = useState<MailState>({ name: 'loading' })

  useEffect(() => {
    let active = true
    api
      .getDraft(draftId)
      .then((loaded) => {
        if (!active) return
        setDraft(loaded)
        setState({ name: 'preview' })
      })
      .catch((failure: Error) => active && setState({ name: 'error', message: failure.message }))
    return () => {
      active = false
    }
  }, [api, draftId])

  async function approve() {
    setState({ name: 'sending' })
    try {
      await api.approve(draftId)
      setState({ name: 'sent' })
    } catch (failure) {
      setState({ name: 'error', message: failure instanceof Error ? failure.message : String(failure) })
    }
  }

  if (draft === null) {
    return state.name === 'error' ? <p className="error" role="alert">{state.message}</p> : <p className="muted">초안을 불러오는 중</p>
  }
  return (
    <article className="mail" aria-label={`${draft.vendor} 메일 초안`}>
      <header className="mail__head">
        <span className="chip">{KIND_LABEL[draft.kind]}</span>
        <dl className="mail__meta">
          <dt>받는 사람</dt>
          <dd>{draft.to}</dd>
          <dt>제목</dt>
          <dd>{draft.subject}</dd>
        </dl>
      </header>
      <p className="mail__body">{draft.body}</p>
      {draft.citations.length > 0 && (
        <div className="mail__citations">
          <span className="muted">인용한 수치 (저장된 견적 기준)</span>
          <ul>
            {draft.citations.map((citation) => (
              <li key={`${citation.vendor}-${citation.field}`}>{citationText(citation)}</li>
            ))}
          </ul>
        </div>
      )}
      <footer className="mail__foot">
        {state.name === 'sent' ? (
          <span className="status status--ok">발송됨</span>
        ) : (
          <button type="button" className="button button--primary" disabled={state.name === 'sending'} onClick={() => void approve()}>
            승인하고 발송
          </button>
        )}
        {state.name === 'error' && (
          <p className="error" role="alert">
            {state.message}
          </p>
        )}
      </footer>
    </article>
  )
}

function FormStop() {
  return (
    <article className="form-stop" aria-label="업체 폼 작성">
      <span className="status status--warn">제출 대기</span>
      <p>
        에이전트가 업체 폼을 모두 채우고 제출 직전에서 멈췄습니다. 에이전트 화면에서 내용을 확인한 뒤 업체 페이지에서 직접
        제출하세요.
      </p>
    </article>
  )
}

const KIND_LABEL: Record<MailDraft['kind'], string> = { request: '견적 요청', order: '문의·발주', negotiation: '빅딜' }

const CITATION_FORMAT: Record<Citation['field'], (value: number | boolean) => string> = {
  total_price: (v) => won(v as number),
  adjusted_total: (v) => won(v as number),
  shipping_fee: (v) => won(v as number),
  lead_time_days: (v) => `${v}일`,
  warranty_months: (v) => `${v}개월`,
  install_included: (v) => (v ? '포함' : '별도'),
}

function citationText({ vendor, field, value }: Citation) {
  const label = field === 'adjusted_total' ? '보정 총액' : FIELD_LABEL[field]
  return `${vendor} ${label} ${CITATION_FORMAT[field](value)}`
}
