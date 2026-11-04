import { STAGES, type Stage } from '../ui/terms'

interface StageNavProps {
  current: Stage
  /** 다시 볼 수 있는 가장 먼 단계. 없으면 보기 전용. */
  reached?: Stage
  viewing?: Stage
  onSelect?: (stage: Stage) => void
}

/** 4단계 진행 표시. 끝난 단계는 눌러서 다시 볼 수 있다. */
export function StageNav({ current, reached = current, viewing = current, onSelect }: StageNavProps) {
  return (
    <ol className="stages" aria-label="진행 단계">
      {STAGES.map((label, index) => {
        const stage = index as Stage
        const state = stage < current ? 'done' : stage === current ? 'current' : 'todo'
        const content = (
          <>
            <span className="stages__num">{state === 'done' ? '✓' : index + 1}</span>
            <span className="stages__label">{label}</span>
          </>
        )
        return (
          <li
            key={label}
            className={`stages__item stages__item--${state} ${stage === viewing ? 'is-viewing' : ''}`}
            aria-current={stage === current ? 'step' : undefined}
          >
            {onSelect && stage <= reached ? (
              <button type="button" className="stages__button" onClick={() => onSelect(stage)}>
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
