import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { MailDraft } from '../contract'
import type { DispatchApi } from '../source/types'
import { DispatchPanel } from './DispatchPanel'

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
  return {
    requestDraft: vi.fn(async () => {}),
    getDraft: vi.fn(getDraft),
    approve: vi.fn(async () => {}),
  }
}

describe('DispatchPanel', () => {
  test('메일은 미리보기를 보여 준 뒤 승인을 눌러야만 발송된다', async () => {
    const api = fakeApi()
    render(<DispatchPanel api={api} approvals={[{ kind: 'send_mail', draft_id: 'draft-negotiation-a' }]} selectedVendor={null} />)

    expect(await screen.findByText('sales@a-vendor.example')).toBeInTheDocument()
    expect(screen.getByText('[견적 문의] 설치비 조정 요청')).toBeInTheDocument()
    expect(screen.getByText('B업체는 설치 포함 1,290,000원을 제시했습니다.')).toBeInTheDocument()
    expect(screen.getByText('B업체 보정 총액 1,290,000원')).toBeInTheDocument()
    expect(api.approve).not.toHaveBeenCalled()
    expect(screen.queryByText('발송됨')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '승인하고 발송' }))

    expect(await screen.findByText('발송됨')).toBeInTheDocument()
    expect(api.approve).toHaveBeenCalledTimes(1)
    expect(api.approve).toHaveBeenCalledWith('draft-negotiation-a')
    expect(screen.queryByRole('button', { name: '승인하고 발송' })).not.toBeInTheDocument()
  })

  test('초안을 불러오기 전에는 승인 버튼이 없다 (미리보기 생략 불가)', async () => {
    let resolve!: (d: MailDraft) => void
    const api = fakeApi(() => new Promise((r) => (resolve = r)))
    render(<DispatchPanel api={api} approvals={[{ kind: 'send_mail', draft_id: 'd1' }]} selectedVendor={null} />)

    expect(screen.queryByRole('button', { name: '승인하고 발송' })).not.toBeInTheDocument()

    await act(async () => resolve(draft))
    expect(screen.getByRole('button', { name: '승인하고 발송' })).toBeInTheDocument()
  })

  test('업체 폼은 제출 직전까지만 보여 주고 제출 버튼이 없다', () => {
    render(<DispatchPanel api={fakeApi()} approvals={[{ kind: 'submit_form', draft_id: 'form-c' }]} selectedVendor={null} />)

    expect(screen.getByText(/제출 직전에서 멈췄습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /제출/ })).not.toBeInTheDocument()
  })

  test('업체를 고르기 전에는 초안을 만들 수 없고, 고르면 빅딜 걸기로 협상 초안을 요청한다', () => {
    const api = fakeApi()
    const { rerender } = render(<DispatchPanel api={api} approvals={[]} selectedVendor={null} />)

    expect(screen.getByRole('button', { name: '빅딜 걸기' })).toBeDisabled()

    rerender(<DispatchPanel api={api} approvals={[]} selectedVendor="A업체" />)
    fireEvent.click(screen.getByRole('button', { name: '빅딜 걸기' }))

    expect(api.requestDraft).toHaveBeenCalledWith('A업체', 'negotiation')
  })
})
