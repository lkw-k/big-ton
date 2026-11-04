import type { Adjustment } from '../contract'

// adjusted_total = total_price + Σ adjustments.amount (spec §5.2, backend AdjustedTotal과 같은 공식).
// 표기 총액을 모르면 보정 총액도 알 수 없으므로 null (0 대체 금지).
export function adjustedTotal(totalPrice: number | null, adjustments: Adjustment[]): number | null {
  if (totalPrice === null) return null
  return adjustments.reduce((sum, adjustment) => sum + adjustment.amount, totalPrice)
}
