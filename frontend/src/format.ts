// 화면 표시용 포맷. null 처리는 호출하는 쪽에서 "미확인" 배지로 한다.
import type { QuoteField } from './contract'

export const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

export const FIELD_LABEL: Record<QuoteField, string> = {
  total_price: '총액',
  lead_time_days: '납기',
  install_included: '설치 여부',
  shipping_fee: '배송비',
  warranty_months: 'A/S 기간',
}

export const signedWon = (amount: number) => `${amount >= 0 ? '+' : '−'}${Math.abs(amount).toLocaleString('ko-KR')}원`
