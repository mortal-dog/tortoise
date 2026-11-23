// The library screens in a memory router: search, the area and video filters, an exercise page and a source page.
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'

async function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  await act(() => router.load())
  render(<RouterProvider router={router} />)
  return router
}

function names(): string[] {
  const list = screen.queryByRole('list', { name: 'Exercises' })
  if (!list) return []
  return within(list)
    .getAllByRole('link')
    .map((a) => a.querySelector('span span')?.textContent ?? '')
}

describe('the library list', () => {
  it('lists every exercise, then narrows to a search', async () => {
    const router = await renderAt('/library')
    expect(await screen.findByText('80 exercises')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search exercises' }), {
      target: { value: 'hollow' },
    })
    // Name matches first, then the exercises whose texts say "hollow" (the dead bug's why, the handstand's line).
    await screen.findByText(/^[3-9] exercises$/)
    expect(names().slice(0, 2)).toEqual(['Hollow hold', 'Hollow rock'])
    expect(names()).toContain('Dead bug')
    expect(router.state.location.search).toEqual({ q: 'hollow' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Search exercises' }), {
      target: { value: 'hollow rock' },
    })
    expect(await screen.findByText('1 exercise')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear the search' }))
    expect(await screen.findByText('80 exercises')).toBeInTheDocument()
  })

  it('filters by area and by video, and says when nothing matches', async () => {
    await renderAt('/library')
    await screen.findByText('80 exercises')
    fireEvent.click(screen.getByRole('button', { name: 'Playground' }))
    expect(await screen.findByText('5 exercises')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Playground' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /With video/ }))
    expect(await screen.findByText('1 exercise')).toBeInTheDocument()
    expect(names()).toEqual(['Pull-up'])
    fireEvent.change(screen.getByRole('textbox', { name: 'Search exercises' }), {
      target: { value: 'handstand' },
    })
    expect(
      await screen.findByText('No exercise matches. Try fewer words, or another area.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(await screen.findByText(/^\d+ exercises$/)).toBeInTheDocument()
  })

  it('reads the filters from the address', async () => {
    await renderAt('/library?area=splits&q=side%20split')
    await screen.findByRole('list', { name: 'Exercises' })
    expect(screen.getByRole('textbox', { name: 'Search exercises' })).toHaveValue('side split')
    expect(screen.getByRole('button', { name: 'Splits' })).toHaveAttribute('aria-pressed', 'true')
    expect(names()[0]).toBe('Supported side split')
    expect(names()).not.toContain('Cossack squat')
  })
})

describe('an exercise page', () => {
  it('shows how, cue, mistake, why, its ladder, history, sources and video link', async () => {
    await renderAt('/library/goblet-squat')
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
    for (const h of ['How', 'Key cue', 'Common mistake', 'Why', 'Video', 'Last 10 logs'])
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
    const ladder = screen.getByTestId('ladder-squat')
    expect(within(ladder).getAllByRole('listitem')).toHaveLength(7)
    expect(within(ladder).getByText('Your level')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /How to do a Goblet Squat/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/)
    expect(await screen.findByText(/No logs yet/)).toBeInTheDocument()
  })

  it('shows source chips that open the source', async () => {
    await renderAt('/library/farmer-carry')
    const chip = await screen.findByRole('link', { name: 'leong2015' })
    fireEvent.click(chip)
    expect(await screen.findByRole('heading', { name: 'leong2015' })).toBeInTheDocument()
    expect(screen.getByText(/Each 5 kg less grip strength/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Read the source/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Farmer carry or hold' })).toBeInTheDocument()
  })

  it('asks before setting a level by hand', async () => {
    await renderAt('/library/goblet-squat')
    fireEvent.click(await screen.findByRole('button', { name: 'Set 3 as my level' }))
    expect(screen.getByRole('alertdialog', { name: 'Change level' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('says when an exercise is unknown', async () => {
    await renderAt('/library/no-such-exercise')
    expect(await screen.findByText('This exercise is not in the library.')).toBeInTheDocument()
  })
})
