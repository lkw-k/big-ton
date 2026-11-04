// 챗봇 인터뷰의 추천 키워드. 눌러서 바로 답할 수 있는 보기일 뿐, 사용자가 고르지 않으면 아무 값도 채우지 않는다.
import type { InterviewField } from '../contract'

export interface ItemSuggestion {
  label: string
  icon: string
  tint: string
}

export const ITEM_SUGGESTIONS: ItemSuggestion[] = [
  { label: '주문제작 도어락', icon: '🔐', tint: 'blue' },
  { label: '사무용 의자 20개', icon: '🪑', tint: 'orange' },
  { label: '회의실 프로젝터', icon: '📽️', tint: 'violet' },
  { label: '매장 간판 제작', icon: '🪧', tint: 'green' },
  { label: '업무용 노트북', icon: '💻', tint: 'sky' },
  { label: '사무실 복합기', icon: '🖨️', tint: 'pink' },
]

export const ANSWER_SUGGESTIONS: Record<InterviewField, string[]> = {
  budget: ['100만원', '150만원', '300만원'],
  due_date: ['2026-12-01까지', '2주 안에', '급하지 않아요'],
  need_install: ['네, 설치도 필요해요', '아니요, 필요 없어요'],
  quantity: ['1개', '10개', '50개'],
  notes: ['색상은 검정', '방문 상담 원해요', '세금계산서 발행'],
}

export const UNKNOWN_ANSWER = '잘 모르겠어요'
