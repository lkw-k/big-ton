import { useState } from 'react'
import type { Requirements } from '../../contract'
import type { SessionState } from '../../session/reducer'
import { TERMS } from '../../ui/terms'
import { CompareTable } from '../CompareTable'
import { CostChart } from '../CostChart'
import { FollowUpPanel } from '../FollowUpPanel'
import { NextAction } from '../NextAction'
import { RecommendationPanel } from '../RecommendationPanel'

interface ResultStageProps {
  session: SessionState
  requirements: Requirements
  onContact: () => void
}

/** 3단계: 숨은 비용까지 더한 실제 예상 비용 비교 + 추천 + 업체에 물어볼 것. */
export function ResultStage({ session, requirements, onContact }: ResultStageProps) {
  const [showTable, setShowTable] = useState(false)
  const recommended = session.recommendation?.vendor ?? null
  const finding = session.step < 5

  return (
    <div className="stage">
      <NextAction
        title={finding ? 'AI가 견적서에 빠진 숨은 비용을 찾고 있어요' : '숨은 비용까지 더해서 비교했어요'}
        detail={
          finding
            ? '설치비·배송비·A/S 비용을 찾을 때마다 막대가 길어지고 순위가 바뀌어요.'
            : '견적서 금액이 가장 싼 곳이 실제로도 가장 싼지 확인해 보세요.'
        }
        action={
          recommended && (
            <button type="button" className="btn btn--primary btn--lg" onClick={onContact}>
              {recommended}에 연락하기
            </button>
          )
        }
      />

      <section className="card" aria-label="추천">
        <RecommendationPanel recommendation={session.recommendation} />
      </section>

      <section className="card" aria-label="업체별 비용 비교">
        <header className="card__head">
          <h3 className="card__title">업체별 {TERMS.realCost}</h3>
          <button type="button" className="btn btn--ghost" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>
            {showTable ? '그래프로 보기' : '표로 보기'}
          </button>
        </header>
        {session.quotes.length === 0 ? (
          <p className="empty">견적이 들어오면 업체별로 같은 기준으로 비교해 드려요</p>
        ) : showTable ? (
          <CompareTable quotes={session.quotes} />
        ) : (
          <CostChart quotes={session.quotes} budget={requirements.budget} recommendedVendor={recommended} />
        )}
      </section>

      <section className="card" aria-label="업체에 물어볼 것">
        <header className="card__head">
          <h3 className="card__title">업체에 물어볼 것</h3>
        </header>
        <FollowUpPanel followUps={session.followUps} />
      </section>
    </div>
  )
}
