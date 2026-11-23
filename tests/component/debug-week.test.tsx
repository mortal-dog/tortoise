import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route } from '@/routes/debug.week'

describe('the debug week screen', () => {
  it('draws every day with its sessions from the data', () => {
    const Component = Route.options.component
    if (!Component) throw new Error('no component')
    render(<Component />)
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      expect(screen.getByRole('heading', { name: day })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('heading', { name: /^Morning block/ })).toHaveLength(7)
    expect(screen.getByRole('heading', { name: /^Strength A · 35 min/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Long outdoor · 60–105 min/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /^Both splits, short form/ })).toHaveLength(2)
    expect(screen.getByText('Split block: in the session.')).toBeInTheDocument()
  })
})
