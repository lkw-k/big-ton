import { useLayoutEffect, useRef, type RefObject } from 'react'

const DURATION_MS = 700

/**
 * FLIP 재정렬 애니메이션 (DOM 전용). 순서 계산은 session/ranking.ts가 하고, 여기서는 이전 위치에서 새 위치로 옮겨 보이게만 한다.
 * [data-flip-key] 요소의 위치를 렌더마다 기록해 두고, 바뀐 만큼 거꾸로 이동시킨 뒤 원위치로 애니메이션한다.
 */
export function useFlip(container: RefObject<HTMLElement | null>, order: string) {
  const previousTops = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const tops = new Map<string, number>()
    root.querySelectorAll<HTMLElement>('[data-flip-key]').forEach((el) => {
      const key = el.dataset.flipKey!
      const top = el.getBoundingClientRect().top
      tops.set(key, top)
      const before = previousTops.current.get(key)
      if (before === undefined || before === top || reduceMotion || typeof el.animate !== 'function') return
      el.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'translateY(0)' }], {
        duration: DURATION_MS,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      })
    })
    previousTops.current = tops
  }, [container, order])
}
