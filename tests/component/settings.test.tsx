import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DriveCard } from '@/components/settings/DriveCard'
import { ResetCard } from '@/components/settings/ResetCard'
import { resetSyncForTests } from '@/lib/sync/sync'

beforeEach(() => {
  localStorage.clear()
  resetSyncForTests()
})

describe('the reset confirmation', () => {
  it('deletes only after DELETE is typed exactly', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn(async () => undefined)
    render(<ResetCard onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: 'Delete all data' }))
    const confirm = screen.getByRole('button', { name: 'Delete everything' })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'delete')
    expect(confirm).toBeDisabled()
    await user.clear(screen.getByLabelText('Type DELETE to confirm'))
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE')
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('can be cancelled', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn(async () => undefined)
    render(<ResetCard onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: 'Delete all data' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Delete all data' })).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })
})

describe('the Google Drive sync card', () => {
  it('signed out, shows only the sign-in button', () => {
    render(<DriveCard />)
    expect(screen.getByRole('heading', { name: 'Google Drive sync' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
    expect(screen.queryByTestId('last-sync')).not.toBeInTheDocument()
    expect(screen.queryByText(/restore|backup file|merge|origin/i)).not.toBeInTheDocument()
  })

  it('signed in, shows the last sync date and time and nothing else to read', () => {
    // Invented values; the tests run in Greenwich's zone.
    localStorage.setItem('tortoise.google', JSON.stringify({ email: 'someone@example.com' }))
    localStorage.setItem('tortoise.drive', JSON.stringify({ lastSync: Date.parse('2026-12-01T09:05:00Z') }))
    resetSyncForTests()
    const { container } = render(<DriveCard />)
    expect(screen.getByTestId('last-sync')).toHaveTextContent('Last sync: Tue 1 Dec 2026, 09:05')
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })
})
