import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { FollowUpPanel } from './FollowUpPanel'
import { RecommendationPanel } from './RecommendationPanel'

describe('FollowUpPanel', () => {
  test('업체별로 확인 질문과 대상 항목을 보여 준다', () => {
    render(
      <FollowUpPanel
        followUps={[
          { vendor: 'A업체', field: 'install_included', question: '설치비가 견적에 포함되어 있나요?' },
          { vendor: 'A업체', field: 'warranty_months', question: 'A/S 기간은 얼마인가요?' },
          { vendor: 'C업체', field: 'lead_time_days', question: '납기는 며칠인가요?' },
        ]}
      />,
    )

    const groupA = screen.getByRole('list', { name: 'A업체 확인 질문' })
    expect(within(groupA).getAllByRole('listitem')).toHaveLength(2)
    expect(within(groupA).getByText('설치 여부')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'C업체 확인 질문' })).toHaveTextContent('납기는 며칠인가요?')
  })

  test('질문이 없으면 무엇을 기다리는지 알려 준다', () => {
    render(<FollowUpPanel followUps={[]} />)

    expect(screen.getByText('견적에 빠진 내용이 있으면 업체에 물어볼 질문을 만들어 드려요')).toBeInTheDocument()
  })
})

describe('RecommendationPanel', () => {
  test('추천 업체, 적합도 점수, 이유를 보여 준다', () => {
    render(
      <RecommendationPanel
        recommendation={{ vendor: 'B업체', score: 82, reasons: ['설치 포함 보정 총액이 가장 낮음', 'A/S 24개월 확인됨'] }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'B업체' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: '조건 일치도' })).toHaveAttribute('aria-valuenow', '82')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  test('추천 전에는 빈 상태를 보여 준다', () => {
    render(<RecommendationPanel recommendation={null} />)

    expect(screen.getByText('비교가 끝나면 요구 조건에 가장 잘 맞는 업체를 추천해 드려요')).toBeInTheDocument()
  })
})
