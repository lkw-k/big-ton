import { useState } from 'react'
import { ActivityLog } from './components/ActivityLog'
import { AgentScreen } from './components/AgentScreen'
import { CompareTable } from './components/CompareTable'
import { DispatchPanel } from './components/DispatchPanel'
import { FollowUpPanel } from './components/FollowUpPanel'
import { InterviewPanel } from './components/InterviewPanel'
import { Panel } from './components/Panel'
import { RecommendationPanel } from './components/RecommendationPanel'
import { StatusBar } from './components/StatusBar'
import type { Requirements } from './contract'
import { createEnvironment, type Environment } from './environment'
import { useSession } from './session/useSession'
import type { EventStream } from './source/types'

export default function App({ environment }: { environment?: () => Environment }) {
  const [run, setRun] = useState(0)
  return <Dashboard key={run} create={environment ?? createEnvironment} onRestart={() => setRun(run + 1)} />
}

function Dashboard({ create, onRestart }: { create: () => Environment; onRestart: () => void }) {
  const [env] = useState(create)
  const [requirements, setRequirements] = useState<Requirements | null>(null)
  const [events, setEvents] = useState<EventStream | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const session = useSession(events)

  function completeInterview(sessionId: string, extracted: Requirements) {
    setRequirements(extracted)
    setEvents(env.open(sessionId))
  }

  const step = requirements === null ? 1 : Math.max(session.step, 1)

  return (
    <div className="app">
      <StatusBar
        item={requirements?.item ?? null}
        step={step}
        mode={env.mode}
        actions={
          <button type="button" className="button" onClick={onRestart}>
            처음부터
          </button>
        }
      />
      <main className="board">
        <div className="board__col board__col--side">
          <Panel title={requirements ? '요구 조건' : '인터뷰'}>
            <InterviewPanel api={env.interview} onComplete={completeInterview} />
          </Panel>
          <Panel title="확인 질문">
            <FollowUpPanel followUps={session.followUps} />
          </Panel>
        </div>
        <div className="board__col board__col--main">
          <Panel title="견적 비교">
            {session.quotes.length === 0 ? (
              <p className="empty">견적이 들어오면 업체별로 같은 양식으로 정리됩니다</p>
            ) : (
              <CompareTable quotes={session.quotes} selectedVendor={selectedVendor} onSelect={setSelectedVendor} />
            )}
          </Panel>
          <Panel title="추천">
            <RecommendationPanel recommendation={session.recommendation} />
          </Panel>
          <Panel title="발송 대기">
            <DispatchPanel api={env.dispatch} approvals={session.approvals} selectedVendor={selectedVendor} />
          </Panel>
        </div>
        <div className="board__col board__col--agent">
          <Panel title="에이전트 화면">
            <AgentScreen screen={session.screen} />
          </Panel>
          <Panel title="작업 로그" className="panel--log">
            <ActivityLog logs={session.logs} />
          </Panel>
        </div>
      </main>
    </div>
  )
}
