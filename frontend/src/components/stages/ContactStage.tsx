import { useState } from 'react'
import { won } from '../../format'
import { rank } from '../../session/ranking'
import type { SessionState } from '../../session/reducer'
import type { DispatchApi } from '../../source/types'
import { TERMS } from '../../ui/terms'
import { Approvals } from '../Approvals'
import { NextAction } from '../NextAction'

interface ContactStageProps {
  session: SessionState
  dispatch: DispatchApi
  sent: ReadonlySet<string>
  onSent: (draftId: string) => void
}

/** 4단계: 업체를 골라 문의하거나 빅딜(다른 업체 견적으로 가격 협상)을 건다. */
export function ContactStage({ session, dispatch, sent, onSent }: ContactStageProps) {
  const [vendor, setVendor] = useState<string | null>(session.recommendation?.vendor ?? null)
  const approvals = session.approvals.filter((a) => a.step > 2).reverse()

  return (
    <div className="stage">
      <NextAction
        title="연락할 업체를 고르고, 연락 방법을 선택하세요"
        detail="AI가 메일 초안을 써 드려요. 내용을 확인하고 보내기를 눌러야 발송돼요."
      />

      <section className="card" aria-label="업체 고르기">
        <div className="pick" role="radiogroup" aria-label="연락할 업체">
          {rank(session.quotes, 'adjusted_total').map((q) => (
            <button
              key={q.vendor}
              type="button"
              role="radio"
              aria-checked={vendor === q.vendor}
              className="pick__option"
              onClick={() => setVendor(q.vendor)}
            >
              <span className="pick__name">
                {q.vendor}
                {q.vendor === session.recommendation?.vendor && <span className="pill pill--ok">추천</span>}
              </span>
              <span className="pick__cost">
                {TERMS.realCost} {q.adjusted_total === null ? TERMS.unknown : won(q.adjusted_total)}
              </span>
              <span className="muted">{q.channel === 'web' ? '웹사이트 주문서로 연락' : '메일로 연락'}</span>
            </button>
          ))}
        </div>
        <div className="contact-actions">
          <button
            type="button"
            className="btn btn--primary btn--lg"
            disabled={vendor === null}
            onClick={() => vendor && void dispatch.requestDraft(vendor, 'order')}
          >
            문의 메일 쓰기
          </button>
          <button
            type="button"
            className="btn btn--deal btn--lg"
            disabled={vendor === null}
            onClick={() => vendor && void dispatch.requestDraft(vendor, 'negotiation')}
          >
            빅딜 걸기
            <small>다른 업체 견적으로 가격 협상</small>
          </button>
        </div>
      </section>

      {approvals.length > 0 && (
        <section className="card" aria-label="보낼 메일">
          <Approvals api={dispatch} approvals={approvals} sent={sent} onSent={onSent} />
        </section>
      )}
    </div>
  )
}
