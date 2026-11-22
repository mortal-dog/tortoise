import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '../ui'

export const inputClass =
  'mt-1 block min-h-11 w-full rounded-xl border border-line bg-background px-3 text-text'

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-semibold text-primary">{children}</h2>
}

/**
 * A text field that saves on blur. It shows the stored value, keeps what is typed while it has focus, and reports
 * an error from `parse` instead of saving.
 */
export function SavedField({
  label,
  value,
  parse,
  onSave,
  inputMode = 'decimal',
  suffix,
  className,
}: {
  label: string
  value: string
  /** Returns the value to save (undefined clears it) or an error message. */
  parse: (text: string) => { ok: true; value: number | undefined } | { ok: false; error: string }
  onSave: (value: number | undefined) => void
  inputMode?: 'decimal' | 'numeric'
  suffix?: string
  className?: string
}) {
  const [text, setText] = useState(value)
  const [error, setError] = useState('')
  useEffect(() => setText(value), [value])
  return (
    <label className={cn('block text-sm', className)}>
      {label}
      {suffix ? ` (${suffix})` : ''}
      <input
        inputMode={inputMode}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() === value) return
          const r = parse(text.trim())
          if (!r.ok) {
            setError(r.error)
            return
          }
          setError('')
          onSave(r.value)
        }}
        aria-invalid={error ? true : undefined}
        className={inputClass}
      />
      {error && <span className="mt-1 block text-brick">{error}</span>}
    </label>
  )
}

/** A row of buttons that picks one value; the picked one is filled. */
export function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T | undefined
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="mt-2">
      <legend className="text-sm">{legend}</legend>
      <div className="mt-1 flex gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            variant={value === o.value ? 'primary' : 'quiet'}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className="flex-1"
          >
            {o.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

/** A number from a text field: empty clears it; otherwise it must lie in [min, max]. */
export function numberIn(min: number, max: number, what: string, integer = false) {
  return (text: string): { ok: true; value: number | undefined } | { ok: false; error: string } => {
    if (text === '') return { ok: true, value: undefined }
    const n = Number(text.replace(',', '.'))
    if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
      return { ok: false, error: `${what} runs from ${min} to ${max}${integer ? ', a whole number' : ''}.` }
    }
    return { ok: true, value: n }
  }
}

/** A size in bytes for people: never "0" for a size above zero (KB below a MB). */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
