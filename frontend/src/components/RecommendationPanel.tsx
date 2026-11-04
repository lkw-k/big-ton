import type { Recommendation } from '../session/reducer'

/** spec §4.5 추천 1곳: 적합도 점수(총액·납기·설치·A/S 반영)와 이유. 점수 계산은 backend가 한다. */
export function RecommendationPanel({ recommendation }: { recommendation: Recommendation | null }) {
  if (recommendation === null) {
    return <p className="empty">견적 정리가 끝나면 요구 조건에 가장 맞는 업체를 추천합니다</p>
  }
  const { vendor, score, reasons } = recommendation
  return (
    <div className="recommendation">
      <div className="recommendation__head">
        <h3 className="recommendation__vendor">{vendor}</h3>
        <span className="recommendation__score num">{score}점</span>
      </div>
      <div className="meter" role="meter" aria-label="적합도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <span className="meter__fill" style={{ width: `${score}%` }} />
      </div>
      <ul className="recommendation__reasons">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
