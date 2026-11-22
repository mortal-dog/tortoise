import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DayRing } from '@/components/DayRing'
import { StatusMark } from '@/components/StatusMark'

describe('status marks', () => {
  it('give every status its own label and shape', () => {
    const { container } = render(
      <div>
        {(['full', 'shell', 'missed', 'paused', 'ahead'] as const).map((s) => (
          <StatusMark key={s} status={s} />
        ))}
      </div>,
    )
    for (const name of ['Full day', 'Shell day', 'Missed', 'Paused', 'Ahead']) {
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
    }
    const shapes = [...container.querySelectorAll('svg')].map((svg) => svg.innerHTML)
    expect(new Set(shapes).size).toBe(5)
  })
})

describe('the day ring', () => {
  it('shows the count, not only the colour', () => {
    render(<DayRing done={1} />)
    expect(screen.getByRole('img', { name: '1 of 2 parts done' })).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })
})
