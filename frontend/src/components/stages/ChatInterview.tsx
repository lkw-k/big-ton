import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import type { Answer, InterviewQuestion, Requirements } from '../../contract'
import type { InterviewApi } from '../../source/types'
import { ANSWER_SUGGESTIONS, ITEM_SUGGESTIONS, UNKNOWN_ANSWER } from '../../ui/suggestions'
import { RequirementsCard } from '../RequirementsCard'

interface ChatInterviewProps {
  api: InterviewApi
  onComplete: (sessionId: string, requirements: Requirements) => void
}

interface Bubble {
  from: 'ai' | 'me'
  text: string
}

type Phase =
  | { name: 'item' }
  | { name: 'asking'; sessionId: string; questions: InterviewQuestion[]; answers: Answer[] }
  | { name: 'done'; sessionId: string; requirements: Requirements }

const GREETING = '안녕하세요! 어떤 물건의 견적이 필요하세요? 아래에서 고르거나 직접 적어 주세요.'

/** 챗봇 대화 형식 인터뷰 (spec §4.1). 질문은 하나씩, 모르면 비워 둔다(추측 금지). */
export function ChatInterview({ api, onComplete }: ChatInterviewProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([{ from: 'ai', text: GREETING }])
  const [phase, setPhase] = useState<Phase>({ name: 'item' })
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' })
  }, [bubbles.length, phase.name])

  const say = (...next: Bubble[]) => setBubbles((current) => [...current, ...next])

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

  function startWith(item: string) {
    say({ from: 'me', text: item })
    void run(async () => {
      const created = await api.start(item)
      say({ from: 'ai', text: `좋아요, "${item}" 견적을 모을게요. 몇 가지만 여쭤볼게요.` }, ask(created.questions[0]))
      setPhase({ name: 'asking', sessionId: created.session_id, questions: created.questions, answers: [] })
    })
  }

  function reply(text: string | null) {
    if (phase.name !== 'asking') return
    const { sessionId, questions } = phase
    const answers = [...phase.answers, { field: questions[phase.answers.length].field, answer: text }]
    say({ from: 'me', text: text ?? UNKNOWN_ANSWER })
    if (answers.length < questions.length) {
      say(ask(questions[answers.length]))
      setPhase({ ...phase, answers })
      return
    }
    void run(async () => {
      const requirements = await api.answer(sessionId, answers)
      say({ from: 'ai', text: '정리했어요. 확인 안 된 항목은 업체에 따로 물어볼게요. 이대로 견적을 모을까요?' })
      setPhase({ name: 'done', sessionId, requirements })
    })
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    setDraft('')
    if (phase.name === 'item') {
      if (text) startWith(text)
      return
    }
    // 빈 칸으로 보내면 모른다는 뜻으로 받는다 (null).
    reply(text || null)
  }

  const current = phase.name === 'asking' ? phase.questions[phase.answers.length] : null
  const chips = current ? [...ANSWER_SUGGESTIONS[current.field], UNKNOWN_ANSWER] : []

  return (
    <div className="chatbot">
      <div className="chatbot__log" role="log" aria-label="인터뷰 대화">
        {bubbles.map((bubble, index) => (
          <div key={index} className={`bubble bubble--${bubble.from}`}>
            {bubble.from === 'ai' && <span className="bubble__avatar" aria-hidden="true">AI</span>}
            <p className="bubble__text">{bubble.text}</p>
          </div>
        ))}
        {busy && (
          <div className="bubble bubble--ai" aria-label="AI가 입력 중">
            <span className="bubble__avatar" aria-hidden="true">AI</span>
            <p className="bubble__text typing">
              <i />
              <i />
              <i />
            </p>
          </div>
        )}
        {phase.name === 'done' && (
          <div className="chatbot__summary">
            <RequirementsCard requirements={phase.requirements} />
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => onComplete(phase.sessionId, phase.requirements)}
            >
              이대로 견적 모으기
            </button>
          </div>
        )}
        {error && (
          <p className="chatbot__error" role="alert">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>

      {phase.name !== 'done' && (
        <div className="chatbot__composer">
          {current && phase.name === 'asking' && (
            <span className="chatbot__progress">
              {phase.answers.length + 1} / {phase.questions.length}
            </span>
          )}
          {phase.name === 'item' && (
            <div className="quick" aria-label="추천 키워드">
              {ITEM_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  className="quick__item"
                  disabled={busy}
                  onClick={() => startWith(suggestion.label)}
                >
                  <span className={`quick__icon quick__icon--${suggestion.tint}`} aria-hidden="true">
                    {suggestion.icon}
                  </span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
          {chips.length > 0 && (
            <div className="chips" aria-label="추천 답변">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip-button ${chip === UNKNOWN_ANSWER ? 'chip-button--quiet' : ''}`}
                  disabled={busy}
                  onClick={() => reply(chip === UNKNOWN_ANSWER ? null : chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <form className="chatbot__form" onSubmit={submit}>
            <input
              id="chat-input"
              className="chatbot__input"
              aria-label="답변 입력"
              placeholder={phase.name === 'item' ? '예: 주문제작 도어락 10개' : '답을 적거나 위에서 골라 주세요'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
            />
            <button className="btn btn--primary" disabled={busy}>
              보내기
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const ask = (question: InterviewQuestion): Bubble => ({ from: 'ai', text: question.question })
