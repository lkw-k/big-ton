import type { FollowUpQuestion } from '../contract'
import { FIELD_LABEL } from '../format'

/** spec §4.5 업체별 확인 질문: 견적에 빠져 있어 업체에 물어봐야 할 것. */
export function FollowUpPanel({ followUps }: { followUps: FollowUpQuestion[] }) {
  if (followUps.length === 0) {
    return <p className="empty">견적에 빠진 내용이 있으면 업체에 물어볼 질문을 만들어 드려요</p>
  }
  const vendors = [...new Set(followUps.map((f) => f.vendor))]
  return (
    <div className="followups">
      {vendors.map((vendor) => (
        <div key={vendor} className="followups__group">
          <h4 className="followups__vendor">{vendor}</h4>
          <ul aria-label={`${vendor} 확인 질문`} className="followups__list">
            {followUps
              .filter((f) => f.vendor === vendor)
              .map((f) => (
                <li key={f.field} className="followups__item">
                  <span className="tag tag--warn">{FIELD_LABEL[f.field]}</span>
                  {f.question}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
