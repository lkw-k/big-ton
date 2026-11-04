// 시연용 가짜 업체 페이지 스크린샷 (SVG data URI). 실제 서비스에서는 agent가 찍은 스크린샷 URL이 온다.

interface ScreenSpec {
  vendor: string
  url: string
  rows: [string, string][]
  highlight?: number
  footer?: string
}

function page({ vendor, url, rows, highlight, footer }: ScreenSpec): string {
  const rowSvg = rows
    .map(([label, value], i) => {
      const y = 150 + i * 44
      const mark = i === highlight ? `<rect x="36" y="${y - 28}" width="568" height="40" rx="4" fill="#fff6d6" stroke="#e0b100" stroke-width="2"/>` : ''
      return `${mark}<text x="52" y="${y}" font-size="17" fill="#555">${label}</text><text x="588" y="${y}" font-size="17" fill="#111" text-anchor="end" font-weight="600">${value}</text>`
    })
    .join('')
  const foot = footer
    ? `<rect x="36" y="${150 + rows.length * 44}" width="568" height="46" rx="6" fill="#eef3ff" stroke="#9db4ff" stroke-dasharray="6 4"/><text x="320" y="${178 + rows.length * 44}" font-size="16" fill="#3355aa" text-anchor="middle">${footer}</text>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" font-family="sans-serif">
<rect width="640" height="400" fill="#ffffff"/>
<rect width="640" height="34" fill="#e9ecef"/><circle cx="18" cy="17" r="5" fill="#ff6159"/><circle cx="34" cy="17" r="5" fill="#ffbd2e"/><circle cx="50" cy="17" r="5" fill="#28c941"/>
<rect x="70" y="8" width="550" height="18" rx="9" fill="#fff"/><text x="82" y="22" font-size="12" fill="#666">${url}</text>
<text x="36" y="82" font-size="26" font-weight="700" fill="#1d3557">${vendor}</text><text x="36" y="108" font-size="14" fill="#888">주문제작 도어락 견적 안내</text>
${rowSvg}${foot}
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const SCREENS = {
  bQuote: page({
    vendor: 'B업체',
    url: 'https://b-vendor.example/quote',
    rows: [['견적 총액 (10개)', '1,290,000원'], ['설치', '포함'], ['배송', '무료'], ['A/S', '24개월']],
  }),
  bLeadTime: page({
    vendor: 'B업체',
    url: 'https://b-vendor.example/delivery',
    rows: [['제작 기간', '영업일 9일'], ['배송 기간', '3일'], ['예상 납기', '12일']],
    highlight: 2,
  }),
  cQuote: page({
    vendor: 'C업체',
    url: 'https://c-vendor.example/estimate',
    rows: [['견적 총액 (10개)', '1,240,000원'], ['납기', '14일'], ['배송비', '무료'], ['설치', '별도 문의']],
    highlight: 3,
  }),
  cInstall: page({
    vendor: 'C업체',
    url: 'https://c-vendor.example/install',
    rows: [['방문 설치', '1식 100,000원'], ['설치 지역', '수도권']],
    highlight: 0,
  }),
}

/** 업체 주문 폼을 채운 화면. 제출 버튼 직전에서 멈춘 상태. */
export function formScreen(vendor: string, domain: string, rows: [string, string][]): string {
  return page({ vendor, url: `https://${domain}/order`, rows, footer: '[ 주문 접수 ] 직전에서 멈춤 · 제출은 사용자가 직접' })
}
