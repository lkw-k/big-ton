import { useEffect, useState } from 'react'
import AgentWindow from './AgentWindow'
import { AgentPreview } from './components/AgentPreview'
import { StageNav } from './components/StageNav'
import { ChatInterview } from './components/stages/ChatInterview'
import { CollectStage } from './components/stages/CollectStage'
import { ContactStage } from './components/stages/ContactStage'
import { ResultStage } from './components/stages/ResultStage'
import { ThemeToggle } from './components/ThemeToggle'
import type { Requirements } from './contract'
import { createEnvironment, type Environment } from './environment'
import { useSession } from './session/useSession'
import { relayToAgentWindow } from './source/agentChannel'
import type { EventStream } from './source/types'
import { stageOf, type Stage } from './ui/terms'

interface AppProps {
  environment?: () => Environment
  openAgentWindow?: () => void
}

const openWindow = () => window.open('/?view=agent', 'doldari-agent', 'width=1280,height=860')

export default function App({ environment, openAgentWindow = openWindow }: AppProps) {
  const [run, setRun] = useState(0)
  if (new URLSearchParams(window.location.search).get('view') === 'agent') return <AgentWindow />
  return (
    <Dashboard
      key={run}
      create={environment ?? createEnvironment}
      openAgentWindow={openAgentWindow}
      onRestart={() => setRun(run + 1)}
    />
  )
}

interface DashboardProps {
  create: () => Environment
  openAgentWindow: () => void
  onRestart: () => void
}

function Dashboard({ create, openAgentWindow, onRestart }: DashboardProps) {
  const [env] = useState(create)
  const [requirements, setRequirements] = useState<Requirements | null>(null)
  const [events, setEvents] = useState<EventStream | null>(null)
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set())
  const [manual, setManual] = useState<{ stage: Stage; at: Stage } | null>(null)
  const session = useSession(events)

  useEffect(() => (events ? relayToAgentWindow(events) : undefined), [events])

  // 견적 모으기 → 비교 결과까지는 진행에 따라 자동으로 넘어간다. 연락 단계는 사용자가 고른다.
  const auto: Stage = requirements === null ? 0 : (Math.min(stageOf(Math.max(session.step, 2)), 2) as Stage)
  const reached: Stage = session.step >= 6 ? 3 : auto
  const viewing: Stage = manual && manual.at === auto ? manual.stage : auto
  const show = (stage: Stage) => setManual({ stage, at: auto })

  function completeInterview(sessionId: string, extracted: Requirements) {
    setRequirements(extracted)
    setEvents(env.open(sessionId))
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="logo" aria-hidden="true">돌</span>
          <div>
            <h1 className="topbar__title">돌다리</h1>
            <p className="topbar__tagline">가장 싼 견적이 정말 가장 좋은지, AI가 두들겨 봐 드려요</p>
          </div>
        </div>
        <div className="topbar__actions">
          {env.mode === 'demo' && <span className="pill pill--warn">시연 모드</span>}
          <ThemeToggle />
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            처음부터
          </button>
        </div>
      </header>

      <nav className="stage-bar" aria-label="단계">
        <StageNav current={reached} reached={reached} viewing={viewing} onSelect={show} />
      </nav>

      {viewing === 0 && (
        <section className="hero" aria-label="소개">
          <h2 className="hero__title">어떤 견적을 받아볼까요?</h2>
          <p className="hero__lead">필요한 물건만 말하면 AI가 업체 견적을 모아 숨은 비용까지 비교해 드려요</p>
          <button type="button" className="hero__ask" onClick={() => document.getElementById('chat-input')?.focus()}>
            <span className="hero__ask-avatar" aria-hidden="true">
              AI
            </span>
            AI에게 견적 물어보기
          </button>
        </section>
      )}

      <main className="layout">
        <div className="layout__main">
          {viewing === 0 && <ChatInterview api={env.interview} onComplete={completeInterview} />}
          {viewing === 1 && <CollectStage session={session} dispatch={env.dispatch} sent={sent} onSent={markSent} />}
          {viewing === 2 && requirements && <ResultStage session={session} requirements={requirements} onContact={() => show(3)} />}
          {viewing === 3 && <ContactStage session={session} dispatch={env.dispatch} sent={sent} onSent={markSent} />}
        </div>
        <aside className="layout__side">
          {viewing === 0 ? <HowItWorks /> : <AgentPreview screen={session.screen} logs={session.logs} onOpen={openAgentWindow} />}
        </aside>
      </main>

      {viewing !== 0 && (
        <button type="button" className="fab" onClick={openAgentWindow}>
          <span className="fab__dot" aria-hidden="true" />
          AI 작업 보기
        </button>
      )}
    </div>
  )

  function markSent(draftId: string) {
    setSent((current) => new Set([...current, draftId]))
  }
}

function HowItWorks() {
  return (
    <section className="card how" aria-label="이렇게 진행돼요">
      <h3 className="card__title">이렇게 진행돼요</h3>
      <ol className="how__steps">
        <li>
          <strong>필요한 물건을 알려 주세요</strong>
          <span>AI가 예산·납기 같은 조건을 몇 가지 물어봐요.</span>
        </li>
        <li>
          <strong>AI가 견적을 모아요</strong>
          <span>업체 사이트와 메일에서 견적을 받아 같은 기준으로 정리해요.</span>
        </li>
        <li>
          <strong>숨은 비용까지 비교해요</strong>
          <span>설치비·배송비처럼 견적서에 빠진 비용을 더해 실제 비용을 보여 줘요.</span>
        </li>
        <li>
          <strong>마음에 드는 업체에 연락해요</strong>
          <span>메일은 내용을 확인하고 보내기를 눌러야만 발송돼요.</span>
        </li>
      </ol>
    </section>
  )
}
