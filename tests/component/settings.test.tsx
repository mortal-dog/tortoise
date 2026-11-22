import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BackupCard } from '@/components/settings/BackupCard'
import { formatBytes } from '@/components/settings/fields'
import { ResetCard } from '@/components/settings/ResetCard'
import { SettingsRecord } from '@/lib/records'

const settings = SettingsRecord.parse({ key: 'settings', updatedAt: '2026-12-01T12:00:00Z' })

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

describe('the backup card', () => {
  it('refuses a malformed file with a clear message', async () => {
    const user = userEvent.setup()
    render(<BackupCard settings={settings} />)
    expect(screen.getByTestId('last-backup')).toHaveTextContent('No backup yet.')
    const bad = new File(['{"format":"tortoise-backup","version":1,"stores":{}}'], 'bad.json', {
      type: 'application/json',
    })
    await user.upload(screen.getByLabelText('Backup file to import'), bad)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/This backup is damaged/))
    expect(screen.queryByTestId('import-preview')).not.toBeInTheDocument()
  })
})

describe('sizes', () => {
  it('never read 0 for a size above zero', () => {
    expect(formatBytes(0)).toBe('0 KB')
    expect(formatBytes(1)).toBe('1 KB')
    expect(formatBytes(412 * 1024)).toBe('412 KB')
    expect(formatBytes(3.5 * 1024 * 1024)).toBe('3.5 MB')
  })
})
