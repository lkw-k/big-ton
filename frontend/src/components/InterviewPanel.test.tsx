import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { Answer, CreateSessionResponse, Requirements } from '../contract'
import { createLiveInterview } from '../source/liveInterview'
import type { InterviewApi } from '../source/types'
import { InterviewPanel } from './InterviewPanel'

const started: CreateSessionResponse = {
  session_id: 's-1',
  questions: [
    { field: 'budget', question: '예산은 어느 정도인가요?' },
    { field: 'due_date', question: '언제까지 필요하신가요?' },
    { field: 'need_install', question: '설치도 필요하신가요?' },
    { field: 'quantity', question: '수량은 몇 개인가요?' },
    { field: 'notes', question: '그 밖에 원하시는 조건이 있나요?' },
  ],
}

const extracted: Requirements = {
  item: '주문제작 도어락',
  budget: 1500000,
  due_date: '2026-12-01',
  need_install: null,
  quantity: 10,
  notes: null,
}

function fakeApi(): InterviewApi & { answers: Answer[] } {
  const api = {
    answers: [] as Answer[],
    start: vi.fn(async () => started),
    answer: vi.fn(async (_id: string, answers: Answer[]) => {
      api.answers = answers
      return extracted
    }),
  }
  return api
}

describe('InterviewPanel', () => {
  test('물품 입력 → 질문 5개 → 답변 → Requirements 표시, 미응답은 null로 보내고 미확인으로 표시', async () => {
    const api = fakeApi()
    const onComplete = vi.fn()
    render(<InterviewPanel api={api} onComplete={onComplete} />)

    fireEvent.change(screen.getByLabelText('필요한 물품'), { target: { value: '주문제작 도어락' } })
    fireEvent.click(screen.getByRole('button', { name: '질문 받기' }))

    expect(api.start).toHaveBeenCalledWith('주문제작 도어락')
    expect(await screen.findAllByRole('textbox', { name: /\?$/ })).toHaveLength(5)

    fireEvent.change(screen.getByLabelText('예산은 어느 정도인가요?'), { target: { value: '150만원' } })
    fireEvent.change(screen.getByLabelText('수량은 몇 개인가요?'), { target: { value: '10개' } })
    fireEvent.change(screen.getByLabelText('설치도 필요하신가요?'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: '요구 조건 정리' }))

    expect(api.answers).toEqual([
      { field: 'budget', answer: '150만원' },
      { field: 'due_date', answer: null },
      { field: 'need_install', answer: null },
      { field: 'quantity', answer: '10개' },
      { field: 'notes', answer: null },
    ])
    const summary = await screen.findByRole('list', { name: '요구 조건' })
    expect(within(summary).getByText('1,500,000원')).toBeInTheDocument()
    expect(within(summary).getAllByText('미확인')).toHaveLength(2)
    expect(onComplete).toHaveBeenCalledWith('s-1', extracted)
  })

  test('API가 실패하면 무엇이 실패했는지 보여 준다', async () => {
    const api = fakeApi()
    api.start = vi.fn(async () => {
      throw new Error('인터뷰 시작 실패 (상태 503)')
    })
    render(<InterviewPanel api={api} onComplete={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('필요한 물품'), { target: { value: '도어락' } })
    fireEvent.click(screen.getByRole('button', { name: '질문 받기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('인터뷰 시작 실패 (상태 503)')
  })
})

describe('liveInterview', () => {
  test('backend 인터뷰 API 경로와 본문으로 호출한다', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(started), { status: 201 }))
    const api = createLiveInterview(fetchMock as unknown as typeof fetch)

    expect(await api.start('도어락')).toEqual(started)
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: '도어락' }),
    })
  })

  test('실패 응답은 상태 코드를 담은 오류가 된다', async () => {
    const api = createLiveInterview((async () => new Response('', { status: 404 })) as unknown as typeof fetch)

    await expect(api.answer('s-x', [])).rejects.toThrow('답변 정리 실패 (상태 404)')
  })
})
