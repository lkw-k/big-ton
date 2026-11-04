import { useEffect, useState } from 'react'
import { applyTheme, initialTheme, THEME_KEY, type Theme } from '../ui/theme'

/** 라이트 ↔ 다크 전환. 다른 창에서 바꿔도 따라간다. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        setTheme(event.newValue)
        applyTheme(event.newValue)
      }
    }
    window.addEventListener('storage', follow)
    return () => window.removeEventListener('storage', follow)
  }, [])

  const next: Theme = theme === 'light' ? 'dark' : 'light'
  return (
    <button
      type="button"
      className="btn btn--ghost theme-toggle"
      aria-label={next === 'dark' ? '다크 모드로 바꾸기' : '라이트 모드로 바꾸기'}
      onClick={() => {
        setTheme(next)
        applyTheme(next, true)
      }}
    >
      <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
      {next === 'dark' ? '다크' : '라이트'}
    </button>
  )
}
