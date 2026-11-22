// Handing a file to the phone (design §2, Files): the share sheet when it takes files, otherwise a plain download.

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'needs-tap'

/** Saves a file through a download link: the fallback, and "open the file" for the calendar (design §9). */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.rel = 'noopener'
  document.body.append(a)
  a.click()
  a.remove()
  // Long enough for the browser to take the file.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] }) === true
  } catch {
    return false
  }
}

/**
 * The share sheet with the file, falling back to a download. "needs-tap" means the browser refused because the tap
 * that started it had expired (work before the share took too long): the caller offers a second button.
 */
export async function shareOrDownload(file: File, title: string): Promise<ShareOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      const name = (e as { name?: string }).name
      if (name === 'AbortError') return 'cancelled'
      if (name === 'NotAllowedError') return 'needs-tap'
      // Any other failure: fall through to the download.
    }
  }
  downloadFile(file)
  return 'downloaded'
}
