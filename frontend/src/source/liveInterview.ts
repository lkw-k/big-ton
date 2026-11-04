import type { Answer, CreateSessionResponse, Requirements } from '../contract'
import type { InterviewApi } from './types'

/** backend 인터뷰 API (POST /api/sessions, POST /api/sessions/{id}/answers). */
export function createLiveInterview(fetchImpl: typeof fetch = fetch): InterviewApi {
  async function post<T>(url: string, body: unknown, failure: string): Promise<T> {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`${failure} (상태 ${response.status})`)
    return (await response.json()) as T
  }

  return {
    start: (item) => post<CreateSessionResponse>('/api/sessions', { item }, '인터뷰 시작 실패'),
    answer: (sessionId, answers: Answer[]) =>
      post<Requirements>(`/api/sessions/${sessionId}/answers`, { answers }, '답변 정리 실패'),
  }
}
