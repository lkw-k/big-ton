import { useEffect, useRef, useState } from 'react'
import { rankChanges } from '../session/ranking'

const VISIBLE_MS = 3000
const SEPARATOR = '\u0000'

/** 순서가 바뀌면 업체별 순위 변화(▲▼)를 잠깐 보여 준다. */
export function useRankChanges(order: string[]): Record<string, number> {
  // 배열은 렌더마다 새로 만들어지므로 문자열 키로 바뀜을 감지한다.
  const key = order.join(SEPARATOR)
  const previous = useRef(order)
  const [changes, setChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    const current = key === '' ? [] : key.split(SEPARATOR)
    const next = rankChanges(previous.current, current)
    previous.current = current
    if (Object.values(next).every((delta) => delta === 0)) return
    setChanges(next)
    const timer = setTimeout(() => setChanges({}), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [key])

  return changes
}
