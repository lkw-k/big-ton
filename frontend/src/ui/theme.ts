// 라이트/다크 테마. 처음에는 운영체제 설정을 따르고, 사용자가 바꾸면 기억한다 (새 창도 같은 값을 쓴다).
export type Theme = 'light' | 'dark'

const KEY = 'doldari-theme'

export function initialTheme(): Theme {
  const stored = localStorage.getItem(KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme, remember = false) {
  document.documentElement.dataset.theme = theme
  if (remember) localStorage.setItem(KEY, theme)
}

export const THEME_KEY = KEY
