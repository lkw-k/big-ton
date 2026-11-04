// 처음 쓰는 사람도 이해할 수 있는 화면 용어. 내부 용어(보정 총액·가산·에이전트)를 화면에 그대로 쓰지 않는다.
import type { AdjustmentStatus } from '../contract'

export const TERMS = {
  quotedPrice: '견적서 금액',
  hiddenCost: '숨은 비용',
  realCost: '실제 예상 비용',
  unknown: '확인 안 됨',
  ai: 'AI',
} as const

export const STATUS_TERM: Record<AdjustmentStatus, string> = {
  confirmed: '확인됨',
  estimated: '추정치',
}

/** 화면에 보이는 4단계. 내부 SSE step(1~6)을 사람이 이해하는 단위로 묶는다. */
export const STAGES = ['필요한 것', '견적 모으기', '비교 결과', '업체에 연락'] as const
export type Stage = 0 | 1 | 2 | 3

export function stageOf(step: number): Stage {
  if (step <= 1) return 0
  if (step === 2) return 1
  if (step <= 5) return 2
  return 3
}
