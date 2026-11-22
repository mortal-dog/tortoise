import { Download, Upload } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import {
  BackupError,
  type BackupFile,
  type BackupPreview,
  type ImportMode,
  type PreparedBackup,
  parseBackup,
  previewBackup,
} from '@/lib/backup'
import { formatLong, localDateOf } from '@/lib/dates'
import type { SettingsRecord } from '@/lib/records'
import { backupSaved, importBackupFile, prepareBackupFile, saveSettings } from '@/lib/repo'
import { type ShareOutcome, shareOrDownload } from '@/lib/share'
import { Button, Card } from '../ui'
import { inputClass, SectionTitle } from './fields'

const INTERVALS = [7, 14, 30, 60, 90] as const

function dateOfInstant(iso: string): string {
  return formatLong(localDateOf(new Date(iso)))
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function countsText(p: BackupPreview): string {
  const c = p.counts
  return [
    plural(c.days, 'day'),
    plural(c.logs, 'exercise log'),
    plural(c.levels, 'ladder level'),
    plural(c.tests, 'test'),
    plural(c.overrides, 'week with swaps', 'weeks with swaps'),
    plural(c.milestones, 'milestone'),
    c.settings ? 'settings' : 'no settings',
  ].join(', ')
}

/** Settings → Backup (design §3.7, §10): export, import with a preview, the last backup date and the interval. */
export function BackupCard({ settings }: { settings: SettingsRecord }) {
  const [exportState, setExportState] = useState<'idle' | 'working' | ShareOutcome | 'failed'>('idle')
  const [pending, setPending] = useState<PreparedBackup | null>(null)
  const [incoming, setIncoming] = useState<{ file: BackupFile; preview: BackupPreview; name: string } | null>(
    null,
  )
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const send = async (prepared: PreparedBackup) => {
    const file = new File([prepared.text], prepared.name, { type: 'application/json' })
    const outcome = await shareOrDownload(file, 'Tortoise backup')
    if (outcome === 'shared' || outcome === 'downloaded') {
      await backupSaved(prepared)
      setPending(null)
    } else if (outcome === 'needs-tap') {
      setPending(prepared)
    }
    setExportState(outcome)
  }

  const backUp = async () => {
    setExportState('working')
    try {
      await send(await prepareBackupFile())
    } catch (e) {
      console.error(e)
      setExportState('failed')
    }
  }

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    setImportError('')
    setImportDone('')
    setIncoming(null)
    if (!f) return
    try {
      const file = parseBackup(await f.text())
      setIncoming({ file, preview: previewBackup(file), name: f.name })
    } catch (err) {
      setImportError(err instanceof BackupError ? err.message : 'This file could not be read.')
    }
  }

  const apply = async (mode: ImportMode) => {
    if (!incoming) return
    setImporting(true)
    try {
      const r = await importBackupFile(incoming.file, mode)
      setImportDone(
        mode === 'replace'
          ? `Replaced: ${plural(r.written, 'record')} from the backup.`
          : `Merged: ${plural(r.written, 'record')} taken from the backup, ${plural(r.kept, 'record')} kept from this phone.`,
      )
      setIncoming(null)
    } catch (err) {
      console.error(err)
      setImportError('The import failed, and nothing was changed.')
    } finally {
      setImporting(false)
    }
  }

  const last = settings.backup.lastAt
  return (
    <Card id="backup">
      <SectionTitle>Backup</SectionTitle>
      <p className="mt-1 text-sm" data-testid="last-backup">
        {last ? `Last backup: ${dateOfInstant(last)}.` : 'No backup yet.'} The data lives only on this phone;
        a backup file is the copy that survives a lost phone.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void backUp()} disabled={exportState === 'working'}>
          <Download aria-hidden className="size-4" /> Back up now
        </Button>
        <Button variant="quiet" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden className="size-4" /> Import a backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Backup file to import"
          onChange={(e) => void pick(e)}
        />
      </div>
      <div aria-live="polite">
        {exportState === 'shared' && <p className="mt-2 text-sm text-primary">Backup shared.</p>}
        {exportState === 'downloaded' && (
          <p className="mt-2 text-sm text-primary">Backup file saved to the downloads.</p>
        )}
        {exportState === 'cancelled' && <p className="mt-2 text-sm">Not saved: the share was cancelled.</p>}
        {exportState === 'failed' && <p className="mt-2 text-sm text-brick">The backup could not be made.</p>}
      </div>
      {exportState === 'needs-tap' && pending && (
        <div className="mt-2">
          <p className="text-sm">The backup is ready. Tap once more to share it.</p>
          <Button className="mt-2" onClick={() => void send(pending)}>
            Share the backup file
          </Button>
        </div>
      )}

      {importError && (
        <p role="alert" className="mt-3 text-sm font-semibold text-brick">
          {importError}
        </p>
      )}
      {importDone && <p className="mt-3 text-sm text-primary">{importDone}</p>}
      {incoming && (
        <div className="mt-3 rounded-xl border border-primary p-3" data-testid="import-preview">
          <p className="text-sm font-semibold">
            Backup of {dateOfInstant(incoming.preview.exportedAt)} (app {incoming.preview.appVersion})
          </p>
          <p className="mt-1 text-sm">{countsText(incoming.preview)}.</p>
          <p className="mt-1 text-sm">
            {incoming.preview.range
              ? `From ${formatLong(incoming.preview.range.from)} to ${formatLong(incoming.preview.range.to)}.`
              : 'No days logged.'}
          </p>
          <p className="mt-2 text-sm">
            <strong>Merge</strong> keeps the newer copy of each record. <strong>Replace</strong> deletes
            everything on this phone first.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={importing} onClick={() => void apply('merge')}>
              Merge
            </Button>
            <Button variant="danger" disabled={importing} onClick={() => void apply('replace')}>
              Replace
            </Button>
            <Button variant="quiet" disabled={importing} onClick={() => setIncoming(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <label className="mt-3 block text-sm">
        Remind me to back up every
        <select
          value={settings.backup.everyDays}
          onChange={(e) => {
            const everyDays = Number(e.target.value)
            void saveSettings((s) => ({ backup: { ...s.backup, everyDays } }))
          }}
          className={inputClass}
        >
          {(INTERVALS as readonly number[]).includes(settings.backup.everyDays) ? null : (
            <option value={settings.backup.everyDays}>{settings.backup.everyDays} days</option>
          )}
          {INTERVALS.map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </label>
    </Card>
  )
}
