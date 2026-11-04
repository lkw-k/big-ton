import { useState, type ReactNode } from 'react'
import type { Quote, Source } from '../contract'
import { signedWon, won } from '../format'
import { rank, type SortBasis } from '../session/ranking'
import { TERMS } from '../ui/terms'
import { Badge } from './Badge'

type Field = Source['field']

const BASIS_LABEL: Record<SortBasis, string> = { total_price: TERMS.quotedPrice, adjusted_total: TERMS.realCost }

/**
 * 그래프의 대체 표 (spec §4.4). 값은 출처가 있을 때만 보여 주고, 없으면 "확인 안 됨".
 * 정렬 기본은 견적서 금액, 숨은 비용이 들어오면 실제 예상 비용으로 바뀐다 (spec §4.7).
 */
export function CompareTable({ quotes }: { quotes: Quote[] }) {
  const [chosenBasis, setChosenBasis] = useState<SortBasis | null>(null)
  const hasAdjustments = quotes.some((q) => q.adjustments.length > 0)
  const basis = chosenBasis ?? (hasAdjustments ? 'adjusted_total' : 'total_price')

  return (
    <div className="table-view">
      <div className="segmented" role="group" aria-label="정렬 기준">
        {(Object.keys(BASIS_LABEL) as SortBasis[]).map((option) => (
          <button
            key={option}
            type="button"
            className="segmented__option"
            aria-pressed={basis === option}
            onClick={() => setChosenBasis(option)}
          >
            {BASIS_LABEL[option]} 순
          </button>
        ))}
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">순위</th>
              <th scope="col">업체</th>
              <th scope="col" className="num">{TERMS.quotedPrice}</th>
              <th scope="col">{TERMS.hiddenCost}</th>
              <th scope="col" className="num">{TERMS.realCost}</th>
              <th scope="col" className="num">납기</th>
              <th scope="col">설치</th>
              <th scope="col" className="num">배송비</th>
              <th scope="col" className="num">A/S</th>
            </tr>
          </thead>
          <tbody>
            {rank(quotes, basis).map((q, index) => (
              <tr key={q.vendor}>
                <td className="num">{index + 1}</td>
                <th scope="row">
                  {q.vendor}
                  <span className="tag">{q.channel === 'web' ? '웹사이트' : '메일'}</span>
                </th>
                <td className="num">
                  <Sourced quote={q} field="total_price" label={TERMS.quotedPrice} render={(v) => won(v as number)} />
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
      <a
        className="source-link"
        href={source.ref}
        target="_blank"
        rel="noreferrer"
        aria-label={`${label} 출처`}
        title={source.snippet ?? source.ref}
      >
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
