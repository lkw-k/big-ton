import type { SessionState } from '../../session/reducer'
import type { DispatchApi } from '../../source/types'
import { Approvals } from '../Approvals'
import { NextAction } from '../NextAction'

interface CollectStageProps {
  session: SessionState
  dispatch: DispatchApi
  sent: ReadonlySet<string>
  onSent: (draftId: string) => void
}

/** 2단계: AI가 업체별 견적을 모으는 중. 메일은 사용자가 확인하고 보내야 한다. */
export function CollectStage({ session, dispatch, sent, onSent }: CollectStageProps) {
  const collectApprovals = session.approvals.filter((a) => a.step <= 2)
  const waiting = collectApprovals.some((a) => a.kind === 'send_mail' && !sent.has(a.draft_id))
  const vendors = [...new Set([...session.logs.flatMap((l) => (l.vendor ? [l.vendor] : [])), ...session.quotes.map((q) => q.vendor)])]

  return (
    <div className="stage">
      <NextAction
        title={waiting ? '업체에 보낼 견적 요청 메일을 확인해 주세요' : 'AI가 업체 사이트와 메일에서 견적을 모으고 있어요'}
        detail={
          waiting
            ? '메일로만 견적을 받는 업체가 있어요. 내용을 확인하고 보내기를 누르면 AI가 회신을 기다렸다가 정리해요.'
            : '조금만 기다려 주세요. 오른쪽에서 AI가 보고 있는 화면을 볼 수 있어요.'
        }
      />

      {collectApprovals.length > 0 && (
        <section className="card" aria-label="내 확인이 필요한 메일">
          <Approvals api={dispatch} approvals={collectApprovals} sent={sent} onSent={onSent} />
        </section>
      )}

      <section className="card" aria-label="업체별 진행 상황">
        <header className="card__head">
          <h3 className="card__title">업체별 진행 상황</h3>
        </header>
        {vendors.length === 0 ? (
          <p className="empty">곧 업체를 찾기 시작해요</p>
        ) : (
          <ul className="vendor-progress">
            {vendors.map((vendor) => {
              const quote = session.quotes.find((q) => q.vendor === vendor)
              return (
                <li key={vendor} className="vendor-progress__item">
                  <span className="vendor-progress__name">{vendor}</span>
                  {quote ? (
                    <span className="pill pill--ok">견적 받음 · {quote.channel === 'web' ? '웹사이트' : '메일'}</span>
                  ) : (
                    <span className="pill pill--live">
                      <span className="spinner" aria-hidden="true" />
                      확인 중
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
