const STEPS = ['인터뷰', '수집', '정리', '비교', '추천', '발송'] as const

/** spec §8 단계 진행 바. step은 1~6, 0이면 시작 전. */
export function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="steps" aria-label="진행 단계">
      {STEPS.map((label, index) => {
        const number = index + 1
        const state = number < step ? 'done' : number === step ? 'current' : 'todo'
        return (
          <li key={label} className={`steps__item steps__item--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="steps__num">{number}</span>
            {label}
          </li>
        )
      })}
    </ol>
  )
}
