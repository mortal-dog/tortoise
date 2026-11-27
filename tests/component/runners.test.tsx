// The player's runners (D-072): every countdown is read out at its start, its last three seconds and its end, and
// every rest, side change and lead-in of a timeline can be skipped.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UnitRunner } from '@/components/player/runners'
import { holdSegments, type Unit } from '@/lib/player'

const said = vi.hoisted(() => [] as string[])
vi.mock('@/lib/sound', () => ({
  playTone: () => undefined,
  speak: (text: string) => said.push(text),
}))

function unit(patch: Partial<Unit>): Unit {
  return {
    id: 'u',
    kind: 'reps',
    part: 'main',
    exercises: [{ stepId: 's', exerciseId: 'goblet-squat', name: 'Goblet squat', title: 'Squat' }],
    target: '2 × 8',
    sets: 2,
    restS: 10,
    logged: true,
    ...patch,
  } as Unit
}

/** Moves the fake clock on, one 250-ms tick of the runner's timer at a time. */
async function wait(ms: number) {
  for (let t = 0; t < ms; t += 250) {
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
  }
}

beforeEach(() => {
  said.length = 0
  vi.useFakeTimers({ now: Date.parse('2026-12-01T12:00:00Z') })
})
afterEach(() => vi.useRealTimers())

describe('the spoken countdowns (D-072)', () => {
  it("read a rest between sets from start to end: 'Rest, 10 seconds', three, two, one, go", async () => {
    render(<UnitRunner unit={unit({})} spoken onComplete={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Set done' }))
    expect(said).toEqual(['Rest, 10 seconds'])
    await wait(10_500)
    expect(said).toEqual(['Rest, 10 seconds', 'Three', 'Two', 'One', 'Go'])
    expect(screen.queryByTestId('rest')).toBeNull()
  })

  it('read a timeline: the lead-in counted, each hold started and stopped, its last seconds counted', async () => {
    const segments = holdSegments(2, 5, false, 10)
    render(
      <UnitRunner unit={unit({ kind: 'hold', segments, restS: 10 })} spoken onComplete={() => undefined} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Start/ }))
    await wait(3_000 + 5_000 + 250)
    expect(said).toEqual([
      'Three',
      'Two',
      'One',
      'Go. Hold, 5 seconds',
      'Three',
      'Two',
      'One',
      'Stop. Rest, 10 seconds',
    ])
  })

  it('stay silent with spoken cues off', async () => {
    render(<UnitRunner unit={unit({})} spoken={false} onComplete={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Set done' }))
    await wait(10_500)
    expect(said).toEqual([])
  })
})

describe('skipping in a timeline (D-072)', () => {
  it('skips a rest between holds and goes on to the next hold', async () => {
    const segments = holdSegments(2, 5, false, 60)
    const done = vi.fn()
    render(<UnitRunner unit={unit({ kind: 'hold', segments, restS: 60 })} spoken={false} onComplete={done} />)
    fireEvent.click(screen.getByRole('button', { name: /Start/ }))
    // The lead-in can be skipped too.
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await wait(250)
    expect(screen.getByTestId('segment')).toHaveTextContent('Hold')
    expect(screen.queryByRole('button', { name: /Skip/ })).toBeNull() // no skip inside the work itself
    await wait(5_000)
    expect(screen.getByTestId('segment')).toHaveTextContent('Rest')
    fireEvent.click(screen.getByRole('button', { name: 'Skip the rest' }))
    await wait(250)
    expect(screen.getByTestId('segment')).toHaveTextContent('Hold')
    expect(screen.getByTestId('segment-count')).toHaveTextContent('Set 2 of 2')
    await wait(5_250)
    expect(done).toHaveBeenCalledWith([[{ seconds: 5 }, { seconds: 5 }]])
  })
})
