// The Drive sync's conflict dialog (D-071): two sides with progress on different plans; the user chooses, confirms,
// and types REPLACE when the replaced side holds more or older history. Invented values only.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConflictDialog } from '@/components/SyncConflictDialog'
import type { Conflict } from '@/lib/sync/sync'

const conflict: Conflict = {
  remote: {
    startDate: '2026-11-09',
    activeDays: 40,
    firstDay: '2026-11-03',
    lastDay: '2026-12-20',
    badges: 6,
    progress: true,
  },
  local: {
    startDate: '2026-11-30',
    activeDays: 1,
    firstDay: '2026-11-24',
    lastDay: '2026-11-24',
    badges: 0,
    progress: true,
  },
}

function setup() {
  const onChoose = vi.fn(async () => undefined)
  const onSignOut = vi.fn(async () => undefined)
  render(<ConflictDialog conflict={conflict} onChoose={onChoose} onSignOut={onSignOut} />)
  return { user: userEvent.setup(), onChoose, onSignOut }
}

describe('the sync conflict dialog', () => {
  it('shows both sides and marks the one with more days', () => {
    setup()
    expect(screen.getByRole('alertdialog', { name: 'Which progress do you keep?' })).toBeInTheDocument()
    const drive = screen.getByRole('region', { name: 'Google Drive' })
    const here = screen.getByRole('region', { name: 'This device' })
    expect(drive).toHaveTextContent('Week 1: Mon 9 Nov 2026')
    expect(drive).toHaveTextContent('40 days done')
    expect(drive).toHaveTextContent('6 badges')
    expect(drive).toHaveTextContent('More')
    expect(here).toHaveTextContent('1 day done')
    expect(here).not.toHaveTextContent('More')
  })

  it('replacing the smaller side asks once, with no typing', async () => {
    const { user, onChoose } = setup()
    await user.click(screen.getByRole('button', { name: "Use Google Drive's" }))
    expect(
      screen.getByRole('heading', { name: "Replace this device's records with Google Drive's?" }),
    ).toBeVisible()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('This device loses 1 day done')
    expect(screen.queryByTestId('loses-more')).toBeNull()
    await user.click(screen.getByRole('button', { name: "Replace this device's" }))
    expect(onChoose).toHaveBeenCalledWith('remote')
  })

  it('replacing the side with more and older history needs REPLACE typed, and Back returns', async () => {
    const { user, onChoose } = setup()
    await user.click(screen.getByRole('button', { name: "Keep this device's" }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Google Drive loses 40 days done')
    expect(screen.getByTestId('loses-more')).toHaveTextContent('Google Drive holds more or older progress')
    const replace = screen.getByRole('button', { name: "Replace Google Drive's" })
    expect(replace).toBeDisabled()
    await user.type(screen.getByLabelText('Type REPLACE to confirm'), 'replace')
    expect(replace).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onChoose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: "Keep this device's" }))
    expect(screen.getByLabelText('Type REPLACE to confirm')).toHaveValue('')
    await user.type(screen.getByLabelText('Type REPLACE to confirm'), 'REPLACE')
    await user.click(screen.getByRole('button', { name: "Replace Google Drive's" }))
    expect(onChoose).toHaveBeenCalledWith('local')
  })

  it('can sign out instead', async () => {
    const { user, onChoose, onSignOut } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign out of Google instead' }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
    expect(onChoose).not.toHaveBeenCalled()
  })
})
