import type { ReactNode } from 'react'

/** 화면 맨 위 "지금 할 일" 안내. 한 줄 설명 + 큰 버튼 하나. */
export function NextAction({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <section className="next" aria-label="지금 할 일">
      <div>
        <p className="next__label">지금 할 일</p>
        <h2 className="next__title">{title}</h2>
        {detail && <p className="next__detail">{detail}</p>}
      </div>
      {action}
    </section>
  )
}
