import type { DispatchApi } from './types'

// 메일 초안·승인·발송 API는 backend 9-1, 10-1에서 만든다. 그 전까지 실서비스 모드에서는 명확히 실패한다.
const notConnected = async (): Promise<never> => {
  throw new Error('발송 기능은 아직 backend에 연결되지 않았습니다. 시연 모드에서 확인하세요.')
}

export const liveDispatch: DispatchApi = {
  requestDraft: notConnected,
  getDraft: notConnected,
  approve: notConnected,
}
