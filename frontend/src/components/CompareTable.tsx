import { useRef, useState, type ReactNode } from 'react'
import type { Quote, Source } from '../contract'
import { signedWon, won } from '../format'
import { rank, type SortBasis } from '../session/ranking'
import { Badge } from './Badge'
import { useFlip } from './useFlip'
import { useRankChanges } from './useRankChanges'

type Field = Source['field']

const BASIS_LABEL: Record<SortBasis, string> = { total_price: '표기 총액', adjusted_total: '보정 총액' }

interface CompareTableProps {
  quotes: Quote[]
  selectedVendor?: string | null
  onSelect?: (vendor: string) => void
}

/** spec §4.4 비교표 + §4.7 순위 역전. 값은 출처가 있을 때만 보여 주고, 없으면 미확인. */
export function CompareTable({ quotes, selectedVendor = null, onSelect }: CompareTableProps) {
  // 사용자가 고르기 전에는 표기 총액(spec §4.4 기본) → 가산이 들어오면 보정 총액으로 자동 전환(spec §4.7).
  const [chosenBasis, setChosenBasis] = useState<SortBasis | null>(null)
  const hasAdjustments = quotes.some((q) => q.adjustments.length > 0)
  const basis = chosenBasis ?? (hasAdjustments ? 'adjusted_total' : 'total_price')

  const ranked = rank(quotes, basis)
  const order = ranked.map((q) => q.vendor)
  const changes = useRankChanges(order)
  const body = useRef<HTMLTableSectionElement>(null)
  useFlip(body, order.join('|'))

  return (
    <div className="compare">
      <div className="segmented" role="group" aria-label="정렬 기준">
        {(Object.keys(BASIS_LABEL) as SortBasis[]).map((option) => (
          <button
            key={option}
            type="button"
            className="segmented__option"
            aria-pressed={basis === option}
            onClick={() => setChosenBasis(option)}
          >
            {BASIS_LABEL[option]}
          </button>
        ))}
      </div>
      <table className="compare__table">
        <thead>
          <tr>
            <th scope="col">순위</th>
            <th scope="col">업체</th>
            <th scope="col" className="num">표기 총액</th>
            <th scope="col">가산 비용</th>
            <th scope="col" className="num">보정 총액</th>
            <th scope="col" className="num">납기</th>
            <th scope="col">설치</th>
            <th scope="col" className="num">배송비</th>
            <th scope="col" className="num">A/S</th>
          </tr>
        </thead>
        <tbody ref={body}>
          {ranked.map((q, index) => (
            <tr
              key={q.vendor}
              data-flip-key={q.vendor}
              className={q.vendor === selectedVendor ? 'is-selected' : undefined}
              onClick={onSelect ? () => onSelect(q.vendor) : undefined}
            >
              <td className="rank">
                {index + 1}
                <RankChange delta={changes[q.vendor] ?? 0} />
              </td>
              <th scope="row" className="vendor">
                {q.vendor}
                <span className="chip">{q.channel === 'web' ? '웹' : '메일'}</span>
              </th>
              <td className="num">
                <Sourced quote={q} field="total_price" label="표기 총액" render={(v) => won(v as number)} />
              </td>
              <td>
                <Adjustments quote={q} />
              </td>
              <td className="num strong">
                {q.adjusted_total === null || !sourceOf(q, 'total_price') ? <Badge tone="unknown" /> : won(q.adjusted_total)}
              </td>
              <td className="num">
                <Sourced quote={q} field="lead_time_days" label="납기" render={(v) => `${v}일`} />
              </td>
              <td>
                <Sourced quote={q} field="install_included" label="설치" render={(v) => (v ? '포함' : '별도')} />
              </td>
              <td className="num">
                <Sourced quote={q} field="shipping_fee" label="배송비" render={(v) => won(v as number)} />
              </td>
              <td className="num">
                <Sourced quote={q} field="warranty_months" label="A/S" render={(v) => `${v}개월`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const sourceOf = (quote: Quote, field: Field) => quote.sources.find((s) => s.field === field)

function Sourced({
  quote,
  field,
  label,
  render,
}: {
  quote: Quote
  field: Exclude<Field, 'vendor' | 'adjustments'>
  label: string
  render: (value: number | boolean) => ReactNode
}) {
  const value = quote[field]
  const source = sourceOf(quote, field)
  if (value === null || !source) return <Badge tone="unknown" />
  return (
    <span className="sourced">
      {render(value)}
      <a className="source-link" href={source.ref} target="_blank" rel="noreferrer" aria-label={`${label} 출처`} title={source.snippet ?? source.ref}>
        출처
      </a>
    </span>
  )
}

function Adjustments({ quote }: { quote: Quote }) {
  if (quote.adjustments.length === 0) return <span className="muted">없음</span>
  return (
    <ul className="adjustments">
      {quote.adjustments.map((a) => (
        <li key={a.label} className="adjustments__item">
          <span>{a.label}</span>
          <span className="num">{signedWon(a.amount)}</span>
          <Badge tone={a.status} />
        </li>
      ))}
    </ul>
  )
}

function RankChange({ delta }: { delta: number }) {
  if (delta === 0) return null
  return (
    <span className={`rank__change ${delta > 0 ? 'is-up' : 'is-down'}`} aria-label={delta > 0 ? `${delta}계단 상승` : `${-delta}계단 하락`}>
      {delta > 0 ? `▲${delta}` : `▼${-delta}`}
    </span>
  )
}
