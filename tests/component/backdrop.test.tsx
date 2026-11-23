// The backdrop (D-048, D-053): it drifts, with no raindrops, and stands still when the system asks for reduced motion.
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Backdrop } from '@/components/Backdrop'

function reduceMotion(on: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: on && query.includes('reduced-motion'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  )
}

describe('the backdrop', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drifts, with no raindrops', () => {
    reduceMotion(false)
    render(<Backdrop />)
    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-still')
    expect(screen.queryByTestId('rain')).toBeNull()
  })

  it('stands still when the system asks for reduced motion', () => {
    reduceMotion(true)
    render(<Backdrop />)
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-still')
  })
})
