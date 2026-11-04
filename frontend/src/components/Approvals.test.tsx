import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import type { MailDraft } from '../contract'
import type { Approval } from '../session/reducer'
import type { DispatchApi } from '../source/types'
import { Approvals } from './Approvals'

const draft: MailDraft = {
  draft_id: 'draft-negotiation-a',
  kind: 'negotiation',
  vendor: 'A업체',
  to: 'sales@a-vendor.example',
  subject: '[견적 문의] 설치비 조정 요청',
  body: 'B업체는 설치 포함 1,290,000원을 제시했습니다.',
  citations: [{ vendor: 'B업체', field: 'adjusted_total', value: 1290000 }],
}

function fakeApi(getDraft: DispatchApi['getDraft'] = async () => draft) {
  return { requestDraft: vi.fn(async () => {}), getDraft: vi.fn(getDraft), approve: vi.fn(async () => {}) }
}

function Harness({ api, approvals }: { api: DispatchApi; approvals: Approval[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set())
  return <Approvals api={api} approvals={approvals} sent={sent} onSent={(id) => setSent(new Set([...sent, id]))} />
}

const mail: Approval = { kind: 'send_mail', draft_id: 'draft-negotiation-a', step: 6 }

describe('Approvals', () => {
  test('메일은 미리보기를 보여 준 뒤 보내기를 눌러야만 발송된다', async () => {
    const api = fakeApi()
    render(<Harness api={api} approvals={[mail]} />)

    expect(await screen.findByText('sales@a-vendor.example')).toBeInTheDocument()
    expect(screen.getByText('[견적 문의] 설치비 조정 요청')).toBeInTheDocument()
    expect(screen.getByText('B업체 실제 예상 비용 1,290,000원')).toBeInTheDocument()
    expect(screen.getByText('내 확인 필요')).toBeInTheDocument()
    expect(api.approve).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '보내기' }))

    expect(await screen.findByText('보냄')).toBeInTheDocument()
    expect(api.approve).toHaveBeenCalledTimes(1)
    expect(api.approve).toHaveBeenCalledWith('draft-negotiation-a')
    expect(screen.queryByRole('button', { name: '보내기' })).not.toBeInTheDocument()
  })

  test('초안을 불러오기 전에는 보내기 버튼이 없다 (미리보기 생략 불가)', async () => {
    let resolve!: (d: MailDraft) => void
    const api = fakeApi(() => new Promise((r) => (resolve = r)))
    render(<Harness api={api} approvals={[mail]} />)

    expect(screen.queryByRole('button', { name: '보내기' })).not.toBeInTheDocument()

    await act(async () => resolve(draft))
    expect(screen.getByRole('button', { name: '보내기' })).toBeInTheDocument()
  })

  test('업체 주문서는 제출 직전까지만 보여 주고 제출 버튼이 없다', () => {
    render(<Harness api={fakeApi()} approvals={[{ kind: 'submit_form', draft_id: 'form-c', step: 6 }]} />)

    expect(screen.getByText(/제출 직전까지 채워 뒀어요/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /제출/ })).not.toBeInTheDocument()
  })
})
