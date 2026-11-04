import { useState, type SubmitEvent } from 'react'
import type { InterviewQuestion, Requirements } from '../contract'
import { won } from '../format'
import type { InterviewApi } from '../source/types'
import { Badge } from './Badge'

interface InterviewPanelProps {
  api: InterviewApi
  onComplete: (sessionId: string, requirements: Requirements) => void
}

type Stage =
  | { name: 'item' }
  | { name: 'questions'; sessionId: string; questions: InterviewQuestion[] }
  | { name: 'done'; requirements: Requirements }

/** spec §4.1 인터뷰: 물품 → 질문(최대 5개) → 답변 → 요구 조건. */
export function InterviewPanel({ api, onComplete }: InterviewPanelProps) {
  const [stage, setStage] = useState<Stage>({ name: 'item' })
  const [item, setItem] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(task: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setBusy(false)
    }
  }

  function start(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void run(async () => {
      const created = await api.start(item.trim())
      setStage({ name: 'questions', sessionId: created.session_id, questions: created.questions })
    })
  }

  function submit(event: SubmitEvent<HTMLFormElement>, sessionId: string, questions: InterviewQuestion[]) {
    event.preventDefault()
    // 답하지 않았거나 공백만 쓴 질문은 null로 보낸다 (추측 금지).
    const payload = questions.map(({ field }) => ({ field, answer: answers[field]?.trim() || null }))
    void run(async () => {
      const requirements = await api.answer(sessionId, payload)
      setStage({ name: 'done', requirements })
      onComplete(sessionId, requirements)
    })
  }

  return (
    <div className="interview">
      {stage.name === 'item' && (
        <form className="interview__form" onSubmit={start}>
          <label className="field">
            <span className="field__label">필요한 물품</span>
            <input
              className="field__input"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="예: 주문제작 도어락"
              required
            />
          </label>
          <button className="button button--primary" disabled={busy || item.trim() === ''}>
            질문 받기
          </button>
        </form>
      )}

      {stage.name === 'questions' && (
        <form className="interview__form" onSubmit={(e) => submit(e, stage.sessionId, stage.questions)}>
          <p className="hint">모르는 항목은 비워 두세요. 비운 항목은 추측하지 않고 미확인으로 둡니다.</p>
          {stage.questions.map((q) => (
            <label key={q.field} className="field">
              <span className="field__label">{q.question}</span>
              <input
                className="field__input"
                value={answers[q.field] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [q.field]: e.target.value })}
              />
            </label>
          ))}
          <button className="button button--primary" disabled={busy}>
            요구 조건 정리
          </button>
        </form>
      )}

      {stage.name === 'done' && <RequirementsSummary requirements={stage.requirements} />}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function RequirementsSummary({ requirements: r }: { requirements: Requirements }) {
  const rows: [string, string | null][] = [
    ['물품', r.item],
    ['예산', r.budget === null ? null : won(r.budget)],
    ['납기', r.due_date],
    ['설치', r.need_install === null ? null : r.need_install ? '필요' : '불필요'],
    ['수량', r.quantity === null ? null : `${r.quantity}개`],
    ['기타 조건', r.notes],
  ]
  return (
    <ul className="requirements" aria-label="요구 조건">
      {rows.map(([label, value]) => (
        <li key={label} className="requirements__row">
          <span className="requirements__label">{label}</span>
          {value === null ? <Badge tone="unknown" /> : <span className="requirements__value">{value}</span>}
        </li>
      ))}
    </ul>
  )
}
