import { useRef } from 'react'
import type { Quote } from '../contract'
import { won } from '../format'
import { rank } from '../session/ranking'
import { STATUS_TERM, TERMS } from '../ui/terms'
import { useFlip } from './useFlip'
import { useRankChanges } from './useRankChanges'

interface CostChartProps {
  quotes: Quote[]
  budget: number | null
  recommendedVendor?: string | null
}

/**
 * 업체별 실제 예상 비용 = 견적서 금액 + 숨은 비용. 가로 누적 막대.
 * 숨은 비용이 붙을 때마다 막대가 길어지고 순서가 바뀐다 (spec §4.7).
 */
export function CostChart({ quotes, budget, recommendedVendor = null }: CostChartProps) {
  const ranked = rank(quotes, 'adjusted_total')
  const order = ranked.map((q) => q.vendor)
  const changes = useRankChanges(order)
  const list = useRef<HTMLOListElement>(null)
  useFlip(list, order.join('|'))

  // 가장 긴 막대나 예산선이 끝에 붙지 않도록 여유를 둔다.
  const longest = Math.max(budget ?? 0, ...ranked.map((q) => q.adjusted_total ?? 0))
  const scale = longest * 1.12 || 1
  const percent = (amount: number) => `${(Math.max(0, amount) / scale) * 100}%`

  return (
    <figure className="chart">
      <ul className="chart__legend" aria-label="범례">
        <li>
          <span className="swatch swatch--base" aria-hidden="true" />
          {TERMS.quotedPrice}
        </li>
        <li>
          <span className="swatch swatch--confirmed" aria-hidden="true" />
          {TERMS.hiddenCost} ({STATUS_TERM.confirmed})
        </li>
        <li>
          <span className="swatch swatch--estimated" aria-hidden="true" />
          {TERMS.hiddenCost} ({STATUS_TERM.estimated})
        </li>
      </ul>

      <div className="chart__plot">
        {budget !== null && (
          <div className="chart__budget" style={{ left: percent(budget) }}>
            <span className="chart__budget-label">예산 {won(budget)}</span>
          </div>
        )}
        <ol className="chart__rows" ref={list} aria-label={`업체별 ${TERMS.realCost}`}>
          {ranked.map((q, index) => (
            <li
              key={q.vendor}
              data-flip-key={q.vendor}
              aria-label={q.vendor}
              className={`chart__row ${q.vendor === recommendedVendor ? 'is-recommended' : ''}`}
            >
              <div className="chart__who">
                <span className="chart__rank">{index + 1}</span>
                <h4 className="chart__vendor">{q.vendor}</h4>
                <RankChange delta={changes[q.vendor] ?? 0} />
              </div>
              {q.total_price === null ? (
                <p className="chart__unknown">
                  {TERMS.quotedPrice} {TERMS.unknown}
                </p>
              ) : (
                <div className="chart__bar">
                  <span
                    className="seg seg--base"
                    style={{ width: percent(q.total_price) }}
                    tabIndex={0}
                    aria-label={`${TERMS.quotedPrice} ${won(q.total_price)}`}
                    data-tip={`${TERMS.quotedPrice} ${won(q.total_price)}`}
                  />
                  {q.adjustments.map((a) => {
                    const label = `${a.label} ${won(a.amount)} (${STATUS_TERM[a.status]})`
                    return (
                      <span
                        key={a.label}
                        className={`seg seg--${a.status}`}
                        style={{ width: percent(a.amount) }}
                        tabIndex={0}
                        aria-label={label}
                        data-tip={label}
                      />
                    )
                  })}
                  <span className="chart__total">{won(q.adjusted_total!)}</span>
                </div>
              )}
              {q.adjustments.length > 0 && (
                <p className="chart__note">
                  {TERMS.quotedPrice} {won(q.total_price!)} + {TERMS.hiddenCost}{' '}
                  {q.adjustments.map((a) => a.label).join('·')}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  )
}

function RankChange({ delta }: { delta: number }) {
  if (delta === 0) return null
  return (
    <span className={`rank-change ${delta > 0 ? 'is-up' : 'is-down'}`}>
      {delta > 0 ? `${delta}계단 올라감` : `${-delta}계단 내려감`}
    </span>
  )
}
