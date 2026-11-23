// The few Drive v3 calls the backup needs, all in the app's hidden folder (D-054), after the French app's
// src/features/sync/drive.ts. `appDataFolder` is a folder only this app's client ID can see: it does not show in the
// user's Drive, and the `drive.appdata` scope reaches nothing outside it.
//
// Uploads are resumable, because a backup with progress photos can pass the 5 MB limit of a one-request upload.

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

/** Google refused the token: sign in again. */
export class AuthError extends Error {}

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
}

const AUTH_REASONS = new Set(['authError', 'insufficientPermissions', 'forbidden'])

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
  if (response.ok) return response
  const { reason, message } = await errorOf(response)
  const said = `Google Drive said ${response.status}${message ? `: ${message}` : '.'}`
  // 401 is a dead token; a 403 is about the token only for these reasons. Any other 403 (the Drive API not enabled in
  // the Cloud project, a quota) would not be cured by signing in again, so it shows as it is.
  if (response.status === 401 || (reason && AUTH_REASONS.has(reason))) throw new AuthError(said)
  throw new Error(said)
}

async function errorOf(response: Response): Promise<{ reason?: string; message?: string }> {
  try {
    const body = (await response.json()) as { error?: { message?: string; errors?: { reason?: string }[] } }
    return { reason: body.error?.errors?.[0]?.reason, message: body.error?.message }
  } catch {
    return {}
  }
}

/** The files in the app folder whose name starts with `prefix`. */
export async function listFiles(token: string, prefix: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name contains '${prefix.replace(/'/g, "\\'")}' and trashed = false`,
    fields: 'files(id,name,modifiedTime)',
    pageSize: '100',
  })
  const r = await call(token, `${API}/files?${params}`)
  const body = (await r.json()) as { files?: DriveFile[] }
  return (body.files ?? []).filter((f) => f.name.startsWith(prefix))
}

export async function readText(token: string, id: string): Promise<string> {
  const r = await call(token, `${API}/files/${encodeURIComponent(id)}?alt=media`)
  return r.text()
}

/**
 * Writes `text` as a JSON file: a new file in the app folder when `id` is undefined, else that file's new content.
 * Resolves with the file's id.
 */
export async function writeText(token: string, name: string, text: string, id?: string): Promise<string> {
  const metadata = id ? {} : { name, parents: ['appDataFolder'], mimeType: 'application/json' }
  const start = await call(
    token,
    id
      ? `${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=resumable&fields=id`
      : `${UPLOAD}/files?uploadType=resumable&fields=id`,
    {
      method: id ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    },
  )
  const session = start.headers.get('Location')
  if (!session) throw new Error('Google Drive gave no upload address.')
  const done = await call(token, session, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: text,
  })
  return ((await done.json()) as { id: string }).id
}
