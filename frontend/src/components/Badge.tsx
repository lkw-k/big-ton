type Tone = 'confirmed' | 'estimated' | 'unknown' | 'info'

const LABEL: Record<Exclude<Tone, 'info'>, string> = {
  confirmed: '확정',
  estimated: '추정',
  unknown: '미확인',
}

/** 상태 배지. 색과 글자를 함께 써서 색만으로 구분하지 않는다. */
export function Badge({ tone, children }: { tone: Tone; children?: string }) {
  return <span className={`badge badge--${tone}`}>{children ?? (tone === 'info' ? '' : LABEL[tone])}</span>
}
