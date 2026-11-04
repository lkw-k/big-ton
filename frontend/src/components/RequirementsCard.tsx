import type { Requirements } from '../contract'
import { won } from '../format'
import { Badge } from './Badge'

/** 인터뷰로 정리한 요구 조건. 답하지 않은 항목은 "확인 안 됨". */
export function RequirementsCard({ requirements: r }: { requirements: Requirements }) {
  const rows: [string, string | null][] = [
    ['물품', r.item],
    ['예산', r.budget === null ? null : won(r.budget)],
    ['납기', r.due_date],
    ['설치', r.need_install === null ? null : r.need_install ? '필요' : '필요 없음'],
    ['수량', r.quantity === null ? null : `${r.quantity}개`],
    ['기타 조건', r.notes],
  ]
  return (
    <ul className="req" aria-label="요구 조건">
      {rows.map(([label, value]) => (
        <li key={label} className="req__row">
          <span className="req__label">{label}</span>
          {value === null ? <Badge tone="unknown" /> : <span className="req__value">{value}</span>}
        </li>
      ))}
    </ul>
  )
}
