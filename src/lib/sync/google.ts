// Signing in with Google in the browser, for the Drive backup (D-054), after the French app's
// src/features/sync/google.ts. There is no server, so this is Google Identity Services' token model: the page asks
// Google for an access token for the `drive.appdata` scope only, which reaches one hidden folder that belongs to this
// app in the user's Drive and nothing else.
//
// What a browser-only sign-in cannot do: there is no refresh token. A token lasts an hour and is kept in localStorage,
// so a reload within the hour still syncs; after that the next sync asks Google again, and that opens a popup, which a
// browser allows only from a tap. So an expired session waits for a tap ("Sync now"); with consent already given, the
// popup closes by itself.
//
// Google's script is loaded only when the user taps to sign in: until then the app makes no third-party request.

/**
 * The OAuth client ID: the French app's Web client (owner's picker, 2026-11-23). Public by design: it names the app
 * to Google, it is not a secret. Its authorised JavaScript origins must list https://tortoise.doctornova.net (the
 * owner's one step in the Google Cloud console); until they do, Google's popup says "origin_mismatch".
 */
export const GOOGLE_CLIENT_ID = '392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const SCOPE = `${DRIVE_SCOPE} email`
const KEY = 'tortoise.google'

export interface Session {
  email?: string
  accessToken?: string
  /** Unix ms. */
  expiresAt?: number
}

interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
}
interface TokenClient {
  requestAccessToken: (options: { prompt?: string; login_hint?: string }) => void
}
interface Gis {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback?: (error: { type: string; message?: string }) => void
      }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage refused: signed in for this visit only.
  }
}

/** The stored access token, while it has a minute or more left. */
export function liveToken(now: number = Date.now()): string | null {
  const s = readSession()
  if (!s?.accessToken || !s.expiresAt) return null
  return s.expiresAt - 60_000 > now ? s.accessToken : null
}

/** Google refused the token (revoked, or expired early): forget it, stay signed in. */
export function dropToken(): void {
  const s = readSession()
  if (s) writeSession({ email: s.email })
}

let gis: Promise<Gis> | null = null

function loadGis(): Promise<Gis> {
  gis ??= new Promise<Gis>((resolve, reject) => {
    const found = (window as unknown as { google?: Gis }).google
    if (found?.accounts?.oauth2) {
      resolve(found)
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve((window as unknown as { google: Gis }).google)
    script.onerror = () => {
      gis = null
      reject(new Error('Could not reach Google. Check the connection.'))
    }
    document.head.appendChild(script)
  })
  return gis
}

/**
 * Asks Google for a token: the account chooser and consent screen the first time, a popup that closes by itself after
 * that. Call from a tap. Resolves with the token; rejects when the popup is closed or Google refuses.
 */
export async function signIn(): Promise<string> {
  const google = await loadGis()
  const previous = readSession()
  const response = await new Promise<TokenResponse>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: resolve,
      error_callback: (error) =>
        reject(new Error(error.type === 'popup_closed' ? 'Sign-in was closed.' : `Google: ${error.type}.`)),
    })
    client.requestAccessToken({ prompt: previous?.email ? '' : 'consent', login_hint: previous?.email })
  })
  if (!response.access_token) throw new Error(response.error ?? 'Google refused the sign-in.')
  // The consent screen lets the user untick Drive and still sign in; without it nothing can be backed up.
  if (response.scope && !response.scope.split(' ').includes(DRIVE_SCOPE)) {
    writeSession(null)
    throw new Error('Google Drive access was not allowed. Sign in again and tick the Drive box.')
  }
  const token = response.access_token
  const expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
  writeSession({ email: previous?.email, accessToken: token, expiresAt })
  const email = await fetchEmail(token)
  if (email) writeSession({ email, accessToken: token, expiresAt })
  return token
}

async function fetchEmail(token: string): Promise<string | undefined> {
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return undefined
    return ((await r.json()) as { email?: string }).email
  } catch {
    return undefined
  }
}

/** Forgets the session on this device. `revoke` also tells Google; the Drive files stay either way. */
export async function signOut(revoke = true): Promise<void> {
  const token = readSession()?.accessToken
  writeSession(null)
  if (!token || !revoke) return
  try {
    ;(await loadGis()).accounts.oauth2.revoke(token)
  } catch {
    // Offline: the token expires within the hour anyway.
  }
}
