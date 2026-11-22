/**
 * Installing the app (design §3.8, D-047): which platform this is, what its browser can do, the browser's own install
 * prompt, and whether the app is already installed on this device.
 *
 * What browsers allow (checked 2026-11-22):
 * - An install button needs the `beforeinstallprompt` event: Chromium browsers only (Chrome, Edge, Samsung Internet,
 *   Opera). Safari and Firefox have none, so they get written directions.
 * - Seeing that the app is installed needs `navigator.getInstalledRelatedApps()` and the manifest's
 *   `related_applications`: Chrome on Android 84+, Chrome and Edge on desktop 140+. WebKit and Firefox cannot tell.
 * - Opening the installed app from a tab: desktop Chrome 139+ opens a link that makes a new top-level page
 *   (`target="_blank"`) in the installed app ("navigation capturing"). Nothing else documents it, so elsewhere the page
 *   says where the app is.
 */
import { useEffect, useState, useSyncExternalStore } from 'react'

export type Platform =
  /** Safari on an iPhone or iPad: Share → Add to Home Screen. */
  | 'ios-safari'
  /** Chrome, Edge, Firefox and others on an iPhone or iPad (WebKit, iOS 16.4+): Share → Add to Home Screen. */
  | 'ios-browser'
  /** Safari on a Mac (17+): File → Add to Dock. */
  | 'mac-safari'
  /** Chrome, Edge, Samsung Internet, Opera on Android: the install prompt, or the menu. */
  | 'android-chromium'
  /** Firefox on Android: the menu. */
  | 'android-firefox'
  /** Chrome, Edge, Opera, Brave on Windows, macOS, Linux or ChromeOS: the install prompt, or the address bar. */
  | 'desktop-chromium'
  /** Firefox 143+ on Windows: the web app button in the address bar. */
  | 'windows-firefox'
  /** A browser inside another app (Instagram, Facebook, an Android web view): open the page in a real browser. */
  | 'in-app'
  /** Firefox on a Mac or Linux, and anything else: cannot install. */
  | 'unsupported'

export interface Device {
  userAgent: string
  /** An iPad asks for the desktop page and reads as a Mac; touch points tell them apart. */
  maxTouchPoints: number
}

const IN_APP =
  /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|MicroMessenger|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|Pinterest|GSA\//

/** The platform, from the user agent. Pure, so the table of user agents can be tested. */
export function detectPlatform({ userAgent: ua, maxTouchPoints }: Device): Platform {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  if (IN_APP.test(ua)) return 'in-app'
  if (ios) {
    // Every iOS browser says "Safari/"; an app's own web view does not.
    if (!/Safari\//.test(ua)) return 'in-app'
    return /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|Brave/.test(ua) ? 'ios-browser' : 'ios-safari'
  }
  if (/Android/.test(ua)) {
    if (/; wv\)/.test(ua)) return 'in-app'
    return /Firefox\//.test(ua) ? 'android-firefox' : 'android-chromium'
  }
  if (/Firefox\//.test(ua)) return /Windows/.test(ua) ? 'windows-firefox' : 'unsupported'
  if (/Chrome\/|Chromium\/|Edg\/|CrOS/.test(ua)) return 'desktop-chromium'
  if (/Macintosh/.test(ua) && /Safari\//.test(ua)) {
    const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0)
    return version >= 17 ? 'mac-safari' : 'unsupported'
  }
  return 'unsupported'
}

export function currentPlatform(): Platform {
  return detectPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0 })
}

/** Apple's installed web apps keep their own storage, apart from the browser's; Chromium's share the browser's. */
export function dataIsSeparate(p: Platform): boolean | null {
  if (p === 'ios-safari' || p === 'ios-browser' || p === 'mac-safari') return true
  if (p === 'android-chromium' || p === 'desktop-chromium') return false
  return null
}

/** Only desktop Chromium opens the installed app from a link in a tab (navigation capturing, Chrome 139+). */
export function canOpenFromTab(p: Platform): boolean {
  return p === 'desktop-chromium'
}

/** Platforms whose browser may offer an install prompt or report the installed app, worth a short wait. */
export function mayAnswerLater(p: Platform): boolean {
  return p === 'android-chromium' || p === 'desktop-chromium'
}

/** Where the installed app is found, finishing "Open Tortoise from …". */
export function appPlace(p: Platform): string {
  switch (p) {
    case 'ios-safari':
    case 'ios-browser':
      return 'the Home Screen'
    case 'mac-safari':
      return 'the Dock or Launchpad'
    case 'android-chromium':
    case 'android-firefox':
      return 'the home screen or the app list'
    case 'windows-firefox':
      return 'the taskbar or the Start menu'
    default:
      return 'your apps (the Start menu, Launchpad or the app launcher)'
  }
}

// --- The browser's install prompt -------------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PromptState {
  /** The browser offered an install prompt that is not used yet. */
  canPrompt: boolean
  /** The app was installed while this page was open. */
  installedNow: boolean
  /** The browser has offered a prompt on this page, so there is nothing left to wait for. */
  answered: boolean
}

let deferred: BeforeInstallPromptEvent | null = null
let state: PromptState = { canPrompt: false, installedNow: false, answered: false }
const listeners = new Set<() => void>()

function set(next: Partial<PromptState>) {
  state = { ...state, ...next }
  for (const l of listeners) l()
}

/**
 * Called once before the first render: the browser fires `beforeinstallprompt` early, often before React mounts.
 * Holding the event also keeps Chrome's own mini-infobar away, since the first run shows its own button.
 */
export function listenForInstallPrompt(target: Window = window) {
  target.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    set({ canPrompt: true, answered: true })
  })
  target.addEventListener('appinstalled', () => {
    deferred = null
    set({ canPrompt: false, installedNow: true })
  })
}

/** Shows the browser's install dialog. An event works once, so the button goes away whatever the answer. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const e = deferred
  if (!e) return 'unavailable'
  deferred = null
  set({ canPrompt: false })
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') set({ installedNow: true })
  return outcome
}

export function usePromptState(): PromptState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

/** For tests: forget any held prompt. */
export function resetInstallPrompt() {
  deferred = null
  set({ canPrompt: false, installedNow: false, answered: false })
}

// --- Is it installed here? ----------------------------------------------------------------------------------------

type RelatedApp = { platform: string; url?: string; id?: string }

/** True when the browser reports this app installed on the device; false when it says not, or cannot tell. */
export async function installedHere(): Promise<boolean> {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> }
  if (typeof nav.getInstalledRelatedApps !== 'function') return false
  try {
    const apps = await nav.getInstalledRelatedApps()
    return apps.some((a) => a.platform === 'webapp')
  } catch {
    return false
  }
}

const STANDALONE = '(display-mode: standalone)'

/** True when running as the installed app (iOS says so in `navigator.standalone`). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.(STANDALONE).matches === true
}

/** Like `isStandalone`, and follows a tab that the browser moves into an app window right after installing. */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(isStandalone)
  useEffect(() => {
    const mq = window.matchMedia?.(STANDALONE)
    if (!mq) return
    const onChange = () => setStandalone(isStandalone())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return standalone
}

export type InstallView = 'checking' | 'installed' | 'installed-now' | 'prompt' | 'manual'

/** How long the first run waits for a Chromium browser's prompt or its installed report before showing directions. */
export const ANSWER_WAIT_MS = 1500

/** Which install card to show. */
export function useInstallView(platform: Platform): InstallView {
  const { canPrompt, installedNow, answered } = usePromptState()
  const [detected, setDetected] = useState(false)
  const [waited, setWaited] = useState(() => !mayAnswerLater(platform))
  useEffect(() => {
    let live = true
    void installedHere().then((yes) => {
      if (live && yes) setDetected(true)
    })
    const timer = setTimeout(() => setWaited(true), ANSWER_WAIT_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [])
  return chooseView({ installedNow, detected, canPrompt, waited: waited || answered })
}

/** The choice itself, pure: a fresh install first, then a reported one, then the prompt, then directions. */
export function chooseView(s: {
  installedNow: boolean
  detected: boolean
  canPrompt: boolean
  waited: boolean
}): InstallView {
  if (s.installedNow) return 'installed-now'
  if (s.detected) return 'installed'
  if (s.canPrompt) return 'prompt'
  return s.waited ? 'manual' : 'checking'
}
