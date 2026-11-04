import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

test('앱 타이틀을 렌더링한다', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '돌다리' })).toBeInTheDocument()
})
