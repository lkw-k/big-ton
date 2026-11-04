// 데이터 공급원 선택은 여기서만 한다. 기본은 시연(demo), ?live면 실제 backend.
import { createDemoSession } from './demo/demoSession'
import { liveDispatch } from './source/liveDispatch'
import { createLiveEvents } from './source/liveEvents'
import { createLiveInterview } from './source/liveInterview'
import type { DispatchApi, EventStream, InterviewApi } from './source/types'

export interface Environment {
  mode: 'demo' | 'live'
  interview: InterviewApi
  dispatch: DispatchApi
  /** 인터뷰가 끝난 세션의 이벤트 흐름을 연다. */
  open(sessionId: string): EventStream
}

export function createEnvironment(
  search: string = window.location.search,
  ...demoOptions: Parameters<typeof createDemoSession>
): Environment {
  if (new URLSearchParams(search).has('live')) {
    return { mode: 'live', interview: createLiveInterview(), dispatch: liveDispatch, open: (id) => createLiveEvents(id) }
  }
  const demo = createDemoSession(...demoOptions)
  return {
    mode: 'demo',
    interview: demo.interview,
    dispatch: demo.dispatch,
    open() {
      demo.startCollection()
      return demo.events
    },
  }
}
