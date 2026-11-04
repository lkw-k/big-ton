import { STATUS_TERM, TERMS } from '../ui/terms'

type Tone = 'confirmed' | 'estimated' | 'unknown'

const LABEL: Record<Tone, string> = { ...STATUS_TERM, unknown: TERMS.unknown }

/** 상태 배지. 색과 글자를 함께 써서 색만으로 구분하지 않는다. */
export function Badge({ tone }: { tone: Tone }) {
  return <span className={`badge badge--${tone}`}>{LABEL[tone]}</span>
}
