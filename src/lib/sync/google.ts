// Signing in with Google in the browser, for the Google Drive sync (D-054, D-055), after the French app's
// src/features/sync/google.ts. There is no server, so this is Google Identity Services' token model: the page asks
// Google for an access token for the `drive.appdata` scope only, which reaches one hidden folder that belongs to this
// app in the user's Drive and nothing else.
//
// AN HOUR-LONG TOKEN, AND HOW THE SYNC KEEPS GOING WITHOUT A TAP (D-055). A browser-only sign-in gets no refresh
// token: a token lasts an hour and is kept in localStorage, so a reload within the hour still syncs. After that:
//   1. `silentToken()` asks Google in a hidden frame with `prompt=none`: no popup, no tap, nothing on screen. Google
//      answers with a token when the user is signed in there and has consented already. It needs Google's cookies
//      inside the frame, which Safari refuses, and `<origin>/oauth-silent.html` registered as a redirect URI of the
//      client (the owner's step in the Google Cloud console). When either fails there is no token and no harm, and a
//      refusal is not asked again for ten minutes.
//   2. The fallback is the user's next tap anywhere in the app (`sync.ts`): a tap may open a popup, and with consent
//      already given Google's popup closes by itself.
//
// Google's script is loaded only once the user has signed in (on the sign-in tap, or at start when a session is
// stored): an app nobody signed into makes no third-party request.

/**
 * The OAuth client ID: the French app's Web client (owner's picker, 2026-11-23). Public by design: it names the app
 * to Google, it is not a secret. Its authorised JavaScript origins must list https://tortoise.doctornova.net and its
 * authorised redirect URIs https://tortoise.doctornova.net/oauth-silent.html (the owner's steps in the Google Cloud
 * console).
 */
export const GOOGLE_CLIENT_ID = '392431386089-a3baa70ro45r5uegru6hjc23o9ptkhgj.apps.googleusercontent.com'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const SCOPE = `${DRIVE_SCOPE} email`
const KEY = 'tortoise.google'

/** Google's own authorization endpoint, for the silent renew (Google Identity Services has no silent mode). */
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
/** The page Google sends the silent renew's answer to; it posts it back (`public/oauth-silent.html`). */
export const SILENT_PATH = '/oauth-silent.html'
export const FRAME_MESSAGE = 'tortoise/oauth-silent'
/** Set once the hidden-frame renew has worked in this browser; `silentWorks()` reads it. */
const SILENT_OK_KEY = 'tortoise.googleSilent'
/** Google answers a silent ask in well under a second; a frame that says nothing has failed. */
const SILENT_TIMEOUT_MS = 8_000
/** A refused silent renew is not asked again before this: each try is a frame and a round trip. */
const SILENT_COOLDOWN_MS = 10 * 60_000

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
 * Fetches Google's script now, so that a sign-in on the next tap opens its popup inside that tap (Safari allows a popup
 * only in the same turn as the gesture). Only when a session is stored.
 */
export function preloadGis(): void {
  if (typeof document === 'undefined' || !readSession()?.email) return
  loadGis().catch(() => {
    // Offline, or Google unreachable: the tap that needs it loads it then, with its own error.
  })
}

/** The silent renew's address. */
export function silentUrl(origin: string, state: string, email?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}${SILENT_PATH}`,
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
    // Nothing on screen: Google answers with a token, or with an error such as `login_required`.
    prompt: 'none',
    state,
  })
  // The account to renew, so a browser signed into several answers for the right one.
  if (email) params.set('login_hint', email)
  return `${AUTH_ENDPOINT}?${params}`
}

/**
 * Loads `url` in a hidden frame and resolves with what `oauth-silent.html` posts back (the fragment Google redirected
 * to, as a map), or null when nothing comes back in time: Google refused to be framed, the redirect URI is not
 * registered, no network.
 */
function askInFrame(url: string, state: string): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('tabindex', '-1')
    frame.title = 'Google sign-in'
    frame.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;border:0'
    let settled = false
    const finish = (params: Record<string, string> | null) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      frame.remove()
      resolve(params)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { source?: string; params?: Record<string, string> } | null
      if (data?.source !== FRAME_MESSAGE) return
      // A reply to another ask (or a forged one) is not this renew's answer.
      if (data.params?.state !== state) return
      finish(data.params)
    }
    const timer = setTimeout(() => finish(null), SILENT_TIMEOUT_MS)
    window.addEventListener('message', onMessage)
    frame.src = url
    document.body.appendChild(frame)
  })
}

let silentBlockedUntil = 0

/**
 * Whether the hidden-frame renew has ever worked in this browser. A tap's sign-in waits for a silent try only here:
 * where the frame has never worked (Safari), a tap goes straight to the popup, which must open inside the gesture.
 */
export function silentWorks(): boolean {
  try {
    return localStorage.getItem(SILENT_OK_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * A new token with no popup and nothing on screen: the hidden-frame renew of the header. Resolves with the token, or
 * null when Google or the browser refuses, which is the normal case in Safari.
 */
export async function silentToken(): Promise<string | null> {
  if (typeof document === 'undefined') return null
  const session = readSession()
  // Never signed in here: a silent ask can only be refused, and consent needs a screen.
  if (!session?.email) return null
  if (Date.now() < silentBlockedUntil) return null
  const state = crypto.randomUUID()
  const params = await askInFrame(silentUrl(window.location.origin, state, session.email), state)
  const token = params?.access_token
  const scopes = params?.scope?.split(' ')
  if (!params || !token || (scopes && !scopes.includes(DRIVE_SCOPE))) {
    silentBlockedUntil = Date.now() + SILENT_COOLDOWN_MS
    return null
  }
  try {
    localStorage.setItem(SILENT_OK_KEY, '1')
  } catch {
    // Storage refused: a tap renews instead, which always works.
  }
  const expiresIn = Number(params.expires_in)
  writeSession({
    email: session.email,
    accessToken: token,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000,
  })
  return token
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
  // The consent screen lets the user untick Drive and still sign in; without it nothing can be synced.
  if (response.scope && !response.scope.split(' ').includes(DRIVE_SCOPE)) {
    writeSession(null)
    throw new Error('Google Drive access was not allowed. Sign in again and tick the Drive box.')
  }
  const token = response.access_token
  const expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
  writeSession({ email: previous?.email, accessToken: token, expiresAt })
  // Consent is fresh, so a silent renew may work now even if it was refused before.
  silentBlockedUntil = 0
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

/** For tests: forget the silent renew's cooldown and Google's script. */
export function resetGoogleForTests(): void {
  silentBlockedUntil = 0
  gis = null
}
