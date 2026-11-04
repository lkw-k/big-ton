import type { Quote } from '../contract'

export type SortBasis = 'total_price' | 'adjusted_total'

/** 금액 오름차순. 미확인(null)은 순위를 매길 수 없으므로 맨 뒤. 같으면 업체명 순. */
export function rank(quotes: Quote[], basis: SortBasis): Quote[] {
  return [...quotes].sort((a, b) => {
    const x = a[basis]
    const y = b[basis]
    if (x === y) return a.vendor.localeCompare(b.vendor)
    if (x === null) return 1
    if (y === null) return -1
    return x - y
  })
}

/** 업체별 순위 변화. 올라가면 양수, 내려가면 음수. */
export function rankChanges(before: string[], after: string[]): Record<string, number> {
  return Object.fromEntries(
    after
      .filter((vendor) => before.includes(vendor))
      .map((vendor) => [vendor, before.indexOf(vendor) - after.indexOf(vendor)]),
  )
}
