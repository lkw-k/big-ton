import { useEffect, useReducer } from 'react'
import type { SseEvent } from '../contract'
import type { EventStream } from '../source/types'
import { initialState, reduce, type SessionState } from './reducer'

// HH:MM:SS (로그 열 너비 고정용)
const clock = () => new Date().toTimeString().slice(0, 8)

/** 이벤트 흐름을 구독해 세션 상태를 만든다. events가 바뀌면 이전 구독을 닫고 새로 연다. */
export function useSession(events: EventStream | null): SessionState {
  const [state, dispatch] = useReducer(
    (current: SessionState, action: { event: SseEvent; at: string } | 'reset') =>
      action === 'reset' ? initialState : reduce(current, action.event, action.at),
    initialState,
  )

  useEffect(() => {
    if (events === null) return
    dispatch('reset')
    return events.subscribe((event) => dispatch({ event, at: clock() }))
  }, [events])

  return state
}
