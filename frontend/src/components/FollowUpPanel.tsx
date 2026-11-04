import type { FollowUpQuestion } from '../contract'
import { FIELD_LABEL } from '../format'

/** spec §4.5 업체별 확인 질문 (missing_fields 기반). */
export function FollowUpPanel({ followUps }: { followUps: FollowUpQuestion[] }) {
  if (followUps.length === 0) {
    return <p className="empty">빠진 항목이 발견되면 업체별 확인 질문이 여기에 생깁니다</p>
  }
  const vendors = [...new Set(followUps.map((f) => f.vendor))]
  return (
    <div className="followups">
      {vendors.map((vendor) => (
        <div key={vendor} className="followups__group">
          <h3 className="followups__vendor">{vendor}</h3>
          <ul aria-label={`${vendor} 확인 질문`} className="followups__list">
            {followUps
              .filter((f) => f.vendor === vendor)
              .map((f) => (
                <li key={f.field} className="followups__item">
                  <span className="chip chip--warn">{FIELD_LABEL[f.field]}</span>
                  {f.question}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
