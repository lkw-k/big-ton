import type { Recommendation } from '../session/reducer'

/** spec §4.5 추천 1곳: 요구 조건에 맞는 정도(총액·납기·설치·A/S)와 이유. 점수 계산은 backend가 한다. */
export function RecommendationPanel({ recommendation }: { recommendation: Recommendation | null }) {
  if (recommendation === null) {
    return <p className="empty">비교가 끝나면 요구 조건에 가장 잘 맞는 업체를 추천해 드려요</p>
  }
  const { vendor, score, reasons } = recommendation
  return (
    <div className="recommend">
      <div className="recommend__head">
        <span className="pill pill--ok">추천</span>
        <h3 className="recommend__vendor">{vendor}</h3>
        <span className="recommend__score">
          조건 일치도 <strong>{score}점</strong>
        </span>
      </div>
      <div className="meter" role="meter" aria-label="조건 일치도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <span className="meter__fill" style={{ width: `${score}%` }} />
      </div>
      <ul className="recommend__reasons">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
