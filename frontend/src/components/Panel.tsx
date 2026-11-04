import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  status?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** 대시보드 패널 틀: 제목줄 + 본문. */
export function Panel({ title, status, actions, className, children }: PanelProps) {
  return (
    <section className={`panel ${className ?? ''}`} aria-label={title}>
      <header className="panel__head">
        <h2 className="panel__title">{title}</h2>
        {status}
        {actions && <div className="panel__actions">{actions}</div>}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
