import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { Answer, CreateSessionResponse, Requirements } from '../../contract'
import type { InterviewApi } from '../../source/types'
import { ChatInterview } from './ChatInterview'

const started: CreateSessionResponse = {
  session_id: 's-1',
  questions: [
    { field: 'budget', question: '예산은 어느 정도인가요?' },
    { field: 'need_install', question: '설치도 필요하신가요?' },
    { field: 'quantity', question: '수량은 몇 개인가요?' },
  ],
}

const extracted: Requirements = {
  item: '주문제작 도어락',
  budget: 1500000,
  due_date: null,
  need_install: null,
  quantity: 10,
  notes: null,
}

function fakeApi() {
  const api = {
    sent: [] as Answer[],
    start: vi.fn(async () => started),
    answer: vi.fn(async (_id: string, answers: Answer[]) => {
      api.sent = answers
      return extracted
    }),
  }
  return api satisfies InterviewApi & { sent: Answer[] }
}

const chat = () => screen.getByRole('log', { name: '인터뷰 대화' })

describe('ChatInterview', () => {
  test('추천 키워드로 시작하고, 질문이 하나씩 말풍선으로 오며, 모르면 비워 둔다', async () => {
    const api = fakeApi()
    const onComplete = vi.fn()
    render(<ChatInterview api={api} onComplete={onComplete} />)

    expect(within(chat()).getByText(/어떤 물건의 견적이 필요하세요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '주문제작 도어락' }))

    expect(api.start).toHaveBeenCalledWith('주문제작 도어락')
    expect(await within(chat()).findByText('예산은 어느 정도인가요?')).toBeInTheDocument()
    expect(within(chat()).queryByText('설치도 필요하신가요?')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '150만원' }))
    expect(await within(chat()).findByText('설치도 필요하신가요?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '잘 모르겠어요' }))
    fireEvent.change(screen.getByRole('textbox', { name: '답변 입력' }), { target: { value: '10개' } })
    fireEvent.click(screen.getByRole('button', { name: '보내기' }))

    expect(api.sent).toEqual([
      { field: 'budget', answer: '150만원' },
      { field: 'need_install', answer: null },
      { field: 'quantity', answer: '10개' },
    ])
    const summary = await screen.findByRole('list', { name: '요구 조건' })
    expect(within(summary).getByText('1,500,000원')).toBeInTheDocument()
    expect(within(summary).getAllByText('확인 안 됨')).toHaveLength(3)
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '이대로 견적 모으기' }))
    expect(onComplete).toHaveBeenCalledWith('s-1', extracted)
    expect(screen.queryByRole('textbox', { name: '답변 입력' })).not.toBeInTheDocument()
  })

  test('요청이 실패하면 대화 안에서 무엇이 실패했는지 알려 준다', async () => {
    const api = fakeApi()
    api.start = vi.fn(async () => {
      throw new Error('인터뷰 시작 실패 (상태 503)')
    })
    render(<ChatInterview api={api} onComplete={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: '답변 입력' }), { target: { value: '도어락' } })
    fireEvent.click(screen.getByRole('button', { name: '보내기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('인터뷰 시작 실패 (상태 503)')
  })
})
