// Keeps the screen on while the app is open (design §2, D-050, D-072). Nothing is shown when it cannot: the owner,
// 2026-11-27: "who changes a system setting for one app?", so the Auto-Lock notice went with D-072.
//
// TWO WAYS, BOTH TRIED:
// 1. The Screen Wake Lock API. Safari grants it only inside a tap, so a request at start may be refused; it is asked
//    for again on every tap while it is not held, when the app returns to the screen (Safari releases it in the
//    background), and when the system releases it.
// 2. A fallback the owner asked for: a tiny silent video in the app (keep-awake-video.ts) that plays on and on,
//    started by a tap (a video with sound may start only from one). A playing video with an audio track keeps the
//    screen on in WebKit. WebKit lets a video with the `loop` attribute sleep, so it is looped by hand: back to the
//    start after half a second. It always runs on an iPhone or iPad, because the wake lock in a home-screen app was
//    broken before iOS 18.4 while it still said it was held; elsewhere only while the wake lock is not held. The
//    audio session is set to `ambient` first, so the silent track mixes with the user's music instead of stopping it.
import { useEffect, useState } from 'react'
import { KEEP_AWAKE_MP4 } from './keep-awake-video'

export type WakeState = 'on' | 'unsupported' | 'refused' | 'off'

/** An iPhone or iPad (an iPad asks for the desktop page and reads as a Mac with touch). */
export function isAppleMobile(ua: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
}

function videoUrl(): string {
  const bytes = Uint8Array.from(atob(KEEP_AWAKE_MP4), (c) => c.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }))
}

/** The fallback video, off screen. Null where the browser cannot play it (and in jsdom). */
function makeVideo(): HTMLVideoElement | null {
  const video = document.createElement('video')
  if (!video.canPlayType('video/mp4')) return null
  video.setAttribute('playsinline', '')
  video.setAttribute('aria-hidden', 'true')
  video.setAttribute('tabindex', '-1')
  video.dataset.keepAwake = ''
  video.preload = 'auto'
  video.style.cssText =
    'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none'
  video.src = videoUrl()
  // Looped by hand (the header): a `loop` video does not keep the screen on.
  video.addEventListener('timeupdate', () => {
    if (video.currentTime > 0.5) video.currentTime = 0
  })
  video.addEventListener('ended', () => {
    video.currentTime = 0
    void video.play().catch(() => undefined)
  })
  document.body.append(video)
  return video
}

export function useWakeLock(active: boolean): WakeState {
  const [state, setState] = useState<WakeState>('off')
  useEffect(() => {
    if (!active) return
    const wl = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
    const apple = isAppleMobile(navigator.userAgent, navigator.maxTouchPoints ?? 0)
    let sentinel: WakeLockSentinel | null = null
    let asking = false
    let cancelled = false
    let video: HTMLVideoElement | null = null
    const held = () => sentinel !== null && !sentinel.released

    const request = async () => {
      if (!wl) {
        setState('unsupported')
        return
      }
      if (asking || held() || document.visibilityState !== 'visible') return
      asking = true
      try {
        const s = await wl.request('screen')
        if (cancelled) {
          void s.release().catch(() => undefined)
          return
        }
        sentinel = s
        setState('on')
        // Released by the system (low battery, the app in the background): asked for again at the next chance.
        s.addEventListener?.('release', () => {
          if (cancelled || sentinel !== s) return
          sentinel = null
          setState('off')
          void request()
        })
      } catch {
        if (!cancelled) setState('refused')
      } finally {
        asking = false
      }
    }

    /** Plays the fallback video: from a tap the first time; again when the app returns, where the browser allows. */
    const playVideo = () => {
      if (!apple && held()) return
      video ??= makeVideo()
      if (!video?.paused) return
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'ambient'
      void video.play()?.catch(() => undefined)
    }

    const onTap = () => {
      void request()
      playVideo()
    }
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void request()
      if (video) playVideo()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    // Capture, so a tap that a control stops still counts; `click` and `touchend` carry a user activation.
    window.addEventListener('click', onTap, true)
    window.addEventListener('touchend', onTap, true)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('click', onTap, true)
      window.removeEventListener('touchend', onTap, true)
      void sentinel?.release().catch(() => undefined)
      if (video) {
        video.pause()
        URL.revokeObjectURL(video.src)
        video.remove()
      }
      setState('off')
    }
  }, [active])
  return state
}
