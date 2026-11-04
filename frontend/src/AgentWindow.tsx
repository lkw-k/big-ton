import { useState } from 'react'
import { StageNav } from './components/StageNav'
import { useSession } from './session/useSession'
import { watchFromAgentWindow } from './source/agentChannel'
import type { EventStream } from './source/types'
import { stageOf } from './ui/terms'

/** "AI 작업 보기" 새 창 (/?view=agent). 메인 창에서 넘어온 이벤트를 보기만 한다. */
export default function AgentWindow() {
  const [events] = useState(() => watchFromAgentWindow())
  return <AgentView events={events} />
}

export function AgentView({ events }: { events: EventStream }) {
  const session = useSession(events)
  const latest = session.logs.at(-1)

  return (
    <div className="agent-page">
      <header className="agent-page__head">
        <div>
          <p className="eyebrow">돌다리</p>
          <h1 className="agent-page__title">AI 작업 보기</h1>
        </div>
        <StageNav current={stageOf(Math.max(session.step, 1))} />
      </header>

      <main className="agent-page__body">
        <section className="browser" aria-label="AI가 보고 있는 화면">
          <div className="browser__bar">
            <span className="browser__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="browser__where">{session.screen ? `${session.screen.vendor} 웹사이트` : '대기 중'}</span>
            {session.screen && <span className="pill pill--live">실시간</span>}
          </div>
          {session.screen ? (
            <img className="browser__shot" src={session.screen.url} alt={`${session.screen.vendor} 페이지 화면`} />
          ) : (
            <p className="browser__empty">AI가 일을 시작하면 여기에 화면이 나타나요</p>
          )}
        </section>

        <aside className="agent-page__side">
          <div className="now" role="status">
            <span className="now__label">지금 하는 일</span>
            <p className="now__text">{latest ? `${latest.vendor ? `${latest.vendor} · ` : ''}${latest.text}` : '대기 중'}</p>
          </div>
          <ol className="timeline" aria-label="작업 기록">
            {session.logs.map((log) => (
              <li key={log.id} className="timeline__item">
                <time className="timeline__time">{log.at}</time>
                <p>
                  {log.vendor && <strong>{log.vendor} </strong>}
                  {log.text}
                </p>
              </li>
            ))}
          </ol>
        </aside>
      </main>
    </div>
  )
}
