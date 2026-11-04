import { useEffect, useState } from 'react'
import type { Citation, MailDraft } from '../contract'
import { FIELD_LABEL, won } from '../format'
import type { Approval } from '../session/reducer'
import type { DispatchApi } from '../source/types'
import { TERMS } from '../ui/terms'

interface ApprovalsProps {
  api: DispatchApi
  approvals: Approval[]
  /** 이미 보낸 초안. 단계 화면을 오가도 "보냄" 상태가 유지되도록 밖에서 들고 있는다. */
  sent: ReadonlySet<string>
  onSent: (draftId: string) => void
}

/**
 * 발송 전 확인 (spec §4.6·§4.8). 메일은 미리보기 → 사용자가 "보내기"를 눌러야만 발송(규칙 1).
 * 업체 폼은 제출 직전까지만 채우고 제출은 사용자가 직접 한다 (제출 버튼을 두지 않는다).
 */
export function Approvals({ api, approvals, sent, onSent }: ApprovalsProps) {
  return (
    <ul className="approvals">
      {approvals.map((approval) => (
        <li key={approval.draft_id}>
          {approval.kind === 'send_mail' ? (
            <MailApproval api={api} draftId={approval.draft_id} sent={sent.has(approval.draft_id)} onSent={onSent} />
          ) : (
            <FormStop />
          )}
        </li>
      ))}
    </ul>
  )
}

type MailState = { name: 'loading' } | { name: 'preview' } | { name: 'sending' } | { name: 'error'; message: string }

function MailApproval({
  api,
  draftId,
  sent,
  onSent,
}: {
  api: DispatchApi
  draftId: string
  sent: boolean
  onSent: (draftId: string) => void
}) {
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

  async function send() {
    setState({ name: 'sending' })
    try {
      await api.approve(draftId)
      onSent(draftId)
      setState({ name: 'preview' })
    } catch (failure) {
      setState({ name: 'error', message: failure instanceof Error ? failure.message : String(failure) })
    }
  }

  if (draft === null) {
    return state.name === 'error' ? (
      <p className="error" role="alert">
        {state.message}
      </p>
    ) : (
      <p className="muted">메일 초안을 불러오는 중이에요</p>
    )
  }
  return (
    <article className={`mail ${sent ? 'is-sent' : ''}`} aria-label={`${draft.vendor} 메일 초안`}>
      <header className="mail__head">
        <span className="tag">{KIND_LABEL[draft.kind]}</span>
        {sent ? <span className="pill pill--ok">보냄</span> : <span className="pill pill--warn">내 확인 필요</span>}
      </header>
      <dl className="mail__meta">
        <dt>받는 사람</dt>
        <dd>{draft.to}</dd>
        <dt>제목</dt>
        <dd>{draft.subject}</dd>
      </dl>
      <p className="mail__body">{draft.body}</p>
      {draft.citations.length > 0 && (
        <div className="mail__citations">
          <span className="muted">근거로 쓴 다른 업체 견적</span>
          <ul>
            {draft.citations.map((citation) => (
              <li key={`${citation.vendor}-${citation.field}`}>{citationText(citation)}</li>
            ))}
          </ul>
        </div>
      )}
      {!sent && (
        <footer className="mail__foot">
          <p className="muted">내용을 확인했다면 보내기를 눌러 주세요. 누르기 전에는 발송되지 않아요.</p>
          <button type="button" className="btn btn--primary" disabled={state.name === 'sending'} onClick={() => void send()}>
            보내기
          </button>
        </footer>
      )}
      {state.name === 'error' && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
    </article>
  )
}

function FormStop() {
  return (
    <article className="form-stop" aria-label="업체 주문서">
      <span className="pill pill--warn">직접 제출 필요</span>
      <p>
        AI가 업체 주문서를 제출 직전까지 채워 뒀어요. AI 작업 화면에서 내용을 확인한 뒤, 업체 페이지에서 직접 제출해
        주세요.
      </p>
    </article>
  )
}

const KIND_LABEL: Record<MailDraft['kind'], string> = {
  request: '견적 요청 메일',
  order: '문의 메일',
  negotiation: '빅딜 메일',
}

const CITATION_FORMAT: Record<Citation['field'], (value: number | boolean) => string> = {
  total_price: (v) => won(v as number),
  adjusted_total: (v) => won(v as number),
  shipping_fee: (v) => won(v as number),
  lead_time_days: (v) => `${v}일`,
  warranty_months: (v) => `${v}개월`,
  install_included: (v) => (v ? '포함' : '별도'),
}

function citationText({ vendor, field, value }: Citation) {
  const label = field === 'adjusted_total' ? TERMS.realCost : FIELD_LABEL[field]
  return `${vendor} ${label} ${CITATION_FORMAT[field](value)}`
}
