import { useEffect, useRef } from 'react'
import type { LogEntry } from '../session/reducer'

/** 작업 로그 스트림. 새 줄이 오면 맨 아래로 따라간다. */
export function ActivityLog({ logs }: { logs: LogEntry[] }) {
  const end = useRef<HTMLLIElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' })
  }, [logs.length])

  if (logs.length === 0) {
    return <p className="empty">작업이 시작되면 에이전트가 하는 일이 한 줄씩 기록됩니다</p>
  }
  return (
    <ol className="log" aria-live="polite">
      {logs.map((log, index) => (
        <li key={log.id} className="log__line" ref={index === logs.length - 1 ? end : undefined}>
          <time className="log__time">{log.at}</time>
          {log.vendor && <span className="log__vendor">{log.vendor}</span>}
          <span className="log__text">{log.text}</span>
        </li>
      ))}
    </ol>
  )
}
