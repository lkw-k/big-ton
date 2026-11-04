// 시연용 답변 정리. 실제로는 backend LLM이 추출한다. 답이 없거나 읽을 수 없으면 null (추측 금지).
import type { Answer, Requirements } from '../contract'

export function extractRequirements(item: string, answers: Answer[]): Requirements {
  const text = (field: Answer['field']) => answers.find((a) => a.field === field)?.answer?.trim() || null
  return {
    item,
    budget: budget(text('budget')),
    due_date: dueDate(text('due_date')),
    need_install: needInstall(text('need_install')),
    quantity: quantity(text('quantity')),
    notes: text('notes'),
  }
}

function budget(answer: string | null): number | null {
  const match = answer?.replace(/,/g, '').match(/(\d+)\s*(만)?/)
  if (!match) return null
  return Number(match[1]) * (match[2] ? 10000 : 1)
}

function dueDate(answer: string | null): string | null {
  return answer?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
}

function needInstall(answer: string | null): boolean | null {
  if (answer === null) return null
  if (/불필요|아니|필요\s*없/.test(answer)) return false
  if (/필요|네|예/.test(answer)) return true
  return null
}

function quantity(answer: string | null): number | null {
  const match = answer?.match(/\d+/)
  return match ? Number(match[0]) : null
}
