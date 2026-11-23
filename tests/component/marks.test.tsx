import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusMark } from '@/components/StatusMark'

describe('status marks', () => {
  it('give every status its own label and shape', () => {
    const { container } = render(
      <div>
        {(['full', 'shell', 'missed', 'ahead'] as const).map((s) => (
          <StatusMark key={s} status={s} />
        ))}
      </div>,
    )
    for (const name of ['Full day', 'Shell day', 'Missed', 'Ahead']) {
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
    }
    const shapes = [...container.querySelectorAll('svg')].map((svg) => svg.innerHTML)
    expect(new Set(shapes).size).toBe(4)
  })
})
