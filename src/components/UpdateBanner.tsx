import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyUpdate, onUpdateReady } from '@/lib/sw-register'

export function UpdateBanner() {
  const [ready, setReady] = useState(false)
  useEffect(() => onUpdateReady(setReady), [])
  if (!ready) return null
  return (
    <div
      role="status"
      className="mx-4 mt-2 flex items-center gap-3 rounded-xl border border-sky bg-surface px-4 py-3 text-text"
    >
      <RefreshCw aria-hidden className="size-5 shrink-0 text-sky" />
      <span className="flex-1 text-sm">A new version of Tortoise is ready.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary"
      >
        Update
      </button>
    </div>
  )
}
