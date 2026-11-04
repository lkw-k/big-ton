import type { ReactNode } from 'react'
import { StepIndicator } from './StepIndicator'

const STATUS = ['대기', '인터뷰 중', '수집 중', '정리 중', '비교 중', '추천 완료', '발송 대기']

interface StatusBarProps {
  item: string | null
  step: number
  mode: 'demo' | 'live'
  actions?: ReactNode
}

/** 상단 상태 바: 세션, 현재 상태, 단계 진행. */
export function StatusBar({ item, step, mode, actions }: StatusBarProps) {
  const running = step >= 2 && step <= 4
  return (
    <header className="topbar">
      <h1 className="topbar__brand">돌다리</h1>
      <div className="topbar__session">
        <span className="muted">세션</span>
        <span className="topbar__item">{item ?? '새 견적 탐색'}</span>
      </div>
      <span className={`status ${running ? 'status--live' : 'status--idle'}`} role="status">
        {running && <span className="live-dot" aria-hidden="true" />}
        {STATUS[step]}
      </span>
      <StepIndicator step={step} />
      <div className="topbar__actions">
        {mode === 'demo' && <span className="chip chip--demo">시연 모드 · 고정 데이터</span>}
        {actions}
      </div>
    </header>
  )
}
