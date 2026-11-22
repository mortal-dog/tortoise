// The backdrop (D-048): raindrops only where asked, nothing moving when the switch is off or motion is reduced.
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Backdrop } from '@/components/Backdrop'
import { setMovingBackdrop } from '@/lib/effects'

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
  beforeEach(() => {
    // jsdom draws nothing; the rain gives up quietly without a 2D context.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    reduceMotion(false)
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('rains on the screens that ask for it, and drifts', () => {
    render(<Backdrop rain />)
    expect(screen.getByTestId('rain')).toBeInTheDocument()
    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-still')
  })

  it('has no raindrops elsewhere', () => {
    render(<Backdrop rain={false} />)
    expect(screen.queryByTestId('rain')).toBeNull()
  })

  it('stands still, without rain, when the switch is turned off, and moves again when it is on', () => {
    render(<Backdrop rain />)
    act(() => setMovingBackdrop(false))
    expect(screen.queryByTestId('rain')).toBeNull()
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-still')
    expect(localStorage.getItem('tortoise.movingBackdrop')).toBe('0')
    act(() => setMovingBackdrop(true))
    expect(screen.getByTestId('rain')).toBeInTheDocument()
  })

  it('stands still when the system asks for reduced motion', () => {
    reduceMotion(true)
    render(<Backdrop rain />)
    expect(screen.queryByTestId('rain')).toBeNull()
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-still')
  })
})
