import type { SessionState } from '../session/reducer'

interface AgentPreviewProps {
  screen: SessionState['screen']
  logs: SessionState['logs']
  onOpen: () => void
}

/** AI 작업 화면 미리보기. 누르면 새 창에서 크게 본다. */
export function AgentPreview({ screen, logs, onOpen }: AgentPreviewProps) {
  const recent = logs.slice(-3).reverse()
  return (
    <section className="card agent-preview" aria-label="AI 작업 화면">
      <header className="card__head">
        <h3 className="card__title">AI가 지금 보는 화면</h3>
        {screen && <span className="pill pill--live">실시간</span>}
      </header>
      <button type="button" className="agent-preview__shot" onClick={onOpen} aria-label="AI 작업 화면 새 창에서 크게 보기">
        {screen ? (
          <img src={screen.url} alt={`${screen.vendor} 페이지 화면`} />
        ) : (
          <span className="agent-preview__empty">AI가 일을 시작하면 화면이 나타나요</span>
        )}
        <span className="agent-preview__open">새 창에서 크게 보기 ↗</span>
      </button>
      {recent.length > 0 && (
        <ol className="agent-preview__recent" aria-label="최근 작업">
          {recent.map((log) => (
            <li key={log.id}>
              {log.vendor && <strong>{log.vendor} </strong>}
              {log.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
