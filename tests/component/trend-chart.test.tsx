import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrendChart } from '@/components/progress/TrendChart'
import { addDays } from '@/lib/dates'

describe('the trend chart', () => {
  it('says so with no result', () => {
    render(<TrendChart title="Dead hang" unit="s" points={[]} aim={120} testId="c" />)
    expect(screen.getByTestId('c')).toHaveTextContent('No result yet.')
  })

  it('draws one result as a single marker, with the aim line', () => {
    const { container } = render(
      <TrendChart title="Dead hang" unit="s" points={[{ date: '2026-11-28', value: 35 }]} aim={120} />,
    )
    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(container.querySelector('path')).toBeNull()
    expect(screen.getByTestId('aim-line')).toHaveTextContent('Aim 120 s')
    expect(screen.getByText('Latest: 35 s')).toBeInTheDocument()
  })

  it('draws 300 results (60 years of tests is about 260) as a line with the last marker and a full table', () => {
    const points = Array.from({ length: 300 }, (_, i) => ({
      date: addDays('2026-11-28', i * 84),
      value: 20 + (i % 30),
    }))
    const { container } = render(<TrendChart title="Push-ups" unit="reps" points={points} aim={40} />)
    expect(container.querySelectorAll('path')).toHaveLength(1)
    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(300)
    const d = container.querySelector('path')?.getAttribute('d') ?? ''
    expect(d).not.toContain('NaN')
  })

  it('draws a level history as steps', () => {
    const { container } = render(
      <TrendChart
        title="Squat"
        unit="level"
        step
        points={[
          { date: '2026-11-29', value: 1 },
          { date: '2027-01-10', value: 2 },
          { date: '2027-03-01', value: 2 },
        ]}
      />,
    )
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/H.*V/)
  })
})
