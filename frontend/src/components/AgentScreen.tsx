import type { SessionState } from '../session/reducer'

/** 에이전트가 보고 있는 페이지 스크린샷 (표시용, spec §6). */
export function AgentScreen({ screen }: { screen: SessionState['screen'] }) {
  if (screen === null) {
    return <p className="empty">에이전트가 페이지를 열면 여기에 표시됩니다</p>
  }
  return (
    <figure className="agent-screen">
      <figcaption className="agent-screen__bar">
        <span className="live-dot" aria-hidden="true" />
        {screen.vendor}
      </figcaption>
      <img className="agent-screen__img" src={screen.url} alt={`${screen.vendor} 페이지 화면`} />
    </figure>
  )
}
